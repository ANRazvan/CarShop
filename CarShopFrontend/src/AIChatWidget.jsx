import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import config from './config.js';
import './AIChatWidget.css';

const AIChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isServiceAvailable, setIsServiceAvailable] = useState(true);
  const messagesEndRef = useRef(null);
  const { getAuthToken, isAuthenticated, currentUser } = useAuth();

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check if AI service is available when component mounts
  useEffect(() => {
    checkServiceStatus();
  }, []);

  const checkServiceStatus = async () => {
    try {
      const response = await fetch(`${config.API_URL}/api/chat/status`);
      const data = await response.json();
      setIsServiceAvailable(data.aiChatAvailable);
    } catch (error) {
      console.error('Failed to check AI service status:', error);
      setIsServiceAvailable(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');

    // Add user message to chat
    const newUserMessage = {
      id: Date.now(),
      sender: 'user',
      message: userMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      // Prepare conversation history for context
      const conversationHistory = messages.slice(-10).map(msg => ({
        sender: msg.sender,
        message: msg.message
      }));

      // Prepare headers
      const headers = {
        'Content-Type': 'application/json'
      };

      // Add auth token if user is authenticated
      if (isAuthenticated()) {
        const token = getAuthToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const response = await fetch(`${config.API_URL}/api/chat/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: userMessage,
          conversationHistory
        })
      });

      const data = await response.json();

      if (data.success) {
        // Add AI response to chat
        const aiMessage = {
          id: Date.now() + 1,
          sender: 'ai',
          message: data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        // Add error message
        const errorMessage = {
          id: Date.now() + 1,
          sender: 'system',
          message: data.error || 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'system',
        message: 'Sorry, I\'m having trouble connecting. Please try again later.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isServiceAvailable) {
    return null; // Don't show the widget if service is not available
  }

  return (
    <div className={`ai-chat-widget ${isOpen ? 'open' : ''}`}>
      {/* Chat Toggle Button */}
      <button 
        className="chat-toggle-btn" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle AI Chat"
      >
        <span className="chat-icon">
          {isOpen ? '✕' : '💬'}
        </span>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          {/* Chat Header */}
          <div className="chat-header">
            <h3>CarShop Assistant</h3>
            <div className="chat-header-actions">
              <button 
                className="clear-chat-btn" 
                onClick={clearChat}
                title="Clear conversation"
              >
                🗑️
              </button>
              <button 
                className="close-chat-btn" 
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="welcome-message">
                <p>👋 Hi{isAuthenticated() ? ` ${currentUser?.username}` : ''}! I'm your CarShop assistant.</p>
                <p>Ask me anything about:</p>
                <ul>
                  <li>How to use CarShop</li>
                  <li>Managing your cars</li>
                  <li>Account questions</li>
                  <li>Site features</li>
                </ul>
              </div>
            )}
            
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`message ${message.sender}`}
              >
                <div className="message-content">
                  <p>{message.message}</p>
                  <span className="message-time">
                    {formatTimestamp(message.timestamp)}
                  </span>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="message ai">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="chat-input-container">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about CarShop..."
              className="chat-input"
              rows={2}
              disabled={isLoading}
              maxLength={1000}
            />
            <button 
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="send-btn"
              aria-label="Send message"
            >
              {isLoading ? '⏳' : '📤'}
            </button>
          </div>
          
          <div className="chat-footer">
            <small>AI-powered assistant • Be kind and respectful</small>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChatWidget;
