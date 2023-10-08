const { MongoClient } = require('mongodb');


export class KeyValueStore {
  constructor() {
    this.data = new Map();
  }

  set(key, value, ttl = null) {
    this.data.set(key, { value, ttl: ttl ? Date.now() + ttl * 1000 : null });
  }

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

  delete(key) {
    this.data.delete(key);
  }

  has(key) {
    const entry = this.data.get(key);
    return entry && (entry.ttl === null || entry.ttl >= Date.now());
  }

  setTTL(key, newTTL) {
    const entry = this.data.get(key);
    if (entry) {
      if (newTTL === null) {
        entry.ttl = null;
      } else if (typeof newTTL === 'number' && newTTL >= 0) {
        entry.ttl = Date.now() + newTTL * 1000;
      } else {
        throw new Error('Invalid TTL value. TTL must be a positive number or null.');
      }
    } else {
      throw new Error('Key does not exist in the store.');
    }
  }
}

class MongodbKeyValue {
  constructor(databaseUrl) {
    this.client = new MongoClient(databaseUrl, { const { MongoClient } = require('mongodb');
: true, useUnifiedTopology: true });
    this.collectionName = 'keyValuePairs';
  }

  async connect() {
    await this.client.connect();
    this.db = this.client.db();
    this.collection = this.db.collection(this.collectionName);
  }

  async set(key, value, ttl = null) {
    const entry = { key, value, ttl: ttl ? Date.now() + ttl * 1000 : null };
    await this.collection.replaceOne({ key }, entry, { upsert: true });
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
    await this.collection.deleteOne({ key });
  }

  async has(key) {
    const entry = await this.collection.findOne({ key });
    return entry && (entry.ttl === null || entry.ttl >= Date.now());
  }

  async setTTL(key, newTTL) {
    if (newTTL === null) {
      await this.collection.updateOne({ key }, { $set: { ttl: null } });
    } else if (typeof newTTL === 'number' && newTTL >= 0) {
      await this.collection.updateOne({ key }, { $set: { ttl: Date.now() + newTTL * 1000 } });
    } else {
      throw new Error('Invalid TTL value. TTL must be a positive number or null.');
    }
  }

  async close() {
    await this.client.close();
  }
}

module.exports = KeyValueStore;

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
