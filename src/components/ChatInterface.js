import React, { useState, useRef, useEffect } from 'react';
import './ChatInterface.css';

const getSessionId = () => {
  let sessionId = localStorage.getItem('chatSessionId');
  if (!sessionId) {
    if (window.crypto && window.crypto.randomUUID) {
      sessionId = window.crypto.randomUUID();
    } else {
      // Fallback for older browsers
      sessionId = 'session-' + Math.random().toString(36).substr(2, 16) + Date.now();
    }
    localStorage.setItem('chatSessionId', sessionId);
  }
  return sessionId;
};

const ChatInterface = () => {
  const [messages, setMessages] = useState([
    {
      type: 'ai',
      content: 'Hello! I\'m your AI assistant. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const sessionId = useRef(getSessionId());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Send message to AI endpoint
      const response = await fetch('https://n8n.alchemytech.in/webhook/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          timestamp: userMessage.timestamp.toISOString(),
          sessionId: sessionId.current
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Add AI response to chat
      let aiContent = 'I received your message, but I don\'t have a response right now.';
      if (Array.isArray(data) && data[0]?.output) {
        aiContent = data[0].output;
      } else if (data.response) {
        aiContent = data.response;
      } else if (data.message) {
        aiContent = data.message;
      }

      const aiMessage = {
        type: 'ai',
        content: aiContent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage = {
        type: 'ai',
        content: 'Sorry, I\'m having trouble connecting right now. Please try again later.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>AI Chat Assistant</h2>
        <div className="status-indicator">
          <span className={`status-dot ${isLoading ? 'loading' : 'online'}`}></span>
          <span className="status-text">
            {isLoading ? 'AI is typing...' : 'Online'}
          </span>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.type}`}>
            <div className="message-content">
              <div className="message-text">{message.content}</div>
              <div className="message-time">{formatTime(message.timestamp)}</div>
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

      <form className="chat-input-form" onSubmit={sendMessage}>
        <div className="input-container">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message here..."
            disabled={isLoading}
            className="chat-input"
          />
          <button 
            type="submit" 
            disabled={!inputValue.trim() || isLoading}
            className="send-button"
          >
            {isLoading ? '⏳' : '➤'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
