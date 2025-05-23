/**
 * Cache Service
 * Provides caching functionality for database results
 */
const NodeCache = require('node-cache');
const config = require('../config/app.config');
const logger = require('./logger.service');

class CacheService {
  constructor() {
    // Initialize cache with configuration
    this.cache = new NodeCache({
      stdTTL: config.cache.ttl,
      checkperiod: config.cache.checkPeriod
    });
    
    logger.info('Cache service initialized', {
      ttl: config.cache.ttl,
      checkPeriod: config.cache.checkPeriod
    });
  }
  
  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {any|undefined} Cached value or undefined if not found
   */
  get(key) {
    const value = this.cache.get(key);
    logger.debug(`Cache ${value ? 'hit' : 'miss'}`, { key });
    return value;
  }
  
  /**
   * Set a value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} [ttl] - Time to live in seconds (optional)
   * @returns {boolean} Success status
   */
  set(key, value, ttl = undefined) {
    const success = this.cache.set(key, value, ttl);
    logger.debug('Cache set', { key, ttl, success });
    return success;
  }
  
  /**
   * Delete a value from cache
   * @param {string} key - Cache key
   * @returns {number} Number of deleted entries
   */
  del(key) {
    const deleted = this.cache.del(key);
    logger.debug('Cache delete', { key, deleted });
    return deleted;
  }
  
  /**
   * Clear all cache
   * @returns {boolean} Success status
   */
  flush() {
    this.cache.flushAll();
    logger.info('Cache flushed');
    return true;
  }
  
  /**
   * Get stats about the cache
   * @returns {Object} Cache statistics
   */
  getStats() {
    return this.cache.getStats();
  }
}

// Create and export a singleton instance
const cacheService = new CacheService();
module.exports = cacheService;
