import mongoose from "mongoose";
import PQueue from "p-queue";

const kvSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  ttl: { type: Number, default: null }, // expiration timestamp
});

const KVModel = mongoose.model("KVStore", kvSchema);

export class MongodbKeyValue {
  constructor() {
    this.collection = KVModel;
    this.queue = new PQueue({ concurrency: 1 });
  }

  async set(key, value, ttl = null) {
    const entry = { key, value, ttl: ttl ? Date.now() + ttl * 1000 : null };
    await this.queue.add(() =>
      this.collection.updateOne({ key }, { $set: entry }, { upsert: true })
    );
  }

  async get(key) {
    const entry = await this.collection.findOne({ key });
    if (entry) {
      if (entry.ttl === null || entry.ttl >= Date.now()) return entry.value;
      await this.delete(key);
    }
    return undefined;
  }

  async delete(key) {
    await this.queue.add(() => this.collection.deleteOne({ key }));
  }

  async has(key) {
    const entry = await this.collection.findOne({ key });
    return !!(entry && (entry.ttl === null || entry.ttl >= Date.now()));
  }

  async setTTL(key, newTTL) {
    const ttlValue = newTTL !== null ? Date.now() + newTTL * 1000 : null;
    await this.queue.add(() => this.collection.updateOne({ key }, { $set: { ttl: ttlValue } }));
  }

  async getRemainingTTL(key) {
    const entry = await this.collection.findOne({ key });
    if (entry?.ttl !== null) {
      const remaining = Math.max(0, entry.ttl - Date.now());
      return {
        hours: Math.floor(remaining / 3600000),
        minutes: Math.floor((remaining % 3600000) / 60000),
        seconds: Math.floor((remaining % 60000) / 1000),
      };
    }
    return null;
  }

  async all() {
    return (await this.collection.find()).map(({ key, value }) => ({ key, value }));
  }
}


/**
 * A simple key-value store using a Map.
 */
export class KeyValueStore {
  constructor() {
    this.data = new Map();
  }

  /**
   * Set a key-value pair in the store.
   * @param {string} key - The key.
   * @param {any} value - The value.
   * @param {number|null} ttl - Time to live (in seconds), or null for no expiration.
   */
  set(key, value, ttl = null) {
    this.data.set(key, { value, ttl: ttl ? Date.now() + ttl * 1000 : null });
  }

  /**
   * Get the value associated with a key from the store.
   * @param {string} key - The key.
   * @returns {any} The value associated with the key, or undefined if not found or expired.
   */
  get(key) {
    const entry = this.data.get(key);
    if (entry) {
      if (entry.ttl === null || entry.ttl >= Date.now()) {
        return entry.value;
      } else {
        this.data.delete(key);
      }
    }
    return undefined;
  }

  /**
   * Delete a key-value pair from the store.
   * @param {string} key - The key to delete.
   */
  delete(key) {
    this.data.delete(key);
  }

  /**
   * Check if a key exists in the store and is not expired.
   * @param {string} key - The key to check.
   * @returns {boolean} True if the key exists and is not expired, false otherwise.
   */
  has(key) {
    const entry = this.data.get(key);
    return entry && (entry.ttl === null || entry.ttl >= Date.now());
  }

  /**
   * Set the Time To Live (TTL) for a key in the store.
   * @param {string} key - The key.
   * @param {number|null} newTTL - New TTL value in seconds, or null to remove expiration.
   */
  setTTL(key, newTTL) {
    const entry = this.data.get(key);
    if (entry) {
      if (newTTL === null) {
        entry.ttl = null;
      } else if (typeof newTTL === "number" && newTTL >= 0) {
        entry.ttl = Date.now() + newTTL * 1000;
      } else {
        throw new Error(
          "Invalid TTL value. TTL must be a positive number or null.",
        );
      }
    } else {
      throw new Error("Key does not exist in the store.");
    }
  }
}

/**
 * Sleep for a specified number of milliseconds.
 * @param {number} ms - The number of milliseconds to sleep.
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
