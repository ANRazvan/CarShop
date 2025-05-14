const express = require('express');
const authController = require('../controllers/authController');
const { auth, adminOnly, logAction } = require('../middleware/authMiddleware');
const router = express.Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/profile', auth, logAction('VIEW', 'USER_PROFILE'), authController.getProfile);

module.exports = router;
