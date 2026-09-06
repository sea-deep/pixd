import mongoose, { Document, Model } from "mongoose";

export interface IUpload extends Document {
  fileId: string;
  sessionToken: string;
  userId: string;
  userTag?: string | null;
  channelId: string;
  guildId: string | null;
  fileName: string;
  fileSize: number;
  mimeType: string;
  s3Key: string;
  status: "pending" | "active" | "expired";
  createdAt: Date;
  expiresAt: Date;
  discordMessageId?: string | null;
  downloadCount: number;
}

const uploadSchema = new mongoose.Schema<IUpload>(
  {
    fileId: { type: String, required: true, unique: true, index: true },
    sessionToken: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    userTag: { type: String, default: null },
    channelId: { type: String, required: true },
    guildId: { type: String, default: null },
    fileName: { type: String, required: true },
    fileSize: { type: Number, default: 0 },
    mimeType: { type: String, default: "application/octet-stream" },
    s3Key: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "active", "expired"],
      default: "pending",
      index: true,
    },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: true },
    discordMessageId: { type: String, default: null },
    downloadCount: { type: Number, default: 0 },
  },
  { versionKey: false }
);

export const UploadModel: Model<IUpload> =
  mongoose.models.Upload || mongoose.model<IUpload>("Upload", uploadSchema);

export default UploadModel;
