const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const User = require('../models/User');
const UserLog = require('../models/UserLog');
const twoFactorService = require('../services/twoFactorService');

// Ensure consistent JWT secret usage
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('CRITICAL ERROR: JWT_SECRET environment variable is not set!');
  process.exit(1);
}

// Register a new user
exports.register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already in use' });
    }

    // Create new user
    const isFirstUser = await User.count() === 0;
    let userRole = 'user';
    
    if (role === 'admin' && (isFirstUser || (req.user && req.user.role === 'admin'))) {
      userRole = 'admin';
    }

    console.log('Creating new user:', { username, email, role: userRole });
    
    const user = await User.create({
      username,
      email,
      password,
      role: userRole
    });

    await UserLog.create({
      userId: user.id,
      action: 'REGISTER',
      entityType: 'USER',
      entityId: user.id,
      details: 'User registration',
      ipAddress: req.ip
    });

    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    res.status(201).json({
      message: 'User registered successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    console.log('Login request received:', {
      body: req.body,
      headers: {
        'content-type': req.headers['content-type']
      }
    });

    if (!req.body || !req.body.username || !req.body.password) {
      console.log('Missing credentials in request');
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const { username, password, totpToken } = req.body;
    console.log('Attempting login for username:', username);

    // Find user
    const user = await User.findOne({ 
      where: { username },
      attributes: ['id', 'username', 'email', 'password', 'role', 'twoFactorEnabled', 'twoFactorSecret']
    });

    if (!user) {
      console.log(`User not found: ${username}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Validate password
    console.log('Validating password...');
    const isPasswordValid = await user.validatePassword(password);
    console.log('Password validation result:', { isValid: isPasswordValid });
    
    if (!isPasswordValid) {
      console.log(`Invalid password for user: ${username}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if 2FA is enabled and verify TOTP token
    if (user.twoFactorEnabled) {
      if (!totpToken) {
        console.log(`2FA required for user: ${username}`);
        return res.status(403).json({ 
          requires2FA: true,
          message: 'Two-factor authentication required' 
        });
      }

      try {
        const isValid = twoFactorService.verifyToken(totpToken, { base32: user.twoFactorSecret });
        if (!isValid) {
          console.log(`Invalid 2FA code for user: ${username}`);
          return res.status(401).json({ message: 'Invalid 2FA code' });
        }
      } catch (twoFactorError) {
        console.error('2FA verification error:', twoFactorError);
        return res.status(500).json({ message: 'Error verifying 2FA code' });
      }
    }

    // Update last login
    try {
      user.lastLogin = new Date();
      await user.save();
    } catch (saveError) {
      console.error('Error updating last login:', saveError);
      // Don't fail login if this fails
    }

    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not set!');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    // Generate JWT token
    try {
      const token = jwt.sign(
        { 
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Log successful login
      await UserLog.create({
        userId: user.id,
        action: 'LOGIN',
        details: user.twoFactorEnabled ? 'User login with 2FA' : 'User login'
      }).catch(err => console.error('Failed to log login:', err));

      console.log('Login successful for user:', username);
      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          twoFactorEnabled: user.twoFactorEnabled
        }
      });
    } catch (tokenError) {
      console.error('Error generating token:', tokenError);
      return res.status(500).json({ message: 'Error generating authentication token' });
    }
  } catch (error) {
    console.error('Login error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      message: 'Error logging in', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Error getting profile', error: error.message });
  }
};

// Verify JWT token
exports.verifyToken = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await UserLog.create({
      userId: req.user.id,
      action: 'TOKEN_VERIFY',
      details: 'Token verification successful',
      ip: req.ip
    });

    return res.status(200).json({
      message: 'Token is valid',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(500).json({ 
      message: 'Error verifying token',
      error: error.message 
    });
  }
};

// Refresh token
exports.refreshToken = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role }, 
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    await UserLog.create({
      userId: user.id,
      action: 'TOKEN_REFRESH',
      details: 'Refreshed authentication token',
      ip: req.ip
    });
    
    return res.status(200).json({
      message: 'Token refreshed',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(500).json({ 
      message: 'Error refreshing token',
      error: error.message 
    });
  }
};

// Verify backup code
exports.verifyBackupCode = async (req, res) => {
  try {
    const { username, backupCode } = req.body;
    
    const user = await User.findOne({ where: { username } });
    if (!user || !user.twoFactorEnabled) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValid = twoFactorService.verifyBackupCode(user.backupCodes, backupCode);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid backup code' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const updatedCodes = JSON.parse(user.backupCodes).filter(code => code !== backupCode);
    await user.update({ backupCodes: JSON.stringify(updatedCodes) });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Backup Code Verification Error:', error);
    res.status(500).json({ message: 'Error verifying backup code' });
  }
};

// 2FA setup - generates secret and QR code
exports.setup2FA = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is already enabled' });
    }

    const secret = twoFactorService.generateSecret(user.email);
    const qrCode = await twoFactorService.generateQRCode(secret);

    // Store the base32 secret temporarily in session
    user.twoFactorSecret = secret.base32;
    await user.save();

    res.json({
      qrCode,
      secret: secret.base32, // Only show this once during setup
      backupCodes: null // Will be generated after verification
    });
  } catch (error) {
    console.error('2FA Setup Error:', error);
    res.status(500).json({ message: 'Error setting up 2FA' });
  }
};

// Verify and enable 2FA
exports.verify2FASetup = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ message: '2FA setup not initiated' });
    }

    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    const isValid = twoFactorService.verifyToken(token, { base32: user.twoFactorSecret });
    
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    const backupCodes = twoFactorService.generateBackupCodes();

    await user.update({
      twoFactorEnabled: true,
      backupCodes: JSON.stringify(backupCodes)
    });

    // Clear the temporary secret
    delete req.session.tempSecret;

    res.json({
      message: '2FA enabled successfully',
      backupCodes // Show backup codes only once during setup
    });
  } catch (error) {
    console.error('2FA Verification Error:', error);
    res.status(500).json({ message: 'Error verifying 2FA setup' });
  }
};

// Disable 2FA
exports.disable2FA = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is not enabled' });
    }

    const isValid = twoFactorService.verifyToken(token, { base32: user.twoFactorSecret });
    
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    await user.update({
      twoFactorSecret: null,
      twoFactorEnabled: false,
      backupCodes: null
    });

    res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    console.error('2FA Disable Error:', error);
    res.status(500).json({ message: 'Error disabling 2FA' });
  }
};

// Regenerate backup codes
exports.regenerateBackupCodes = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is not enabled' });
    }

    // Verify current 2FA token for security
    const isValid = twoFactorService.verifyToken(token, { base32: user.twoFactorSecret });
    
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Generate new backup codes
    const newBackupCodes = twoFactorService.generateBackupCodes();

    await user.update({
      backupCodes: JSON.stringify(newBackupCodes)
    });

    // Log the action
    await UserLog.create({
      userId: user.id,
      action: 'BACKUP_CODES_REGENERATED',
      details: 'User regenerated backup codes',
      ip: req.ip
    });

    res.json({ 
      message: 'Backup codes regenerated successfully',
      backupCodes: newBackupCodes,
      warning: 'Save these codes in a secure location. Your old backup codes are no longer valid.'
    });
  } catch (error) {
    console.error('Regenerate Backup Codes Error:', error);
    res.status(500).json({ message: 'Error regenerating backup codes' });
  }
};
