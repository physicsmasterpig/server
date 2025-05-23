/**
 * Request Logger Middleware
 * Logs all incoming API requests
 */
const logger = require('../services/logger.service');

/**
 * Request logger middleware
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
function requestLogger(req, res, next) {
  // Log request details
  logger.info('API Request', {
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    query: req.query,
    params: req.params
  });
  
  // Track response time
  const startTime = Date.now();
  
  // Log response after it's sent
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    logger.info('API Response', {
      path: req.path,
      method: req.method,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });
  
  next();
}

module.exports = requestLogger;
