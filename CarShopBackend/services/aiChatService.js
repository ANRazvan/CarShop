const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIChatService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.initialize();
  }

  initialize() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY not found in environment variables. AI chat will not be available.');
      return;
    }    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      console.log('AI Chat Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AI Chat Service:', error);
    }
  }

  isAvailable() {
    return this.model !== null;
  }

  getSystemPrompt(userContext = {}) {
    const { username, carCount, isAuthenticated } = userContext;
    
    return `You are a helpful AI assistant for CarShop, a car marketplace application. Here's what you need to know about the application:

ABOUT CARSHOP:
- CarShop is a web application where users can buy and sell cars
- Users can register accounts, login, and manage their car listings
- Features include: browsing cars, adding cars for sale, editing/deleting their own cars, user authentication, and more
- The app has both public car listings and personal car collections for logged-in users

USER CONTEXT:
${isAuthenticated ? `- User is logged in as: ${username}` : '- User is not logged in'}
${carCount !== undefined ? `- User has ${carCount} car(s) in their collection` : ''}

PAGES/FEATURES:
- Home: Browse all available cars for sale
- My Cars: View and manage your own car listings (requires login)
- Add Car: Add a new car to sell (requires login)
- Login/Register: User authentication
- Car details: View individual car information

HOW TO HELP:
- Answer questions about how to use the application
- Help with account-related questions
- Explain features and navigation
- Provide guidance on buying/selling cars on the platform
- Be friendly and concise
- If asked about technical issues, suggest contacting support

GUIDELINES:
- Keep responses helpful and focused on CarShop functionality
- Don't provide information about real car prices or make purchasing recommendations
- Don't access or modify user data
- For account issues, recommend logging out and back in or contacting support

Please provide helpful, accurate information about using CarShop.`;
  }

  async generateResponse(userMessage, userContext = {}) {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: 'AI chat service is not available. Please check the server configuration.'
      };
    }

    try {
      const systemPrompt = this.getSystemPrompt(userContext);
      const fullPrompt = `${systemPrompt}\n\nUser question: ${userMessage}`;

      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        response: text
      };
    } catch (error) {
      console.error('AI Chat Service error:', error);
      return {
        success: false,
        error: 'Failed to generate response. Please try again later.'
      };
    }
  }

  async generateContextualResponse(userMessage, conversationHistory = [], userContext = {}) {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: 'AI chat service is not available. Please check the server configuration.'
      };
    }

    try {
      const systemPrompt = this.getSystemPrompt(userContext);
      
      // Build conversation context
      let conversationContext = '';
      if (conversationHistory.length > 0) {
        conversationContext = '\n\nPrevious conversation:\n';
        conversationHistory.slice(-6).forEach(msg => { // Keep last 6 messages for context
          conversationContext += `${msg.sender}: ${msg.message}\n`;
        });
      }

      const fullPrompt = `${systemPrompt}${conversationContext}\n\nUser question: ${userMessage}`;

      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        response: text
      };
    } catch (error) {
      console.error('AI Chat Service error:', error);
      return {
        success: false,
        error: 'Failed to generate response. Please try again later.'
      };
    }
  }
}

module.exports = new AIChatService();
