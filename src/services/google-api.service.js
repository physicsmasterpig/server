/**
 * Google API Service
 * Handles authentication and provides access to Google APIs
 */
const { google } = require('googleapis');
const fs = require('fs');
const config = require('../config/app.config');
const logger = require('./logger.service');

class GoogleApiService {
  constructor() {
    this.auth = null;
    this.sheets = null;
    this.drive = null;
  }

  /**
   * Initialize Google API clients
   */
  async initialize() {
    try {
      // Set up authentication
      this.auth = await this.getAuthClient();
      
      // Initialize API clients
      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      this.drive = google.drive({ version: 'v3', auth: this.auth });
      
      logger.info('Google API Service initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Google API Service', { error: error.message });
      throw error;
    }
  }

  /**
   * Get authenticated Google API client
   */
  async getAuthClient() {
    try {
      // Support both local file and environment variables
      let keys;
      if (process.env.GOOGLE_CREDENTIALS) {
        keys = JSON.parse(process.env.GOOGLE_CREDENTIALS);
      } else {
        try {
          keys = JSON.parse(fs.readFileSync(config.google.credentialPath, 'utf8'));
        } catch (err) {
          throw new Error(`Unable to read credentials file: ${err.message}`);
        }
      }

      // Create JWT client
      const client = new google.auth.JWT(
        keys.client_email,
        null,
        keys.private_key,
        config.google.scopes
      );

      // Authenticate
      await client.authorize();
      return client;
    } catch (error) {
      logger.error('Authentication failed', { error: error.message });
      throw new Error(`Google API authentication failed: ${error.message}`);
    }
  }

  /**
   * Read data from a spreadsheet
   * @param {string} spreadsheetId - The ID of the spreadsheet
   * @param {string} range - The A1 notation of the range to read
   * @returns {Promise<Array>} - The values from the spreadsheet
   */
  async readSpreadsheet(spreadsheetId, range) {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });
      return response.data.values;
    } catch (error) {
      logger.error('Error reading spreadsheet', { 
        error: error.message, 
        spreadsheetId, 
        range 
      });
      throw error;
    }
  }

  /**
   * Write data to a spreadsheet
   * @param {string} spreadsheetId - The ID of the spreadsheet
   * @param {string} range - The A1 notation of the range to write
   * @param {Array} values - The values to write
   * @returns {Promise<Object>} - The update response
   */
  async writeToSpreadsheet(spreadsheetId, range, values) {
    try {
      const response = await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values,
        },
      });
      return response.data;
    } catch (error) {
      logger.error('Error writing to spreadsheet', { 
        error: error.message, 
        spreadsheetId, 
        range 
      });
      throw error;
    }
  }

  /**
   * Append data to a spreadsheet
   * @param {string} spreadsheetId - The ID of the spreadsheet
   * @param {string} range - The A1 notation of the range to append
   * @param {Array} values - The values to append
   * @returns {Promise<Object>} - The append response
   */
  async appendToSpreadsheet(spreadsheetId, range, values) {
    try {
      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values,
        },
      });
      return response.data;
    } catch (error) {
      logger.error('Error appending to spreadsheet', { 
        error: error.message, 
        spreadsheetId, 
        range 
      });
      throw error;
    }
  }

  /**
   * Upload a file to Google Drive
   * @param {string} filePath - Path to the local file
   * @param {string} fileName - Name to give the file in Drive
   * @param {string} mimeType - MIME type of the file
   * @param {string} [folderId] - Google Drive folder ID (optional)
   * @returns {Promise<Object>} - The file metadata
   */
  async uploadFile(filePath, fileName, mimeType, folderId = null) {
    try {
      const fileMetadata = {
        name: fileName,
      };
      
      // Add to folder if specified
      if (folderId) {
        fileMetadata.parents = [folderId];
      }
      
      const media = {
        mimeType,
        body: fs.createReadStream(filePath),
      };
      
      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id,name,webViewLink',
      });
      
      return response.data;
    } catch (error) {
      logger.error('Error uploading file to Drive', { 
        error: error.message, 
        fileName, 
        mimeType 
      });
      throw error;
    }
  }
}

// Create and export a singleton instance
const googleApiService = new GoogleApiService();
module.exports = googleApiService;
