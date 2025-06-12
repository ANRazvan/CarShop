const aiChatService = require('../services/aiChatService');
const { User, Car } = require('../models');

const chatController = {
  // Handle AI chat messages
  async chat(req, res) {
    try {
      const { message, conversationHistory = [] } = req.body;

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Message is required and must be a non-empty string'
        });
      }

      if (message.length > 1000) {
        return res.status(400).json({
          success: false,
          error: 'Message is too long. Please keep it under 1000 characters.'
        });
      }

      // Get user context if authenticated
      let userContext = {
        isAuthenticated: false
      };

      if (req.user) {
        try {
          // Get user's car count
          const carCount = await Car.count({
            where: { userId: req.user.id }
          });

          userContext = {
            isAuthenticated: true,
            username: req.user.username,
            carCount: carCount
          };
        } catch (error) {
          console.error('Error fetching user context:', error);
          // Continue with basic context if there's an error
          userContext = {
            isAuthenticated: true,
            username: req.user.username
          };
        }
      }

      // Generate AI response
      const aiResponse = await aiChatService.generateContextualResponse(
        message.trim(),
        conversationHistory,
        userContext
      );

      if (!aiResponse.success) {
        return res.status(500).json({
          success: false,
          error: aiResponse.error
        });
      }

      res.json({
        success: true,
        response: aiResponse.response,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Chat controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error. Please try again later.'
      });
    }
  },

  // Get chat service status
  async getStatus(req, res) {
    try {
      const isAvailable = aiChatService.isAvailable();
      
      res.json({
        success: true,
        aiChatAvailable: isAvailable,
        message: isAvailable 
          ? 'AI chat service is available' 
          : 'AI chat service is not configured'
      });
    } catch (error) {
      console.error('Error checking chat service status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check service status'
      });
    }
  }
};

module.exports = chatController;
