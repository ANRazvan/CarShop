const jwt = require('jsonwebtoken');
const { UserLog } = require('../models');

// Ensure consistent JWT secret usage
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('CRITICAL ERROR: JWT_SECRET environment variable is not set!');
  process.exit(1);
}

// Authentication middleware
exports.auth = exports.authenticate = (req, res, next) => {
  try {
    // Get the request details for better logging
    const requestMethod = req.method;
    const requestPath = req.originalUrl;
    const contentType = req.headers['content-type'] || 'not specified';
    
    console.log(`Auth middleware: Processing ${requestMethod} request to ${requestPath}`);
    console.log(`Auth middleware: Content-Type: ${contentType}`);
    
    // Special handling for multipart/form-data requests
    if (contentType.includes('multipart/form-data')) {
      console.log('Auth middleware: Handling multipart/form-data request');
      console.log('Auth middleware: Available headers:', Object.keys(req.headers).join(', '));
    }
    
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log(`Auth middleware: No authorization header found for ${requestPath}`);
      return res.status(401).json({ message: 'Authentication required - No auth header' });
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) {
      console.log(`Auth middleware: No token in authorization header for ${requestPath}`);
      return res.status(401).json({ message: 'Authentication required - Invalid header format' });
    }
    
    console.log(`Auth middleware: Verifying token: ${token.substring(0, 10)}... for ${requestPath}`);
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    
    // Add request timestamp for monitoring
    req.authTimestamp = Date.now();
    
    console.log(`Auth middleware: User ${decoded.id} (${decoded.username || decoded.email}) authenticated for ${requestPath}`);
    
    // Log the authentication
    UserLog.create({
      userId: decoded.id,
      action: 'AUTHENTICATED',
      details: `${requestMethod} ${requestPath}`,
      ip: req.ip
    }).catch(err => console.error('Failed to log authentication:', err));
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: `Invalid or expired token: ${error.message}` });
  }
};

// Admin authorization middleware
exports.adminOnly = exports.authorizeAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Admin access only' });
  }
  next();
};

// Log user actions middleware
exports.logAction = (action, entityType) => {
  return async (req, res, next) => {
    // Store the original response methods
    const originalJson = res.json;
    const originalSend = res.send;
    
    // Override the json method to log after successful response
    res.json = function(data) {
      const statusCode = res.statusCode || 200;
      
      // Only log successful operations (2xx status codes)
      if (statusCode >= 200 && statusCode < 300 && req.user) {
        const entityId = req.params.id || (data?.id) || null;
        
        // Log the action asynchronously without blocking the response
        UserLog.create({
          userId: req.user.id,
          action,
          entityType,
          entityId,
          details: JSON.stringify({
            path: req.path,
            method: req.method,
            body: req.body ? { ...req.body, password: undefined } : undefined, // Don't log passwords
            params: req.params
          }),
          ipAddress: req.ip
        }).catch(err => {
          console.error('Error logging user action:', err);
        });
      }
      
      // Call the original method
      return originalJson.call(this, data);
    };
    
    // Also override send method for non-JSON responses
    res.send = function(data) {
      const statusCode = res.statusCode || 200;
      
      if (statusCode >= 200 && statusCode < 300 && req.user) {
        const entityId = req.params.id || null;
        
        UserLog.create({
          userId: req.user.id,
          action,
          entityType,
          entityId,
          details: JSON.stringify({
            path: req.path,
            method: req.method,
            params: req.params
          }),
          ipAddress: req.ip
        }).catch(err => {
          console.error('Error logging user action:', err);
        });
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

// Optional authentication middleware - doesn't require auth but provides user context when available
exports.optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      console.log('Optional auth: No authorization header, continuing without user context');
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) {
      console.log('Optional auth: No token in authorization header, continuing without user context');
      return next();
    }
    
    console.log(`Optional auth: Verifying token: ${token.substring(0, 10)}...`);
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    
    console.log(`Optional auth: User ${decoded.id} (${decoded.username || decoded.email}) authenticated`);
    
    next();
  } catch (error) {
    console.log('Optional auth: Token verification failed, continuing without user context:', error.message);
    // Don't fail the request, just continue without user context
    next();
  }
};

module.exports = exports;
