import { MongoClient } from 'mongodb';

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

  // Other methods as before...
}

/**
 * A key-value store using MongoDB.
 */
export class MongodbKeyValue {
  constructor(databaseUrl, collectionName) {
    this.client = new MongoClient(databaseUrl, { useUnifiedTopology: true });
    this.collectionName = collectionName;
  }

  /**
   * Connect to the MongoDB database.
   */
  async connect() {
    try {
      await this.client.connect();
      this.db = this.client.db();
      this.collection = this.db.collection(this.collectionName);
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  // Other methods as before...

  /**
   * Close the MongoDB connection.
   */
  async close() {
    try {
      await this.client.close();
    } catch (error) {
      console.error('Failed to close MongoDB connection:', error);
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