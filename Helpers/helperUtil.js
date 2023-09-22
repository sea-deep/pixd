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

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
