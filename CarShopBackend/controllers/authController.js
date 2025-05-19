const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const User = require('../models/User');
const UserLog = require('../models/UserLog');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({
      where: {
        username
      }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
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
    await UserLog.create({
      userId: user.id,
      action: 'LOGIN',
      entityType: 'USER',
      entityId: user.id,
      details: 'User login',
      ipAddress: req.ip
    });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
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

module.exports = exports;
