# AI Chat Feature Setup Guide

This guide explains how to set up and use the AI-powered chat assistant in your CarShop application.

## Overview

The AI chat feature provides users with an intelligent assistant that can answer questions about:
- How to use the CarShop application
- Account management and features
- Site navigation and functionality
- Car listing and management

## Backend Setup

### 1. Install Dependencies

The required dependency has already been installed:
```bash
npm install @google/generative-ai
```

### 2. Get Google Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### 3. Configure Environment Variables

Add your Gemini API key to the `.env` file in the CarShopBackend folder:

```properties
# AI Chat Configuration
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

**Replace `your_actual_gemini_api_key_here` with your actual Google Gemini API key.**

### 4. Backend Components

The following files have been created/modified for the AI chat feature:

- `services/aiChatService.js` - Core AI service using Google Gemini
- `controllers/chatController.js` - HTTP request handlers
- `routes/chat.js` - API endpoints
- `middleware/authMiddleware.js` - Added optional auth middleware
- `index.js` - Registered chat routes

### 5. API Endpoints

- `POST /api/chat/chat` - Send message to AI assistant
- `GET /api/chat/status` - Check if AI service is available

## Frontend Setup

### 1. Components Added

- `AIChatWidget.jsx` - Main chat widget component
- `AIChatWidget.css` - Styling for the chat widget

### 2. Integration

The chat widget has been integrated into the main App component and will appear as a floating chat button in the bottom-right corner of all pages.

## Features

### Chat Widget Features

- **Floating Interface**: Non-intrusive floating chat button
- **Contextual Responses**: AI provides context-aware responses based on user authentication status
- **Conversation History**: Maintains conversation context for better responses
- **Responsive Design**: Works on both desktop and mobile devices
- **Loading States**: Shows typing indicators and loading states
- **Error Handling**: Gracefully handles service unavailability

### AI Assistant Capabilities

- **Site Navigation**: Help users understand how to use different features
- **Account Questions**: Answer questions about user accounts and car collections
- **Feature Explanation**: Explain how to add, edit, or delete cars
- **General Support**: Provide helpful information about the CarShop platform

## Usage

### For Users

1. Look for the chat icon (💬) in the bottom-right corner
2. Click to open the chat window
3. Type your question and press Enter or click the send button
4. The AI will respond with helpful information

### For Developers

#### Testing the API

```bash
# Check service status
curl http://localhost:5000/api/chat/status

# Send a chat message (without auth)
curl -X POST http://localhost:5000/api/chat/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How do I add a new car?"}'

# Send a chat message (with auth)
curl -X POST http://localhost:5000/api/chat/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"message": "How many cars do I have?"}'
```

## Configuration

### Customizing AI Responses

You can modify the system prompt in `services/aiChatService.js` to:
- Add more specific information about your application
- Change the AI's personality or tone
- Add or remove features the AI should know about

### Rate Limiting

Consider implementing rate limiting for the chat endpoints in production:

```javascript
// Example using express-rate-limit
const rateLimit = require('express-rate-limit');

const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50 // limit each IP to 50 requests per windowMs
});

router.use('/chat', chatLimiter);
```

## Security Considerations

- The chat service uses optional authentication - it works for both logged-in and anonymous users
- User context (username, car count) is only provided when users are authenticated
- API keys are stored securely in environment variables
- Input validation prevents excessively long messages

## Troubleshooting

### Chat Widget Not Appearing

1. Check if `GEMINI_API_KEY` is set in the backend `.env` file
2. Verify the backend service is running and accessible
3. Check browser console for any JavaScript errors
4. Verify the `/api/chat/status` endpoint returns `aiChatAvailable: true`

### AI Not Responding

1. Check backend logs for API errors
2. Verify your Gemini API key is valid and has quota remaining
3. Check network connectivity to Google's Gemini API
4. Ensure the backend service is properly started

### Authentication Issues

If you get authentication errors:
1. The chat works without authentication, so this shouldn't block basic functionality
2. Logged-in users get personalized responses with their username and car count
3. Check JWT token validity if you want personalized responses

## Cost Considerations

- Google Gemini API has free tier limits
- Monitor your API usage in Google AI Studio
- Consider implementing rate limiting and message length limits
- Cache common responses if needed

## Future Enhancements

Possible improvements you could add:
- Message persistence/history
- Rich text responses with formatting
- File upload capabilities for car images
- Integration with car search functionality
- Voice input/output
- Multilingual support
