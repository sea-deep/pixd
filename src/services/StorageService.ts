import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomBytes, randomUUID } from "node:crypto";
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
  guildId: string | null;
  createdAt: number;
  expiresAt: number;
}

export class StorageService {
  public static MAX_FILE_SIZE_BYTES = 1024 * 1024 * 1024; // 1 GiB
  public static GLOBAL_ACTIVE_STORAGE_LIMIT_BYTES = 8 * 1024 * 1024 * 1024; // 8 GiB
  public static MAX_ACTIVE_FILES_PER_USER = 2;
  public static DEFAULT_EXPIRY_HOURS = 6;
  public static MAX_EXPIRY_HOURS = 24;
  public static SESSION_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 mins

  private static s3ClientInstance: S3Client | null = null;
  private static activeSessions = new Map<string, UploadSession>();
  private static cleanupInterval: NodeJS.Timeout | null = null;

  public static isConfigured(): boolean {
    return Boolean(
      env.B2_KEY_ID &&
        env.B2_APPLICATION_KEY &&
        env.B2_BUCKET_NAME &&
        env.B2_ENDPOINT
    );
  }

  public static getS3Client(): S3Client {
    if (!this.s3ClientInstance) {
      if (!this.isConfigured()) {
        throw new Error("Backblaze B2 storage is not configured in environment.");
      }
      this.s3ClientInstance = new S3Client({
        endpoint: env.B2_ENDPOINT!,
        region: env.B2_REGION || "us-east-005",
        credentials: {
          accessKeyId: env.B2_KEY_ID!,
          secretAccessKey: env.B2_APPLICATION_KEY!,
        },
      });
    }
    return this.s3ClientInstance;
  }

  /**
   * Calculates current total bytes stored by active unexpired files.
   */
  public static async getActiveStorageBytes(): Promise<number> {
    const result = await UploadModel.aggregate([
      { $match: { status: "active", expiresAt: { $gt: new Date() } } },
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
    guildId: string | null
  ): Promise<{ success: boolean; token?: string; url?: string; error?: string }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: "❌ Cloud storage is currently disabled or unconfigured.",
      };
    }

    // Check user active files limit
    const userActiveCount = await UploadModel.countDocuments({
      userId,
      status: "active",
      expiresAt: { $gt: new Date() },
    });

    if (userActiveCount >= this.MAX_ACTIVE_FILES_PER_USER) {
      return {
        success: false,
        error: `⏳ You already have **${userActiveCount}** active upload${
          userActiveCount === 1 ? "" : "s"
        }. Please wait for your previous files to expire before uploading more!`,
      };
    }

    // Check global pool capacity
    const activeBytes = await this.getActiveStorageBytes();
    if (activeBytes >= this.GLOBAL_ACTIVE_STORAGE_LIMIT_BYTES) {
      return {
        success: false,
        error: `⚠️ Free tier storage capacity is currently full (${formatBytes(
          activeBytes
        )} / 8 GB). Please wait for active files to expire.`,
      };
    }

    const token = randomUUID();
    const now = Date.now();
    const session: UploadSession = {
      token,
      userId,
      userTag,
      channelId,
      guildId,
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

    const activeBytes = await this.getActiveStorageBytes();
    if (activeBytes + fileSize > this.GLOBAL_ACTIVE_STORAGE_LIMIT_BYTES) {
      return {
        success: false,
        error: `Storage capacity reached. Adding this file would exceed the 8 GB free storage limit.`,
      };
    }

    // Strict 6-hour expiry (no custom override permitted)
    const expiresAt = new Date(Date.now() + this.DEFAULT_EXPIRY_HOURS * 3600 * 1000);

    const fileId = randomBytes(6).toString("hex");
    const sanitizedName =
      fileName.replace(/[^\w.-]/g, "_").slice(0, 100) || "upload.bin";
    const s3Key = `uploads/${fileId}/${sanitizedName}`;

    try {
      const s3 = this.getS3Client();
      const putCommand = new PutObjectCommand({
        Bucket: env.B2_BUCKET_NAME!,
        Key: s3Key,
        ContentType: mimeType || "application/octet-stream",
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
  ): Promise<{ success: boolean; upload?: IUpload; error?: string }> {
    const upload = await UploadModel.findOne({ fileId, status: "pending" });
    if (!upload) {
      return { success: false, error: "Upload record not found or already completed." };
    }

    try {
      const s3 = this.getS3Client();
      // Verify object exists in B2 and get verified content length
      const head = await s3.send(
        new HeadObjectCommand({
          Bucket: env.B2_BUCKET_NAME!,
          Key: upload.s3Key,
        })
      );

      upload.fileSize = head.ContentLength || upload.fileSize;
      upload.status = "active";
      await upload.save();

      // Send Discord announcement message
      await this.postDiscordAnnouncement(upload, client);

      return { success: true, upload };
    } catch (err: any) {
      Logger.error(`Error completing upload ${fileId}:`, err);
      return {
        success: false,
        error: "Could not verify uploaded file in cloud storage.",
      };
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

      const uploadTs = Math.floor(upload.createdAt.getTime() / 1000);
      const expireTs = Math.floor(upload.expiresAt.getTime() / 1000);
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
        .setTitle(`☁️ ${upload.fileName}`)
        .setColor((client as any).color || 0x5865f2)
        .setDescription(
          `📦 **Size:** \`${formatBytes(upload.fileSize)}\`\n` +
            `🕒 **Uploaded:** <t:${uploadTs}:R> (<t:${uploadTs}:f>)\n` +
            `⏳ **Expires:** <t:${expireTs}:R> (<t:${expireTs}:f>)`
        );

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
        Bucket: env.B2_BUCKET_NAME!,
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

    try {
      const s3 = this.getS3Client();
      const getCommand = new GetObjectCommand({
        Bucket: env.B2_BUCKET_NAME!,
        Key: upload.s3Key,
        ResponseContentType: upload.mimeType,
        ResponseContentDisposition: `inline; filename="${encodeURIComponent(
          upload.fileName
        )}"`,
      });

      const url = await getSignedUrl(s3, getCommand, { expiresIn: 3600 });
      return { url, mimeType: upload.mimeType };
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
                Bucket: env.B2_BUCKET_NAME!,
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
}

export default StorageService;
