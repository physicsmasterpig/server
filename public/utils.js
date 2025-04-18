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
    },
    
    // Change tracking for efficient updates
    ChangeTracker: {
        // Track changes between original and current data
        trackChanges(originalData, currentData, idField, compareFields) {
            if (!Array.isArray(originalData) || !Array.isArray(currentData)) {
                return { added: [], modified: [], unchanged: [] };
            }
            
            // Create maps for faster lookups
            const originalMap = new Map(originalData.map(item => [item[idField], item]));
            const currentMap = new Map(currentData.map(item => [item[idField], item]));
            
            const added = [];
            const modified = [];
            const unchanged = [];
            
            // Find added and modified items
            currentData.forEach(item => {
                const id = item[idField];
                const original = originalMap.get(id);
                
                if (!original) {
                    added.push(item);
                } else if (this.hasChanges(original, item, compareFields)) {
                    modified.push(item);
                } else {
                    unchanged.push(item);
                }
            });
            
            return { added, modified, unchanged };
        },
        
        // Check if two objects have differences in specified fields
        hasChanges(original, current, fields) {
            return fields.some(field => {
                // Handle nested fields with dot notation
                if (field.includes('.')) {
                    const parts = field.split('.');
                    let origValue = original;
                    let currValue = current;
                    
                    for (const part of parts) {
                        origValue = origValue?.[part];
                        currValue = currValue?.[part];
                        
                        if (origValue === undefined && currValue === undefined) {
                            return false;
                        }
                    }
                    
                    return JSON.stringify(origValue) !== JSON.stringify(currValue);
                }
                
                return JSON.stringify(original[field]) !== JSON.stringify(current[field]);
            });
        }
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
    },
    
    // UI feedback constants
    UI: {
        LOADING_TIMEOUT: 30000, // 30 seconds max loading time
        NOTIFICATION_DURATION: 3000, // 3 seconds for notifications
        DEBOUNCE_DELAY: 500 // 500ms debounce delay for input events
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

// Add UI utilities
const UIUtils = {
    // Show/hide loading indicators
    loadingIndicators: new Map(),
    
    // Show loading indicator with timeout protection
    showLoading(elementId, message = 'Loading...') {
        const element = document.getElementById(elementId);
        if (!element) return null;
        
        // Create or get loading overlay
        let overlay = this.loadingIndicators.get(elementId);
        
        if (!overlay) {
            // Create new overlay
            overlay = document.createElement('div');
            overlay.className = 'loading-overlay';
            overlay.innerHTML = `
                <div class="loading-spinner"></div>
                <div class="loading-message">${message}</div>
            `;
            
            // Position the overlay
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            overlay.style.position = 'absolute';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            overlay.style.display = 'flex';
            overlay.style.flexDirection = 'column';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';
            overlay.style.zIndex = '1000';
            overlay.style.borderRadius = style.borderRadius;
            
            // Make sure the parent element has position relative
            if (window.getComputedStyle(element).position === 'static') {
                element.style.position = 'relative';
            }
            
            element.appendChild(overlay);
            this.loadingIndicators.set(elementId, overlay);
            
            // Set timeout to auto-hide after maximum duration
            overlay.timeout = setTimeout(() => {
                this.hideLoading(elementId);
            }, API_CONSTANTS.UI.LOADING_TIMEOUT);
        } else {
            // Update existing overlay
            const messageEl = overlay.querySelector('.loading-message');
            if (messageEl) messageEl.textContent = message;
            
            // Reset timeout
            clearTimeout(overlay.timeout);
            overlay.timeout = setTimeout(() => {
                this.hideLoading(elementId);
            }, API_CONSTANTS.UI.LOADING_TIMEOUT);
        }
        
        return overlay;
    },
    
    // Hide loading indicator
    hideLoading(elementId) {
        const overlay = this.loadingIndicators.get(elementId);
        if (!overlay) return false;
        
        clearTimeout(overlay.timeout);
        overlay.remove();
        this.loadingIndicators.delete(elementId);
        return true;
    },
    
    // Show notification message
    notify(message, type = 'info', duration = API_CONSTANTS.UI.NOTIFICATION_DURATION) {
        // Create notification element if it doesn't exist
        let container = document.getElementById('notification-container');
        
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.style.position = 'fixed';
            container.style.top = '20px';
            container.style.right = '20px';
            container.style.zIndex = '9999';
            document.body.appendChild(container);
        }
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Style the notification
        notification.style.padding = '12px 20px';
        notification.style.marginBottom = '10px';
        notification.style.borderRadius = '4px';
        notification.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
        notification.style.animation = 'fadeIn 0.3s ease-out forwards';
        notification.style.cursor = 'pointer';
        
        // Set color based on type
        switch (type) {
            case 'success':
                notification.style.backgroundColor = '#4CAF50';
                notification.style.color = 'white';
                break;
            case 'error':
                notification.style.backgroundColor = '#F44336';
                notification.style.color = 'white';
                break;
            case 'warning':
                notification.style.backgroundColor = '#FF9800';
                notification.style.color = 'white';
                break;
            default:
                notification.style.backgroundColor = '#2196F3';
                notification.style.color = 'white';
        }
        
        // Add to container
        container.appendChild(notification);
        
        // Set timeout to remove
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease-in forwards';
            setTimeout(() => {
                notification.remove();
                if (container.children.length === 0) {
                    container.remove();
                }
            }, 300);
        }, duration);
        
        // Click to dismiss
        notification.addEventListener('click', () => {
            notification.remove();
            if (container.children.length === 0) {
                container.remove();
            }
        });
        
        return notification;
    },
    
    // Utility to debounce function calls
    debounce(func, wait = API_CONSTANTS.UI.DEBOUNCE_DELAY) {
        let timeout;
        return function(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Add CSS for loading indicators and notifications
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes spinner {
            to { transform: rotate(360deg); }
        }
        
        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spinner 0.8s linear infinite;
            margin-bottom: 10px;
        }
        
        .loading-message {
            color: white;
            font-size: 14px;
            font-weight: 500;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(-10px); }
        }
    `;
    document.head.appendChild(style);
}

// Export utilities for use in browser environment
if (typeof window !== 'undefined') {
    window.DataUtils = DataUtils;
    window.API_CONSTANTS = API_CONSTANTS;
    window.CacheManager = CacheManager;
    window.UIUtils = UIUtils;
}

// Export for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DataUtils, API_CONSTANTS, CacheManager, UIUtils };
}