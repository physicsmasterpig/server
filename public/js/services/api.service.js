/**
 * API Service
 * Handles all API communication for the frontend
 */
class ApiService {
  /**
   * Make a GET request to the API
   * @param {string} endpoint - API endpoint
   * @param {Object} [params] - Query parameters
   * @returns {Promise<any>} - Response data
   */
  async get(endpoint, params = {}) {
    try {
      // Build query string
      const queryString = this._buildQueryString(params);
      const url = `/api${endpoint}${queryString}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`GET request failed: ${endpoint}`, error);
      throw error;
    }
  }
  
  /**
   * Make a POST request to the API
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @returns {Promise<any>} - Response data
   */
  async post(endpoint, data = {}) {
    try {
      const url = `/api${endpoint}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`POST request failed: ${endpoint}`, error);
      throw error;
    }
  }
  
  /**
   * Make a PUT request to the API
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @returns {Promise<any>} - Response data
   */
  async put(endpoint, data = {}) {
    try {
      const url = `/api${endpoint}`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`PUT request failed: ${endpoint}`, error);
      throw error;
    }
  }
  
  /**
   * Make a DELETE request to the API
   * @param {string} endpoint - API endpoint
   * @returns {Promise<any>} - Response data
   */
  async delete(endpoint) {
    try {
      const url = `/api${endpoint}`;
      
      const response = await fetch(url, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`DELETE request failed: ${endpoint}`, error);
      throw error;
    }
  }
  
  /**
   * Upload a file to the API
   * @param {string} endpoint - API endpoint
   * @param {FormData} formData - Form data with file
   * @returns {Promise<any>} - Response data
   */
  async uploadFile(endpoint, formData) {
    try {
      const url = `/api${endpoint}`;
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`File upload failed: ${endpoint}`, error);
      throw error;
    }
  }
  
  /**
   * Build a query string from parameters
   * @param {Object} params - Query parameters
   * @returns {string} - Formatted query string
   * @private
   */
  _buildQueryString(params) {
    if (Object.keys(params).length === 0) {
      return '';
    }
    
    const queryParams = new URLSearchParams();
    
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value);
      }
    }
    
    return `?${queryParams.toString()}`;
  }
}

// Export as a singleton
window.ApiService = new ApiService();
