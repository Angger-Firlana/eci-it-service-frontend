/**
 * Global cache manager for all data fetching
 * Persists across component unmounts and navigation
 */

class GlobalCache {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 60_000; // 1 minute default
  }

  /**
   * Get cached value
   * @param {string} key - Cache key
   * @returns {any|null} - Cached value or null if expired/not found
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      console.log(`[GlobalCache] MISS: ${key}`);
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      // Expired - remove and return null
      this.cache.delete(key);
      console.log(`[GlobalCache] EXPIRED: ${key}`);
      return null;
    }

    console.log(`[GlobalCache] HIT: ${key}`);
    return entry.value;
  }

  /**
   * Set cache value
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds (default: 60s)
   */
  set(key, value, ttl = this.defaultTTL) {
    console.log(`[GlobalCache] SET: ${key} (TTL: ${ttl}ms)`);
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Check if key exists and is valid
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Delete specific key
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Delete keys matching pattern
   * @param {string|RegExp} pattern - Pattern to match
   */
  deletePattern(pattern) {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    const keysToDelete = [];
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache stats
   * @returns {Object} - Cache statistics
   */
  getStats() {
    let validCount = 0;
    let expiredCount = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredCount++;
      } else {
        validCount++;
      }
    }

    return {
      total: this.cache.size,
      valid: validCount,
      expired: expiredCount,
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    const keysToDelete = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    
    return keysToDelete.length;
  }
}

// Singleton instance - shared across entire app
const globalCache = new GlobalCache();

// Auto cleanup every 5 minutes
setInterval(() => {
  const removed = globalCache.cleanup();
  if (removed > 0) {
    console.log(`[GlobalCache] Cleaned up ${removed} expired entries`);
  }
}, 5 * 60 * 1000);

export default globalCache;
