const jwt = require('jsonwebtoken');
const UserLog = require('../models/UserLog');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Authentication middleware
exports.auth = exports.authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
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

module.exports = exports;
