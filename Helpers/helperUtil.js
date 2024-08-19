import { MongoClient } from "mongodb";
import PQueue from "p-queue"; // Import the PQueue class from the 'p-queue' library

export class MongodbKeyValue {
  constructor(databaseUrl, collectionName) {
    this.client = new MongoClient(databaseUrl, { useUnifiedTopology: true });
    this.collectionName = collectionName;
    this.db = null;
    this.collection = null;
    this.connect();
    this.queue = new PQueue({ concurrency: 1 }); // Set concurrency to 1 to handle one request at a time
  }

  async connect() {
    try {
      await this.client.connect();
      this.db = this.client.db();
      this.collection = this.db.collection(this.collectionName);
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error);
      throw error;
    }
  }

  async set(key, value, ttl = null) {
    const entry = { key, value, ttl: ttl ? Date.now() + ttl * 1000 : null };
    await this.queue.add(async () => {
      await this.collection.replaceOne({ key }, entry, { upsert: true });
    });
  }

  async get(key) {
    const entry = await this.collection.findOne({ key });
    if (entry) {
      if (entry.ttl === null || entry.ttl >= Date.now()) {
        return entry.value;
      } else {
        await this.delete(key);
      }
    }
    return undefined;
  }

  async delete(key) {
    await this.queue.add(async () => {
      await this.collection.deleteOne({ key });
    });
  }

  async has(key) {
    const entry = await this.collection.findOne({ key });
    return entry && (entry.ttl === null || entry.ttl >= Date.now());
  }

  async setTTL(key, newTTL) {
    if (newTTL === null) {
      await this.queue.add(async () => {
        await this.collection.updateOne({ key }, { $set: { ttl: null } });
      });
    } else if (typeof newTTL === "number" && newTTL >= 0) {
      await this.queue.add(async () => {
        await this.collection.updateOne(
          { key },
          { $set: { ttl: Date.now() + newTTL * 1000 } },
        );
      });
    } else {
      throw new Error(
        "Invalid TTL value. TTL must be a positive number or null.",
      );
    }
  }

  async getRemainingTTL(key) {
    const entry = await this.collection.findOne({ key });

    if (entry && entry.ttl !== null) {
      const currentTime = Date.now();
      const remainingTime = Math.max(0, entry.ttl - currentTime);
      const hours = Math.floor(remainingTime / (1000 * 60 * 60));
      const minutes = Math.floor(
        (remainingTime % (1000 * 60 * 60)) / (1000 * 60),
      );
      const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

      return { hours, minutes, seconds };
    }

    return null;
  }

  async all() {
    try {
      const allEntries = await this.collection.find().toArray();
      return allEntries.map((entry) => ({
        key: entry.key,
        value: entry.value,
      }));
    } catch (error) {
      console.error("Failed to retrieve all entries from MongoDB:", error);
      throw error;
    }
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
