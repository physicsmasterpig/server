/**
 * Main Application JavaScript
 * Entry point for the BrainDB frontend
 */
class Application {
  constructor() {
    this.modules = {};
    this.currentPage = null;
  }
  
  /**
   * Initialize the application
   */
  async initialize() {
    try {
      // Load core dependencies
      await this.loadCoreDependencies();
      
      // Initialize sidebar
      this.initializeSidebar();
      
      // Show home page by default
      this.navigateTo('home');
      
      console.log('Application initialized successfully');
    } catch (error) {
      console.error('Failed to initialize application:', error);
    }
  }
  
  /**
   * Load core dependencies
   */
  async loadCoreDependencies() {
    try {
      // Load service scripts
      await this.loadScript('/js/services/ui.service.js');
      await this.loadScript('/js/services/api.service.js');
      
      // Load core scripts
      await this.loadScript('/utils/component-system.js');
      await this.loadScript('/js/core/base-module.js');
      
      // Load CSS modules
      this.loadCSSModules();
      
      console.log('Core dependencies loaded successfully');
    } catch (error) {
      console.error('Failed to load core dependencies:', error);
      throw error;
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
   * Load CSS modules
   */
  loadCSSModules() {
    // Add main CSS that imports all modular CSS files
    if (!document.querySelector('link[href="/css/main.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/css/main.css';
      document.head.appendChild(link);
    }
  }
  
  /**
   * Initialize sidebar navigation
   */
  initializeSidebar() {
    const sidebarMenuItems = document.querySelectorAll('.sidebar_menu_item');
    
    sidebarMenuItems.forEach(item => {
      item.addEventListener('click', () => {
        // Update active menu item
        sidebarMenuItems.forEach(menuItem => menuItem.classList.remove('active'));
        item.classList.add('active');
        
        // Get the selected page from the item's ID
        const selectedPage = item.id.split('_')[2];
        
        // Navigate to the selected page
        this.navigateTo(selectedPage);
      });
    });
  }
  
  /**
   * Navigate to a page
   * @param {string} page - Page name
   */
  async navigateTo(page) {
    try {
      // Skip if already on this page
      if (this.currentPage === page) {
        return;
      }
      
      // Update title
      this.updateMainTitle(page);
      
      // Load page content
      await this.loadPageContent(page);
      
      // Update current page
      this.currentPage = page;
      
      // Update URL if history API is available
      if (window.history && window.history.pushState) {
        window.history.pushState({ page }, `${page.charAt(0).toUpperCase() + page.slice(1)} - BrainDB`, `?page=${page}`);
      }
    } catch (error) {
      console.error(`Failed to navigate to ${page}:`, error);
      if (window.UiService) {
        window.UiService.showNotification(`Failed to load ${page}: ${error.message}`, 'error');
      }
    }
  }
  
  /**
   * Update the main content title
   * @param {string} page - Page name
   */
  updateMainTitle(page) {
    const mainTitle = document.querySelector('.main_title');
    if (mainTitle) {
      mainTitle.textContent = page.charAt(0).toUpperCase() + page.slice(1);
    }
  }
  
  /**
   * Load page content
   * @param {string} page - Page name
   */
  async loadPageContent(page) {
    // Show loading indicator
    let loadingIndicator;
    if (window.UiService) {
      loadingIndicator = window.UiService.showLoading(`Loading ${page}...`);
    }
    
    try {
      // Fetch page content
      const response = await fetch(`/render/${page}`);
      if (!response.ok) {
        throw new Error(`Failed to load ${page} content: ${response.status}`);
      }
      
      // Get content
      const html = await response.text();
      document.querySelector('.main_content').innerHTML = html;
      
      // Load page module
      await this.loadPageModule(page);
    } catch (error) {
      console.error('Error loading content:', error);
      document.querySelector('.main_content').innerHTML = '<p>Error loading content. Please try again.</p>';
      throw error;
    } finally {
      // Hide loading indicator
      if (loadingIndicator) {
        loadingIndicator.hide();
      }
    }
  }
  
  /**
   * Load and initialize page module
   * @param {string} page - Page name
   */
  async loadPageModule(page) {
    try {
      // Check if we have a modern module implementation
      const modulePath = `/js/modules/${page}.module.js`;
      
      // Try to load the modern module first
      try {
        await this.loadScript(modulePath);
        
        // If module loaded successfully, initialize it
        if (window[`${page}Module`]) {
          if (!this.modules[page]) {
            this.modules[page] = window[`${page}Module`];
          }
          
          // Initialize if not already initialized
          if (this.modules[page].initialize) {
            await this.modules[page].initialize();
          }
          
          console.log(`Initialized ${page} module`);
          return;
        }
      } catch (modernErr) {
        console.log(`Modern module not found for ${page}, falling back to legacy script`);
      }
      
      // Fallback to legacy script
      const legacyPath = `/menu-content/${page}.js`;
      await this.loadScript(legacyPath);
      
      console.log(`Loaded legacy script for ${page}`);
    } catch (error) {
      console.error(`Failed to load module for ${page}:`, error);
      throw error;
    }
  }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  window.app = new Application();
  window.app.initialize();
});