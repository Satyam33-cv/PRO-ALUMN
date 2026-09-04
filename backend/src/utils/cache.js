// backend/src/utils/cache.js
// Zero-Cost In-Memory LRU/TTL Cache (Commandment 06)
// Eliminates database load for frequent read-heavy requests without external Redis fees.

class MemoryCache {
  constructor() {
    this.store = new Map();
  }

  /**
   * Get cached item or null if expired/missing
   * @param {string} key
   * @returns {any|null}
   */
  get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  /**
   * Set cached item with TTL (seconds)
   * @param {string} key
   * @param {any} value
   * @param {number} ttlSeconds Default: 300 (5 minutes)
   */
  set(key, value, ttlSeconds = 300) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Delete specific key or invalidate pattern
   * @param {string} key
   */
  del(key) {
    this.store.delete(key);
  }

  /**
   * Invalidate all keys matching a prefix
   * @param {string} prefix
   */
  delPrefix(prefix) {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Flush entire cache
   */
  flush() {
    this.store.clear();
  }
}

const cache = new MemoryCache();
module.exports = cache;
