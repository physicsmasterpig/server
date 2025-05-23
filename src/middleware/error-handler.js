/**
 * Error Handler Middleware
 * Centralized error handling for consistent API responses
 */
const logger = require('../services/logger.service');

/**
 * Error handler middleware
 * @param {Error} err - Error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
function errorHandler(err, req, res, next) {
  // Log the error
  logger.error('API Error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });
  
  // Set status code
  const statusCode = err.statusCode || 500;
  
  // Send error response
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
}

module.exports = errorHandler;
