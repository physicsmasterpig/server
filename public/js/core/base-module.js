/**
 * Base Module Class
 * Provides common functionality for all modules
 */
class BaseModule {
  /**
   * @param {string} name - Module name
   */
  constructor(name) {
    this.name = name;
    this.initialized = false;
    this.elements = {};
  }
  
  /**
   * Initialize the module
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Show loading
      this.showLoading();
      
      // Load dependencies
      await this.loadDependencies();
      
      // Cache DOM elements
      this.cacheElements();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Mark as initialized
      this.initialized = true;
      
      // Hide loading
      this.hideLoading();
    } catch (error) {
      console.error(`Failed to initialize ${this.name} module:`, error);
      this.hideLoading();
      this.showError(`Failed to initialize: ${error.message}`);
    }
  }
  
  /**
   * Load dependencies
   * Override in subclass
   * @returns {Promise<void>}
   */
  async loadDependencies() {
    // To be implemented by subclasses
  }
  
  /**
   * Cache DOM elements for faster access
   * Override in subclass
   */
  cacheElements() {
    // To be implemented by subclasses
  }
  
  /**
   * Set up event listeners
   * Override in subclass
   */
  setupEventListeners() {
    // To be implemented by subclasses
  }
  
  /**
   * Show loading indicator
   * @param {string} [message] - Custom loading message
   */
  showLoading(message) {
    if (window.UiService) {
      this.loadingIndicator = window.UiService.showLoading(message);
    } else {
      console.log('Loading...');
    }
  }
  
  /**
   * Hide loading indicator
   */
  hideLoading() {
    if (this.loadingIndicator) {
      this.loadingIndicator.hide();
      this.loadingIndicator = null;
    }
  }
  
  /**
   * Show success notification
   * @param {string} message - Success message
   */
  showSuccess(message) {
    if (window.UiService) {
      window.UiService.showNotification(message, 'success');
    } else {
      console.log(`Success: ${message}`);
    }
  }
  
  /**
   * Show error notification
   * @param {string} message - Error message
   */
  showError(message) {
    if (window.UiService) {
      window.UiService.showNotification(message, 'error');
    } else {
      console.error(`Error: ${message}`);
    }
  }
  
  /**
   * Load a script dynamically
   * @param {string} src - Script source
   * @returns {Promise<void>} - Resolves when script is loaded
   */
  loadScript(src) {
    return new Promise((resolve, reject) => {
      // Check if script is already loaded
      const existingScript = document.querySelector(`script[src="${src}"]`);
      if (existingScript) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      
      document.head.appendChild(script);
    });
  }
  
  /**
   * Format a date using UI service
   * @param {string|Date} date - Date to format
   * @param {Object} [options] - Format options
   * @returns {string} - Formatted date string
   */
  formatDate(date, options) {
    if (window.UiService) {
      return window.UiService.formatDate(date, options);
    }
    
    // Fallback if UI service is not available
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString();
  }
}

// Export for use in modules
window.BaseModule = BaseModule;
