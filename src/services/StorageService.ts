import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  PutBucketCorsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomBytes, randomUUID } from "node:crypto";
import { basename } from "node:path";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  EmbedBuilder,
  TextBasedChannel,
} from "discord.js";
import { env } from "../utilities/env.js";
import UploadModel, { IUpload } from "../models/uploadModel.js";
import Logger from "../helpers/Logger.js";

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export interface UploadSession {
  token: string;
  userId: string;
  userTag: string;
  channelId: string;
  channelName?: string;
  guildId: string | null;
  guildName?: string;
  createdAt: number;
  expiresAt: number;
}

export class StorageService {
  public static get MAX_FILE_SIZE_BYTES(): number {
    return env.MAX_FILE_SIZE_BYTES;
  }
  public static get USER_STORAGE_LIMIT_BYTES(): number {
    return env.USER_STORAGE_LIMIT_BYTES;
  }
  public static get GLOBAL_ACTIVE_STORAGE_LIMIT_BYTES(): number {
    return env.GLOBAL_STORAGE_LIMIT_BYTES;
  }
  public static DEFAULT_EXPIRY_HOURS = 6;
  public static MAX_EXPIRY_HOURS = 24;
  public static SESSION_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 mins

  private static s3ClientInstance: S3Client | null = null;
  private static activeSessions = new Map<string, UploadSession>();
  private static cleanupInterval: NodeJS.Timeout | null = null;

  private static get B2_KEY_ID(): string | undefined {
    return env.B2_KEY_ID || process.env.B2_KEY_ID;
  }
  private static get B2_APPLICATION_KEY(): string | undefined {
    return env.B2_APPLICATION_KEY || process.env.B2_APPLICATION_KEY;
  }
  private static get B2_BUCKET_NAME(): string | undefined {
    return env.B2_BUCKET_NAME || process.env.B2_BUCKET_NAME;
  }
  private static get B2_ENDPOINT(): string | undefined {
    return env.B2_ENDPOINT || process.env.B2_ENDPOINT;
  }
  private static get B2_REGION(): string | undefined {
    return env.B2_REGION || process.env.B2_REGION || "us-east-005";
  }

  public static isConfigured(): boolean {
    return Boolean(
      this.B2_KEY_ID &&
        this.B2_APPLICATION_KEY &&
        this.B2_BUCKET_NAME &&
        this.B2_ENDPOINT
    );
  }

  public static getS3Client(): S3Client {
    if (!this.s3ClientInstance) {
      if (!this.isConfigured()) {
        throw new Error("Backblaze B2 storage is not configured in environment.");
      }
      this.s3ClientInstance = new S3Client({
        endpoint: this.B2_ENDPOINT!,
        region: this.B2_REGION,
        credentials: {
          accessKeyId: this.B2_KEY_ID!,
          secretAccessKey: this.B2_APPLICATION_KEY!,
        },
      });
    }
    return this.s3ClientInstance;
  }

  public static getBucketName(): string {
    return this.B2_BUCKET_NAME!;
  }

  /**
   * Configures CORS on the Backblaze B2 bucket to permit direct browser PUT, GET, HEAD uploads.
   */
  public static async configureBucketCors(): Promise<void> {
    if (!this.isConfigured()) return;
    try {
      const s3 = this.getS3Client();
      await s3.send(
        new PutBucketCorsCommand({
          Bucket: this.B2_BUCKET_NAME!,
          CORSConfiguration: {
            CORSRules: [
              {
                AllowedHeaders: ["*"],
                AllowedMethods: ["PUT", "GET", "HEAD"],
                AllowedOrigins: ["*"],
                MaxAgeSeconds: 3600,
              },
            ],
          },
        })
      );
      Logger.info("Backblaze B2 bucket CORS configured successfully.");
    } catch (err: any) {
      Logger.warn("Could not set B2 bucket CORS automatically (key may lack PutBucketCors perm):", err?.message);
    }
  }

  /**
   * Calculates current total bytes stored across the system (active + recent pending).
   */
  public static async getActiveStorageBytes(): Promise<number> {
    const result = await UploadModel.aggregate([
      {
        $match: {
          $or: [
            { status: "active", expiresAt: { $gt: new Date() } },
            {
              status: "pending",
              createdAt: { $gt: new Date(Date.now() - 30 * 60 * 1000) },
            },
          ],
        },
      },
      { $group: { _id: null, totalBytes: { $sum: "$fileSize" } } },
    ]);
    return result[0]?.totalBytes || 0;
  }

  /**
   * Calculates current active (and recent pending) storage bytes consumed by a user.
   */
  public static async getUserActiveStorageBytes(
    userId: string,
    excludeFileId?: string
  ): Promise<number> {
    const match: any = {
      userId,
      $or: [
        { status: "active", expiresAt: { $gt: new Date() } },
        {
          status: "pending",
          createdAt: { $gt: new Date(Date.now() - 30 * 60 * 1000) },
        },
      ],
    };

    if (excludeFileId) {
      match.fileId = { $ne: excludeFileId };
    }

    const result = await UploadModel.aggregate([
      { $match: match },
      { $group: { _id: null, totalBytes: { $sum: "$fileSize" } } },
    ]);
    return result[0]?.totalBytes || 0;
  }

  /**
   * Generates a 15-minute one-time upload session token for a user.
   */
  public static async createSession(
    userId: string,
    userTag: string,
    channelId: string,
    guildId: string | null,
    channelName?: string,
    guildName?: string
  ): Promise<{
    success: boolean;
    token?: string;
    url?: string;
    userUsedBytes?: number;
    userRemainingBytes?: number;
    error?: string;
  }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: "❌ Cloud storage is currently disabled or unconfigured.",
      };
    }

    // Check user active storage limit (size-based cap, e.g. 1 GiB)
    const userUsedBytes = await this.getUserActiveStorageBytes(userId);
    if (userUsedBytes >= this.USER_STORAGE_LIMIT_BYTES) {
      return {
        success: false,
        error: `⏳ You have reached your active cloud storage limit (${formatBytes(
          userUsedBytes
        )} / ${formatBytes(
          this.USER_STORAGE_LIMIT_BYTES
        )}). Please wait for your previous files to expire or run \`p!rm\` to free up space!`,
      };
    }

    // Check global pool capacity
    const activeBytes = await this.getActiveStorageBytes();
    if (activeBytes >= this.GLOBAL_ACTIVE_STORAGE_LIMIT_BYTES) {
      return {
        success: false,
        error: `⚠️ Free tier storage capacity is currently full (${formatBytes(
          activeBytes
        )} / ${formatBytes(
          this.GLOBAL_ACTIVE_STORAGE_LIMIT_BYTES
        )}). Please wait for active files to expire.`,
      };
    }

    const token = randomUUID();
    const now = Date.now();
    const session: UploadSession = {
      token,
      userId,
      userTag,
      channelId,
      channelName,
      guildId,
      guildName,
      createdAt: now,
      expiresAt: now + this.SESSION_TOKEN_TTL_MS,
    };

    this.activeSessions.set(token, session);

    // Auto-clean expired sessions from memory
    setTimeout(() => {
      this.activeSessions.delete(token);
    }, this.SESSION_TOKEN_TTL_MS);

    return {
      success: true,
      token,
      url: `${env.PUBLIC_BASE_URL}/upload?token=${token}`,
      userUsedBytes,
      userRemainingBytes: Math.max(0, this.USER_STORAGE_LIMIT_BYTES - userUsedBytes),
    };
  }

  public static getSession(token: string): UploadSession | null {
    const session = this.activeSessions.get(token);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      this.activeSessions.delete(token);
      return null;
    }
    return session;
  }

  /**
   * Pre-signs an S3 PUT URL for direct browser-to-B2 upload.
   */
  public static async initiateUpload(
    token: string,
    fileName: string,
    fileSize: number,
    mimeType: string,
    expiryHours = StorageService.DEFAULT_EXPIRY_HOURS
  ): Promise<{
    success: boolean;
    uploadUrl?: string;
    fileId?: string;
    error?: string;
  }> {
    const session = this.getSession(token);
    if (!session) {
      return {
        success: false,
        error: "Session expired or invalid. Please run `/upload` again in Discord.",
      };
    }

    if (fileSize <= 0 || fileSize > this.MAX_FILE_SIZE_BYTES) {
      return {
        success: false,
        error: `File exceeds maximum allowed limit of ${formatBytes(
          this.MAX_FILE_SIZE_BYTES
        )} (1 GiB).`,
      };
    }

    const userUsedBytes = await this.getUserActiveStorageBytes(session.userId);
    if (userUsedBytes + fileSize > this.USER_STORAGE_LIMIT_BYTES) {
      const remainingBytes = Math.max(0, this.USER_STORAGE_LIMIT_BYTES - userUsedBytes);
      return {
        success: false,
        error: `⚠️ This file (${formatBytes(fileSize)}) exceeds your remaining storage quota (${formatBytes(
          remainingBytes
        )} remaining of ${formatBytes(this.USER_STORAGE_LIMIT_BYTES)}). Free up space with \`p!rm\`!`,
      };
    }

    const activeBytes = await this.getActiveStorageBytes();
    if (activeBytes + fileSize > this.GLOBAL_ACTIVE_STORAGE_LIMIT_BYTES) {
      return {
        success: false,
        error: `Storage capacity reached. Adding this file would exceed the free storage limit (${formatBytes(
          this.GLOBAL_ACTIVE_STORAGE_LIMIT_BYTES
        )}).`,
      };
    }

    // Strict 6-hour expiry (no custom override permitted)
    const expiresAt = new Date(Date.now() + this.DEFAULT_EXPIRY_HOURS * 3600 * 1000);

    const fileId = randomBytes(6).toString("hex");
    const rawBase = basename(fileName).replace(/[\r\n\0]/g, "").trim();
    const sanitizedName =
      rawBase
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .replace(/\.{2,}/g, ".")
        .slice(0, 100) || "upload.bin";
    const s3Key = `uploads/${fileId}/${sanitizedName}`;

    try {
      const s3 = this.getS3Client();
      const putCommand = new PutObjectCommand({
        Bucket: this.B2_BUCKET_NAME!,
        Key: s3Key,
      });

      // 30-minute presigned PUT URL allowing sufficient upload time
      const uploadUrl = await getSignedUrl(s3, putCommand, { expiresIn: 1800 });

      // Create pending upload record
      await UploadModel.create({
        fileId,
        sessionToken: token,
        userId: session.userId,
        userTag: session.userTag,
        channelId: session.channelId,
        guildId: session.guildId,
        fileName: sanitizedName,
        fileSize,
        mimeType: mimeType || "application/octet-stream",
        s3Key,
        status: "pending",
        expiresAt,
      });

      // Consume session token so it cannot be reused
      this.activeSessions.delete(token);

      return {
        success: true,
        uploadUrl,
        fileId,
      };
    } catch (err: any) {
      Logger.error("Failed to generate presigned PUT URL:", err);
      return {
        success: false,
        error: "Failed to initiate storage session with Backblaze B2.",
      };
    }
  }

  /**
   * Finalizes the upload after the browser successfully completes the direct PUT to B2.
   * Verifies file headers on B2, updates status to active, and posts the Discord message.
   */
  public static async completeUpload(
    fileId: string,
    client: Client
  ): Promise<{
    success: boolean;
    upload?: IUpload;
    shareUrl?: string;
    discordUrl?: string;
    error?: string;
  }> {
    const upload = await UploadModel.findOne({ fileId, status: "pending" });
    if (!upload) {
      return { success: false, error: "Upload record not found or already completed." };
    }

    try {
      const s3 = this.getS3Client();
      // Verify object exists in B2 and get verified content length
      const head = await s3.send(
        new HeadObjectCommand({
          Bucket: this.B2_BUCKET_NAME!,
          Key: upload.s3Key,
        })
      );

      const verifiedLength = head.ContentLength || upload.fileSize;
      if (verifiedLength > this.MAX_FILE_SIZE_BYTES) {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: this.B2_BUCKET_NAME!,
            Key: upload.s3Key,
          })
        );
        upload.status = "expired";
        await upload.save();
        return {
          success: false,
          error: `File exceeds maximum allowed size (${formatBytes(this.MAX_FILE_SIZE_BYTES)}).`,
        };
      }

      const userOtherBytes = await this.getUserActiveStorageBytes(upload.userId, upload.fileId);
      if (userOtherBytes + verifiedLength > this.USER_STORAGE_LIMIT_BYTES) {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: this.B2_BUCKET_NAME!,
            Key: upload.s3Key,
          })
        );
        upload.status = "expired";
        await upload.save();
        return {
          success: false,
          error: `Upload rejected: file size exceeds your available storage quota.`,
        };
      }

      upload.fileSize = verifiedLength;
      upload.status = "active";
      await upload.save();

      // Send Discord announcement message
      if (client) {
        await this.postDiscordAnnouncement(upload, client);
        await this.sendUploaderDm(upload, client);
      }

      const shareUrl = `${env.PUBLIC_BASE_URL}/file/${upload.fileId}`;
      const discordUrl = upload.guildId && upload.channelId
        ? (upload.discordMessageId
            ? `https://discord.com/channels/${upload.guildId}/${upload.channelId}/${upload.discordMessageId}`
            : `https://discord.com/channels/${upload.guildId}/${upload.channelId}`)
        : (upload.channelId ? `https://discord.com/channels/@me/${upload.channelId}` : undefined);

      return { success: true, upload, shareUrl, discordUrl };
    } catch (err: any) {
      Logger.error(`Error completing upload ${fileId}:`, err);
      return {
        success: false,
        error: "Could not verify uploaded file in cloud storage.",
      };
    }
  }

  /**
   * Directly messages the uploader with the shareable link to their uploaded file.
   */
  private static async sendUploaderDm(
    upload: IUpload,
    client: Client
  ): Promise<void> {
    try {
      const uploader = await client.users.fetch(upload.userId).catch(() => null);
      if (!uploader) return;

      const shareUrl = `${env.PUBLIC_BASE_URL}/file/${upload.fileId}`;
      const expireTs = Math.floor(upload.expiresAt.getTime() / 1000);

      const channelNotice = upload.channelId
        ? (upload.guildId
            ? `💬 **Posted in:** <#${upload.channelId}>\n\n`
            : `💬 **Posted in:** Direct Messages\n\n`)
        : "";

      const embed = new EmbedBuilder()
        .setTitle("☁️ File Uploaded Successfully")
        .setColor((client as any).color || 0x5865f2)
        .setDescription(
          `Your file **${upload.fileName}** (\`${formatBytes(upload.fileSize)}\`) is ready!\n\n` +
            channelNotice +
            `🔗 **Shareable Link:**\n${shareUrl}\n\n` +
            `⏳ **Expires:** <t:${expireTs}:R> (<t:${expireTs}:f>)\n\n` +
            `You can copy and share this link anywhere you want.`
        );

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel("Open File Page")
          .setEmoji("🔗")
          .setStyle(ButtonStyle.Link)
          .setURL(shareUrl)
      );

      const jumpUrl = upload.guildId && upload.channelId
        ? (upload.discordMessageId
            ? `https://discord.com/channels/${upload.guildId}/${upload.channelId}/${upload.discordMessageId}`
            : `https://discord.com/channels/${upload.guildId}/${upload.channelId}`)
        : (upload.channelId ? `https://discord.com/channels/@me/${upload.channelId}` : null);

      if (jumpUrl) {
        row.addComponents(
          new ButtonBuilder()
            .setLabel("View in Channel")
            .setEmoji("💬")
            .setStyle(ButtonStyle.Link)
            .setURL(jumpUrl)
        );
      }

      await uploader.send({
        embeds: [embed],
        components: [row],
      }).catch(() => {});
    } catch (err: any) {
      Logger.warn(`Could not deliver upload DM to user ${upload.userId}:`, err?.message);
    }
  }

  /**
   * Sends the rich announcement message to the Discord channel.
   */
  private static async postDiscordAnnouncement(
    upload: IUpload,
    client: Client
  ): Promise<void> {
    try {
      const channel = (await client.channels.fetch(
        upload.channelId
      )) as TextBasedChannel | null;
      if (!channel || !("send" in channel)) return;

      const downloadPageUrl = `${env.PUBLIC_BASE_URL}/file/${upload.fileId}`;

      const isImage = /^image\/(png|jpe?g|gif|webp)$/i.test(upload.mimeType);
      const isVideo = /^video\/(mp4|webm)$/i.test(upload.mimeType);
      const isAudio = /^audio\/(mpeg|mp3|ogg|wav)$/i.test(upload.mimeType);
      let user = client.users.cache.get(upload.userId);
      if (!user) {
        try {
          user = await client.users.fetch(upload.userId);
        } catch {}
      }
      const authorName = user?.tag || upload.userTag || "Unknown User";
      const authorIcon = user?.displayAvatarURL?.() || undefined;

      const embed = new EmbedBuilder()
        .setAuthor({ name: authorName, iconURL: authorIcon })
        .setColor((client as any).color || 0x5865f2)
        .setDescription(`**${upload.fileName}** • \`${formatBytes(upload.fileSize)}\``)
        .setTimestamp(upload.createdAt);

      // Direct embed image preview if supported
      if (isImage) {
        const previewUrl = `${env.PUBLIC_BASE_URL}/api/file/${upload.fileId}/view`;
        embed.setImage(previewUrl);
      }

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel("Download File")
          .setEmoji("📥")
          .setStyle(ButtonStyle.Link)
          .setURL(downloadPageUrl)
      );

      let content = "";
      if (isVideo) {
        content = `🎬 **Video Preview:** ${env.PUBLIC_BASE_URL}/api/file/${upload.fileId}/view`;
      } else if (isAudio) {
        content = `🎵 **Audio File:** ${upload.fileName}`;
      }

      const sent = await channel.send({
        content: content || undefined,
        embeds: [embed],
        components: [row],
      });

      upload.discordMessageId = sent.id;
      await upload.save();
    } catch (err: any) {
      Logger.error("Failed to post Discord upload announcement:", err);
    }
  }

  /**
   * Generates a 1-hour presigned GET download URL with Content-Disposition: attachment.
   */
  public static async getDownloadUrl(
    fileId: string
  ): Promise<{ url: string; upload: IUpload } | null> {
    const upload = await UploadModel.findOne({
      fileId,
      status: "active",
      expiresAt: { $gt: new Date() },
    });
    if (!upload) return null;

    try {
      const s3 = this.getS3Client();
      const getCommand = new GetObjectCommand({
        Bucket: this.B2_BUCKET_NAME!,
        Key: upload.s3Key,
        ResponseContentDisposition: `attachment; filename="${encodeURIComponent(
          upload.fileName
        )}"`,
      });

      const url = await getSignedUrl(s3, getCommand, { expiresIn: 3600 });
      upload.downloadCount++;
      await upload.save();

      return { url, upload };
    } catch (err: any) {
      Logger.error(`Error generating download URL for ${fileId}:`, err);
      return null;
    }
  }

  /**
   * Generates a 1-hour presigned GET view URL with inline Content-Disposition for browser display.
   */
  public static async getViewUrl(
    fileId: string
  ): Promise<{ url: string; mimeType: string } | null> {
    const upload = await UploadModel.findOne({
      fileId,
      status: "active",
      expiresAt: { $gt: new Date() },
    });
    if (!upload) return null;

    // Strict whitelist of safe media types that can be displayed inline in browser
    const SAFE_INLINE_MIME_TYPES = new Set([
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/gif",
      "image/webp",
      "image/avif",
      "video/mp4",
      "video/webm",
      "audio/mpeg",
      "audio/mp3",
      "audio/ogg",
      "audio/wav",
      "text/plain",
    ]);

    const isSafeInline = SAFE_INLINE_MIME_TYPES.has(upload.mimeType.toLowerCase());
    const responseContentType = isSafeInline ? upload.mimeType : "application/octet-stream";
    const disposition = isSafeInline ? "inline" : "attachment";

    try {
      const s3 = this.getS3Client();
      const getCommand = new GetObjectCommand({
        Bucket: this.B2_BUCKET_NAME!,
        Key: upload.s3Key,
        ResponseContentType: responseContentType,
        ResponseContentDisposition: `${disposition}; filename="${encodeURIComponent(
          upload.fileName
        )}"`,
      });

      const url = await getSignedUrl(s3, getCommand, { expiresIn: 3600 });
      return { url, mimeType: responseContentType };
    } catch (err: any) {
      Logger.error(`Error generating view URL for ${fileId}:`, err);
      return null;
    }
  }

  /**
   * Background cleanup worker: runs every 5 minutes to purge expired files from B2.
   */
  public static startCleanupWorker(client?: Client): void {
    if (this.cleanupInterval) return;

    const runCleanup = async () => {
      try {
        if (!this.isConfigured()) return;
        const now = new Date();
        const expiredUploads = await UploadModel.find({
          status: "active",
          expiresAt: { $lte: now },
        }).limit(20);

        if (expiredUploads.length === 0) return;

        const s3 = this.getS3Client();
        for (const upload of expiredUploads) {
          try {
            Logger.info(`Purging expired file from B2: ${upload.fileName} (${upload.fileId})`);
            await s3.send(
              new DeleteObjectCommand({
                Bucket: this.B2_BUCKET_NAME!,
                Key: upload.s3Key,
              })
            );

            upload.status = "expired";
            await upload.save();

            // Update Discord announcement message if available
            if (client && upload.discordMessageId && upload.channelId) {
              try {
                const channel = (await client.channels.fetch(
                  upload.channelId
                )) as TextBasedChannel | null;
                if (channel && "messages" in channel) {
                  const message = await channel.messages.fetch(upload.discordMessageId);
                  if (message) {
                    await message.edit({
                      content: `⚠️ **This file (${upload.fileName}) has expired and has been deleted.**`,
                      components: [], // Remove download button
                      embeds: [],
                    });
                  }
                }
              } catch {
                // Ignore Discord message update errors (message deleted, channel missing, etc.)
              }
            }
          } catch (deleteErr: any) {
            Logger.error(`Failed to delete expired file ${upload.fileId}:`, deleteErr);
          }
        }

        // Purge abandoned pending uploads older than 30 minutes
        const abandonedUploads = await UploadModel.find({
          status: "pending",
          createdAt: { $lte: new Date(now.getTime() - 30 * 60 * 1000) },
        }).limit(20);

        for (const abandoned of abandonedUploads) {
          try {
            if (s3 && abandoned.s3Key && this.B2_BUCKET_NAME) {
              await s3.send(
                new DeleteObjectCommand({
                  Bucket: this.B2_BUCKET_NAME,
                  Key: abandoned.s3Key,
                })
              );
            }
          } catch {}
          abandoned.status = "expired";
          await abandoned.save();
        }
      } catch (err: any) {
        Logger.error("Storage cleanup sweep failed:", err);
      }
    };

    // Run sweep after 10 seconds on boot, then every 5 minutes
    setTimeout(runCleanup, 10_000);
    this.cleanupInterval = setInterval(runCleanup, 5 * 60 * 1000);
    Logger.info("StorageService cleanup worker scheduled (5-minute interval).");
  }

  public static stopCleanupWorker(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Removes active upload(s) for a specific user to free up their upload slot.
   * Purges file(s) from Backblaze B2, marks DB records as expired, and cleans pending sessions.
   */
  public static async removeUserUploads(
    userId: string,
    fileIdOrName?: string | null,
    client?: Client
  ): Promise<{ deletedCount: number; freedBytes: number; files: string[] }> {
    // 1. Purge any in-memory pending sessions for this user
    for (const [token, session] of this.activeSessions.entries()) {
      if (session.userId === userId) {
        this.activeSessions.delete(token);
      }
    }

    // 2. Build query for active/pending uploads
    const query: any = { userId };
    if (fileIdOrName && fileIdOrName.trim().length > 0) {
      let trimmed = fileIdOrName.trim();
      const match = trimmed.match(/\/file\/([a-f0-9]{12})/i);
      if (match) {
        trimmed = match[1];
      }
      query.$or = [{ fileId: trimmed }, { fileName: trimmed }];
    } else {
      query.status = { $in: ["active", "pending"] };
    }

    const uploads = await UploadModel.find(query);
    if (uploads.length === 0) {
      return { deletedCount: 0, freedBytes: 0, files: [] };
    }

    const deletedFiles: string[] = [];
    let freedBytes = 0;
    let s3: S3Client | null = null;
    if (this.isConfigured()) {
      try {
        s3 = this.getS3Client();
      } catch {}
    }

    for (const upload of uploads) {
      // Delete from B2 if s3Key exists
      if (s3 && upload.s3Key && this.B2_BUCKET_NAME) {
        try {
          await s3.send(
            new DeleteObjectCommand({
              Bucket: this.B2_BUCKET_NAME,
              Key: upload.s3Key,
            })
          );
        } catch (err: any) {
          Logger.warn(`Could not delete object ${upload.s3Key} from B2:`, err?.message);
        }
      }

      upload.status = "expired";
      upload.expiresAt = new Date();
      await upload.save();
      freedBytes += upload.fileSize || 0;
      deletedFiles.push(upload.fileName);

      // Update Discord announcement message if available
      if (client && upload.discordMessageId && upload.channelId) {
        try {
          const channel = (await client.channels.fetch(upload.channelId)) as TextBasedChannel | null;
          if (channel && "messages" in channel) {
            const message = await channel.messages.fetch(upload.discordMessageId);
            if (message) {
              await message.edit({
                content: `🗑️ **This file (\`${upload.fileName}\`) was removed by the uploader.**`,
                components: [],
                embeds: [],
              }).catch(() => {});
            }
          }
        } catch {}
      }
    }

    return { deletedCount: deletedFiles.length, freedBytes, files: deletedFiles };
  }
}

export default StorageService;
