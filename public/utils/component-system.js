/**
 * BrainDB Component System
 * This utility helps load and manage reusable UI components
 */

const ComponentSystem = {
    /**
     * Cache for loaded component templates
     */
    templateCache: {},
    
    /**
     * Load a component template from the server
     * @param {string} name - Component name
     * @returns {Promise<string>} - HTML template string
     */
    async loadTemplate(name) {
        if (this.templateCache[name]) {
            return this.templateCache[name];
        }
        
        try {
            const response = await fetch(`/templates/${name}.html`);
            if (!response.ok) {
                throw new Error(`Failed to load template: ${name}`);
            }
            
            const template = await response.text();
            this.templateCache[name] = template;
            return template;
        } catch (error) {
            console.error(`Error loading template ${name}:`, error);
            return '';
        }
    },
    
    /**
     * Render a component with data
     * @param {string} name - Component name
     * @param {Object} data - Data to populate the template
     * @returns {Promise<string>} - Rendered HTML
     */
    async renderComponent(name, data) {
        const template = await this.loadTemplate(name);
        
        // Simple template variable replacement
        return template.replace(/\${([^}]+)}/g, (match, variable) => {
            return data[variable] !== undefined ? data[variable] : '';
        });
    },
    
    /**
     * Render a component and insert it into the DOM
     * @param {string} selector - CSS selector for target element
     * @param {string} name - Component name
     * @param {Object} data - Data to populate the template
     * @returns {Promise<void>}
     */
    async insertComponent(selector, name, data) {
        const element = document.querySelector(selector);
        if (!element) {
            console.error(`Target element not found: ${selector}`);
            return;
        }
        
        const rendered = await this.renderComponent(name, data);
        element.innerHTML = rendered;
    },
    
    /**
     * Render multiple instances of a component
     * @param {string} selector - CSS selector for target element
     * @param {string} name - Component name
     * @param {Array} items - Array of data objects
     * @returns {Promise<void>}
     */
    async renderCollection(selector, name, items) {
        const element = document.querySelector(selector);
        if (!element) {
            console.error(`Target element not found: ${selector}`);
            return;
        }
        
        const fragments = [];
        for (const item of items) {
            const rendered = await this.renderComponent(name, item);
            fragments.push(rendered);
        }
        
        element.innerHTML = fragments.join('');
    }
};

// Export the Component System
window.ComponentSystem = ComponentSystem;
