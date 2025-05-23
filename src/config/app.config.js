/**
 * Application configuration settings
 */
module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: {
      error: 'error.log',
      combined: 'combined.log',
    }
  },
  
  // File upload configuration
  upload: {
    directory: 'uploads',
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      'application/vnd.ms-excel', // xls
      'text/csv', // csv
    ]
  },
  
  // Google API settings
  google: {
    credentialPath: process.env.GOOGLE_CREDENTIAL_PATH || 'credential.json',
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive'
    ]
  },
  
  // Cache settings
  cache: {
    ttl: 60 * 60, // 1 hour in seconds
    checkPeriod: 10 * 60, // Check every 10 minutes
  }
};
