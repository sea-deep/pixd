import mongoose from "mongoose";
import PQueue from "p-queue";

interface StoredValue { key: string; value: any; ttl: number | null }
const kvSchema = new mongoose.Schema<StoredValue>({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  ttl: { type: Number, default: null },
});
const KVModel = mongoose.models.KVStore as mongoose.Model<StoredValue> | undefined
  ?? mongoose.model<StoredValue>("KVStore", kvSchema);

export class MongodbKeyValue {
  private readonly queue = new PQueue({ concurrency: 1 });
  constructor(private readonly namespace = "default") {}

  private qualifiedKey(key: string): string { return `${this.namespace}:${key}`; }
  private async findEntry(key: string) {
    return await KVModel.findOne({ key: this.qualifiedKey(key) }) ?? KVModel.findOne({ key });
  }
  async set(key: string, value: any, ttlSeconds: number | null = null): Promise<void> {
    const qualifiedKey = this.qualifiedKey(key);
    const ttl = ttlSeconds === null ? null : Date.now() + ttlSeconds * 1000;
    await this.queue.add(() => KVModel.updateOne({ key: qualifiedKey }, { $set: { key: qualifiedKey, value, ttl } }, { upsert: true }));
  }
  async get(key: string): Promise<any | undefined> {
    const entry = await this.findEntry(key);
    if (!entry) return undefined;
    if (entry.ttl === null || entry.ttl >= Date.now()) return entry.value;
    await this.delete(key);
    return undefined;
  }
  async delete(key: string): Promise<void> {
    await this.queue.add(() => KVModel.deleteMany({ key: { $in: [this.qualifiedKey(key), key] } }));
  }
  async has(key: string): Promise<boolean> {
    const entry = await this.findEntry(key);
    return Boolean(entry && (entry.ttl === null || entry.ttl >= Date.now()));
  }
  async setTTL(key: string, ttlSeconds: number | null): Promise<void> {
    const ttl = ttlSeconds === null ? null : Date.now() + ttlSeconds * 1000;
    await this.queue.add(() => KVModel.updateOne(
      { key: { $in: [this.qualifiedKey(key), key] } }, { $set: { ttl } },
    ));
  }
  async getRemainingTTL(key: string): Promise<{ hours: number; minutes: number; seconds: number } | null> {
    const entry = await this.findEntry(key);
    if (!entry || entry.ttl === null) return null;
    const remaining = Math.max(0, entry.ttl - Date.now());
    return { hours: Math.floor(remaining / 3_600_000), minutes: Math.floor(remaining % 3_600_000 / 60_000), seconds: Math.floor(remaining % 60_000 / 1000) };
  }
  async all(): Promise<Array<{ key: string; value: any }>> {
    const prefix = `${this.namespace}:`;
    return (await KVModel.find({ key: { $regex: `^${prefix}` } }))
      .map(({ key, value }) => ({ key: key.slice(prefix.length), value }));
  }
}

interface MemoryEntry { value: any; ttl: number | null }
export class KeyValueStore {
  private readonly data = new Map<string, MemoryEntry>();
  set(key: string, value: any, ttlSeconds: number | null = null): void {
    this.data.set(key, { value, ttl: ttlSeconds === null ? null : Date.now() + ttlSeconds * 1000 });
  }
  get(key: string): any | undefined {
    const entry = this.data.get(key);
    if (!entry) return undefined;
    if (entry.ttl === null || entry.ttl >= Date.now()) return entry.value;
    this.data.delete(key);
    return undefined;
  }
  delete(key: string): void { this.data.delete(key); }
  has(key: string): boolean { return this.get(key) !== undefined; }
  setTTL(key: string, ttlSeconds: number | null): void {
    const entry = this.data.get(key);
    if (!entry) throw new Error("Key does not exist in the store.");
    if (ttlSeconds !== null && (!Number.isFinite(ttlSeconds) || ttlSeconds < 0)) throw new Error("TTL must be non-negative or null.");
    entry.ttl = ttlSeconds === null ? null : Date.now() + ttlSeconds * 1000;
  }
}

export const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
