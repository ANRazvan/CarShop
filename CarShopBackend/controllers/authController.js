const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const User = require('../models/User');
const UserLog = require('../models/UserLog');
const tokenManager = require('../utils/tokenManager');
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
    const { username, email, password, role } = req.body;    // Check if username or email already exists
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
    // Only allow admin creation if specified in environment or if it's the first user
    const isFirstUser = await User.count() === 0;
    let userRole = 'user';
    
    if (role === 'admin') {
      // Check if the requester has rights to create admin
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          if (decoded.role === 'admin' || isFirstUser) {
            userRole = 'admin';
          }
        } catch (err) {
          // If token verification failed, continue as normal user
        }
      } else if (isFirstUser) {
        // If this is the first user ever, allow admin role
        userRole = 'admin';
      }
    }    console.log('Creating new user:', { username, email, role: userRole });
    
    const user = await User.create({
      username,
      email,
      password,
      role: userRole
    });

    // Create log entry for registration
    await UserLog.create({
      userId: user.id,
      action: 'REGISTER',
      entityType: 'USER',
      entityId: user.id,
      details: 'User registration',
      ipAddress: req.ip
    });

    // Return user without password
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
        'content-type': req.headers['content-type'],
        'authorization': req.headers['authorization']
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
      where: {
        username
      }
    });

    console.log('User lookup result:', { 
      found: !!user, 
      userId: user?.id,
      userExists: !!user,
      hasPassword: user ? !!user.password : false
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Validate password
    console.log('Validating password...');
    const isPasswordValid = await user.validatePassword(password);
    console.log('Password validation result:', { isValid: isPasswordValid });
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if 2FA is enabled and verify TOTP token
    if (user.twoFactorEnabled) {
      if (!totpToken) {
        return res.status(403).json({ 
          requires2FA: true,
          message: 'Two-factor authentication required' 
        });
      }

      const isValid = twoFactorService.verifyToken(totpToken, { base32: user.twoFactorSecret });
      if (!isValid) {
        return res.status(401).json({ message: 'Invalid 2FA code' });
      }
    }

    // Update last login
    console.log('Updating last login...');
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    console.log('Generating JWT token...');
    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not set!');
      return res.status(500).json({ message: 'Server configuration error' });
    }

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

    // Log login action
    console.log('Creating login log entry...');
    await UserLog.create({
      userId: user.id,
      action: 'LOGIN',
      details: user.twoFactorEnabled ? 'User login with 2FA' : 'User login'
    });

    console.log('Login successful for user:', username);
    res.status(200).json({
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
  } catch (error) {
    console.error('Login error details:', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
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
    // If the auth middleware passed, the token is valid
    // and req.user is already populated
    if (!req.user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Return the user details without sensitive info
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Log the token verification
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
    // Token is already validated by auth middleware
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Find user in database
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Generate a new token
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '1h' }
    );
    
    // Log the token refresh
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
    
    // Store secret temporarily in session
    req.session.tempSecret = secret;

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
    const secret = req.session.tempSecret;
    
    if (!secret) {
      return res.status(400).json({ message: '2FA setup not initiated' });
    }

    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    const isValid = twoFactorService.verifyToken(token, secret);
    
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    const user = await User.findByPk(req.user.id);
    const backupCodes = twoFactorService.generateBackupCodes();

    await user.update({
      twoFactorSecret: secret.base32,
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

// Modified login to handle 2FA
exports.login = async (req, res) => {
    try {
        const { email, password, totpToken } = req.body;
        const user = await User.findOne({ where: { email } });

        if (!user || !user.comparePassword(password)) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if 2FA is enabled
        if (user.twoFactorEnabled) {
            if (!totpToken) {
                return res.status(403).json({ 
                    requires2FA: true,
                    message: 'Please provide 2FA code' 
                });
            }

            const isValid = twoFactorService.verifyToken(totpToken, { base32: user.twoFactorSecret });
            if (!isValid) {
                return res.status(401).json({ message: 'Invalid 2FA code' });
            }
        }

        // Generate JWT token
        const token = tokenManager.generateToken(user);
        res.json({ token, user: { id: user.id, email: user.email } });
    } catch (error) {
        res.status(500).json({ message: 'Error during login' });
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

        // Generate a new JWT token
        const token = jwt.sign(
          { id: user.id, username: user.username, role: user.role },
          JWT_SECRET,
          { expiresIn: '1h' }
        );

        // Update the backup codes list (remove used code)
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
