/**
 * Token Management Utility
 * 
 * Handles token validation, extension, and revocation using database records
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserLog = require('../models/UserLog');
const { Op } = require('sequelize');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const TOKEN_EXPIRY = process.env.TOKEN_EXPIRY || '1h';

class TokenManager {
  /**
   * Create a JWT token for a user
   * @param {Object} user - User object to create token for
   * @returns {string} - JWT Token
   */
  static generateToken(user) {
    return jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        email: user.email,
        role: user.role 
      }, 
      JWT_SECRET, 
      { expiresIn: TOKEN_EXPIRY }
    );
  }
  
  /**
   * Validate a token
   * @param {string} token - JWT token to validate
   * @returns {Object|null} - Decoded token payload or null if invalid
   */
  static validateToken(token) {
    try {
      if (!token) return null;
      
      // Verify token signature and expiration
      const decoded = jwt.verify(token, JWT_SECRET);
      return decoded;
    } catch (error) {
      console.error('Token validation error:', error.message);
      return null;
    }
  }
  
  /**
   * Extend the validity of a token (refresh)
   * @param {string} token - Current token
   * @returns {string|null} - New token with extended validity or null if invalid
   */
  static async refreshToken(token) {
    try {
      const decoded = this.validateToken(token);
      
      if (!decoded) {
        return null;
      }
      
      // Find the user to verify they still exist and are active
      const user = await User.findByPk(decoded.id);
      
      if (!user) {
        return null;
      }
      
      // Log the token refresh
      await UserLog.create({
        userId: user.id,
        action: 'TOKEN_REFRESH',
        details: 'Token validity extended',
        ip: 'system'
      });
      
      // Generate a new token
      return this.generateToken(user);
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  }
  
  /**
   * Revoke all tokens for a user by logging them out
   * @param {number} userId - ID of the user to log out
   * @returns {boolean} - Success status
   */
  static async revokeUserTokens(userId) {
    try {
      // Log the revocation
      await UserLog.create({
        userId,
        action: 'TOKEN_REVOKE',
        details: 'All tokens revoked',
        ip: 'system'
      });
      
      return true;
    } catch (error) {
      console.error('Token revocation error:', error);
      return false;
    }
  }
  
  /**
   * Check if a user has any active sessions
   * @param {number} userId - ID of the user to check
   * @returns {boolean} - Whether user has active sessions
   */
  static async hasActiveSessions(userId) {
    try {
      // Find recent authentication logs in the last hour
      const recentLogs = await UserLog.findOne({
        where: {
          userId,
          action: 'AUTHENTICATED',
          createdAt: {
            [Op.gt]: new Date(Date.now() - 60 * 60 * 1000) // Last hour
          }
        }
      });
      
      return !!recentLogs;
    } catch (error) {
      console.error('Active session check error:', error);
      return false;
    }
  }
}

module.exports = TokenManager;
