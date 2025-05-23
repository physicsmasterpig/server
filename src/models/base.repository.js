/**
 * Base Repository
 * Handles data access operations for Google Sheets
 */
const googleApiService = require('../services/google-api.service');
const logger = require('../services/logger.service');
const dbConfig = require('../config/database.config');
const cacheService = require('../services/cache.service');

class BaseRepository {
  /**
   * @param {string} entityType - Entity type (e.g. 'students', 'classes')
   */
  constructor(entityType) {
    if (!dbConfig.sheets[entityType]) {
      throw new Error(`Invalid entity type: ${entityType}`);
    }
    
    this.entityType = entityType;
    this.config = dbConfig.sheets[entityType];
    this.spreadsheetId = dbConfig.spreadsheetId;
    this.sheetName = this.config.sheetName;
    this.cacheKey = `sheet_${entityType}`;
  }
  
  /**
   * Get all records
   * @returns {Promise<Array>} Array of records
   */
  async getAll() {
    try {
      // Check cache first
      if (dbConfig.cache.enabled) {
        const cached = cacheService.get(this.cacheKey);
        if (cached) {
          return cached;
        }
      }
      
      // Fetch from Google Sheets
      const range = `${this.sheetName}!A2:Z`;
      const values = await googleApiService.readSpreadsheet(this.spreadsheetId, range);
      
      // Convert to objects
      const records = this._valuesToRecords(values);
      
      // Cache results
      if (dbConfig.cache.enabled) {
        cacheService.set(this.cacheKey, records, dbConfig.cache.ttl);
      }
      
      return records;
    } catch (error) {
      logger.error(`Error fetching ${this.entityType}`, { error: error.message });
      throw error;
    }
  }
  
  /**
   * Get a record by its ID
   * @param {string} id - Record ID
   * @returns {Promise<Object|null>} Record object or null if not found
   */
  async getById(id) {
    try {
      const records = await this.getAll();
      return records.find(record => record.id === id) || null;
    } catch (error) {
      logger.error(`Error fetching ${this.entityType} by ID`, { 
        error: error.message, 
        id 
      });
      throw error;
    }
  }
  
  /**
   * Create a new record
   * @param {Object} data - Record data
   * @returns {Promise<Object>} Created record
   */
  async create(data) {
    try {
      // Generate ID if not provided
      if (!data.id) {
        data.id = this._generateId();
      }
      
      // Convert to values array
      const values = this._recordToValues(data);
      
      // Append to sheet
      const range = `${this.sheetName}!A:Z`;
      await googleApiService.appendToSpreadsheet(this.spreadsheetId, range, [values]);
      
      // Invalidate cache
      if (dbConfig.cache.enabled) {
        cacheService.del(this.cacheKey);
      }
      
      return data;
    } catch (error) {
      logger.error(`Error creating ${this.entityType}`, { 
        error: error.message, 
        data 
      });
      throw error;
    }
  }
  
  /**
   * Update an existing record
   * @param {string} id - Record ID
   * @param {Object} data - Record data
   * @returns {Promise<Object>} Updated record
   */
  async update(id, data) {
    try {
      // Get all records
      const records = await this.getAll();
      
      // Find the record index
      const index = records.findIndex(record => record.id === id);
      if (index === -1) {
        throw new Error(`${this.entityType} not found: ${id}`);
      }
      
      // Prepare updated record
      const updated = { ...records[index], ...data, id };
      
      // Find row number (index + 2 because headers are at row 1)
      const rowNumber = index + 2;
      
      // Convert to values array
      const values = this._recordToValues(updated);
      
      // Update sheet
      const range = `${this.sheetName}!A${rowNumber}:Z${rowNumber}`;
      await googleApiService.writeToSpreadsheet(this.spreadsheetId, range, [values]);
      
      // Invalidate cache
      if (dbConfig.cache.enabled) {
        cacheService.del(this.cacheKey);
      }
      
      return updated;
    } catch (error) {
      logger.error(`Error updating ${this.entityType}`, { 
        error: error.message, 
        id, 
        data 
      });
      throw error;
    }
  }
  
  /**
   * Delete a record
   * @param {string} id - Record ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(id) {
    try {
      // Get all records
      const records = await this.getAll();
      
      // Find the record index
      const index = records.findIndex(record => record.id === id);
      if (index === -1) {
        throw new Error(`${this.entityType} not found: ${id}`);
      }
      
      // Find row number
      const rowNumber = index + 2;
      
      // Create an empty row (clear the row)
      const emptyValues = Array(Object.keys(this.config.fields).length).fill('');
      
      // Update sheet with empty values (effectively deleting the row)
      const range = `${this.sheetName}!A${rowNumber}:Z${rowNumber}`;
      await googleApiService.writeToSpreadsheet(this.spreadsheetId, range, [emptyValues]);
      
      // Invalidate cache
      if (dbConfig.cache.enabled) {
        cacheService.del(this.cacheKey);
      }
      
      return true;
    } catch (error) {
      logger.error(`Error deleting ${this.entityType}`, { 
        error: error.message, 
        id 
      });
      throw error;
    }
  }
  
  /**
   * Convert sheet values to record objects
   * @param {Array} values - 2D array of values from sheet
   * @returns {Array} Array of record objects
   * @private
   */
  _valuesToRecords(values) {
    if (!values || !values.length) {
      return [];
    }
    
    // Get field info
    const fields = this.config.fields;
    const fieldNames = Object.keys(fields);
    
    // Convert each row to an object
    return values.map(row => {
      const record = {};
      
      // For each field, get the value from the correct column
      fieldNames.forEach((fieldName, index) => {
        const value = row[index];
        
        // Skip if value is undefined or null
        if (value === undefined || value === null || value === '') {
          return;
        }
        
        // Convert value based on field type
        const fieldType = fields[fieldName].type;
        record[fieldName] = this._convertValueFromSheet(value, fieldType);
      });
      
      return record;
    });
  }
  
  /**
   * Convert a record object to sheet values
   * @param {Object} record - Record object
   * @returns {Array} Array of values for the sheet
   * @private
   */
  _recordToValues(record) {
    // Get field info
    const fields = this.config.fields;
    const fieldNames = Object.keys(fields);
    
    // Convert each field value
    return fieldNames.map(fieldName => {
      const value = record[fieldName];
      
      // Skip if value is undefined or null
      if (value === undefined || value === null) {
        return '';
      }
      
      // Convert value based on field type
      const fieldType = fields[fieldName].type;
      return this._convertValueToSheet(value, fieldType);
    });
  }
  
  /**
   * Convert a value from the sheet to the appropriate JS type
   * @param {string} value - Value from sheet
   * @param {string} type - Field type ('string', 'number', 'date', 'boolean')
   * @returns {any} Converted value
   * @private
   */
  _convertValueFromSheet(value, type) {
    if (value === undefined || value === null || value === '') {
      return null;
    }
    
    switch (type) {
      case 'number':
        return parseFloat(value);
      case 'date':
        return new Date(value);
      case 'boolean':
        return value.toLowerCase() === 'true';
      default:
        return value;
    }
  }
  
  /**
   * Convert a JS value to the appropriate sheet format
   * @param {any} value - JS value
   * @param {string} type - Field type ('string', 'number', 'date', 'boolean')
   * @returns {string} Converted value for sheet
   * @private
   */
  _convertValueToSheet(value, type) {
    if (value === undefined || value === null) {
      return '';
    }
    
    switch (type) {
      case 'date':
        // Format date as YYYY-MM-DD
        if (value instanceof Date) {
          return value.toISOString().split('T')[0];
        }
        return value;
      case 'boolean':
        return value ? 'TRUE' : 'FALSE';
      default:
        return value.toString();
    }
  }
  
  /**
   * Generate a unique ID
   * @returns {string} Generated ID
   * @private
   */
  _generateId() {
    const prefix = this.entityType.slice(0, 3).toUpperCase();
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `${prefix}-${timestamp}-${random}`;
  }
}

module.exports = BaseRepository;
