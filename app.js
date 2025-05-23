/**
 * BrainDB Server
 * Main entry point for the BrainDB application
 */
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');

// Import configuration and services
const config = require('./src/config/app.config');
const logger = require('./src/services/logger.service');
const googleApiService = require('./src/services/google-api.service');

// Import middleware
const errorHandler = require('./src/middleware/error-handler');
const requestLogger = require('./src/middleware/request-logger');

// Import routes
const apiRoutes = require('./src/api');

// Initialize Express app
const app = express();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(config.upload.directory)) {
      fs.mkdirSync(config.upload.directory);
    }
    cb(null, config.upload.directory);
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: config.upload.maxFileSize
  },
  fileFilter: (req, file, cb) => {
    if (config.upload.allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype}`));
    }
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(requestLogger);

// Serve template files
app.get('/templates/:template', (req, res) => {
  const templateName = req.params.template;
  const templatePath = path.join(__dirname, 'public', 'templates', templateName);
  
  // Security check: ensure the template exists and is a .html file
  if (!templateName.endsWith('.html')) {
    return res.status(400).send('Invalid template format');
  }
  
  fs.access(templatePath, fs.constants.F_OK, (err) => {
    if (err) {
      logger.error(`Template not found: ${templateName}`);
      return res.status(404).send('Template not found');
    }
    
    res.sendFile(templatePath);
  });
});

// Routes for page content (legacy support)
app.get('/render/:page', (req, res) => {
  const page = req.params.page;
  const pagePath = path.join(__dirname, 'public', 'menu-content', `${page}.html`);
  
  fs.access(pagePath, fs.constants.F_OK, (err) => {
    if (err) {
      logger.error(`Page not found: ${page}`);
      return res.status(404).send(`Page ${page} not found`);
    }
    
    fs.readFile(pagePath, 'utf8', (err, data) => {
      if (err) {
        logger.error(`Error reading page: ${page}`, { error: err.message });
        return res.status(500).send('Error loading page content');
      }
      
      res.send(data);
    });
  });
});

// API Routes
app.use('/api', apiRoutes);

// Error handling middleware (should be last)
app.use(errorHandler);

// Initialize services and start server
async function startServer() {
  try {
    // Initialize Google API
    await googleApiService.initialize();
    
    // Start server
    app.listen(config.server.port, () => {
      logger.info(`Server running on port ${config.server.port}`);
      console.log(`Server running on port ${config.server.port}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

// Start the server
startServer();
