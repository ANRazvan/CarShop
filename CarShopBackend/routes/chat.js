const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { optionalAuth } = require('../middleware/authMiddleware');

// Optional auth middleware - allows both authenticated and non-authenticated users
// but provides user context when available
router.use(optionalAuth);

// Chat with AI assistant
router.post('/chat', chatController.chat);

// Get AI chat service status
router.get('/status', chatController.getStatus);

module.exports = router;
