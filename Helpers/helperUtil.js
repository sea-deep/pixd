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
}
