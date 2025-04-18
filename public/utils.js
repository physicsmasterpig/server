// utils.js - Shared utilities for the BrainDB application
const DataUtils = {
    // Convert arrays to maps for faster lookups
    createLookupMap(array, keyFn) {
        const map = new Map();
        if (Array.isArray(array)) {
            array.forEach(item => {
                const key = keyFn(item);
                map.set(key, item);
            });
        }
        return map;
    },
    
    // Create a composite key for multi-field lookups
    compositeKey(...parts) {
        return parts.join('|');
    },
    
    // Batch array processing for improved performance
    batchProcess(array, batchSize, processFn) {
        const batches = [];
        for (let i = 0; i < array.length; i += batchSize) {
            batches.push(array.slice(i, i + batchSize));
        }
        return batches.map(processFn);
    },
    
    // Generate unique IDs with better entropy
    generateUniqueId(prefix) {
        const timestamp = Date.now().toString(36);
        const randomPart = Math.random().toString(36).substring(2, 10);
        return `${prefix}${timestamp}${randomPart}`;
    },
    
    // Normalize data for consistent processing
    normalize(data, schema) {
        if (!data) return null;
        const result = {};
        for (const [key, defaultValue] of Object.entries(schema)) {
            result[key] = data[key] !== undefined ? data[key] : defaultValue;
        }
        return result;
    }
};

// Constants for API operations
const API_CONSTANTS = {
    RETRY: {
        MAX_RETRIES: 5,
        INITIAL_DELAY: 1000,
        MAX_DELAY: 60000,
        JITTER_FACTOR: 0.2
    },
    BATCH_SIZE: {
        LOOKUPS: 50,
        UPDATES: 20,
        INSERTS: 50
    }
};

// Cache management
const CacheManager = {
    cache: new Map(),
    
    // Get an item from cache with optional expiration check
    get(key, defaultValue = null) {
        const item = this.cache.get(key);
        if (!item) return defaultValue;
        
        // Check if item is expired
        if (item.expiry && item.expiry < Date.now()) {
            this.cache.delete(key);
            return defaultValue;
        }
        
        return item.value;
    },
    
    // Set cache item with optional TTL in seconds
    set(key, value, ttl = null) {
        const item = {
            value,
            expiry: ttl ? Date.now() + (ttl * 1000) : null
        };
        this.cache.set(key, item);
        return value;
    },
    
    // Remove item from cache
    remove(key) {
        return this.cache.delete(key);
    },
    
    // Clear all cache or by namespace
    clear(namespace = null) {
        if (namespace) {
            for (const key of this.cache.keys()) {
                if (key.startsWith(namespace + ':')) {
                    this.cache.delete(key);
                }
            }
        } else {
            this.cache.clear();
        }
    }
};

// Export utilities for use in browser environment
if (typeof window !== 'undefined') {
    window.DataUtils = DataUtils;
    window.API_CONSTANTS = API_CONSTANTS;
    window.CacheManager = CacheManager;
}

// Export for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DataUtils, API_CONSTANTS, CacheManager };
}