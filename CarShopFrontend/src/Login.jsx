import React, { useState } from 'react';
import './Login.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import TwoFactorVerify from './TwoFactorVerify';
import api from './services/api';

const Login = () => {
  console.log('Login component rendered');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const navigate = useNavigate();
  const { login, register, authError } = useAuth();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');      try {
      if (isLogin) {
        try {
          const response = await api.post('/api/auth/login', {
            username,
            password
          });

          console.log('Login response received:', response);
          // If we get here, it's a successful login with token
          localStorage.setItem('authToken', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          window.location.href = '/';
        } catch (error) {
          console.log('Login error caught:', error);
          // Check if this is a 2FA requirement
          if (error.requires2FA || (error.response?.status === 403 && error.response?.data?.requires2FA)) {
            console.log('2FA required, showing verification form');
            setRequires2FA(true);
          } else {
            // Re-throw other errors to be caught by the outer catch
            throw error;
          }
        }
      } else {
        await register(username, email, password);
        setIsLogin(true);
        setError('Registration successful! Please log in.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'Authentication failed');
    }
  };

  const handle2FASuccess = (data) => {
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    window.location.href = '/';
  };

  const handle2FACancel = () => {
    setRequires2FA(false);
    setPassword('');
  };  // Render 2FA form if required
  if (requires2FA) {
    console.log('Rendering 2FA form with credentials:', { username, password });
    return (
      <div className="login-container">
        <div className="login-form-container">
          <h2>Two-Factor Authentication Required</h2>
          {username && password ? (
            <TwoFactorVerify 
              username={username}
              password={password}
              onSuccess={handle2FASuccess}
              onCancel={handle2FACancel}
            />
          ) : (
            <div className="error-message">Error: Missing credentials</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-form-container">
        <h2>{isLogin ? 'Login' : 'Register'}</h2>
        {error && <div className="error-message">{error}</div>}
        {authError && <div className="error-message">{authError}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="login-button">
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>
        
        <div className="form-footer">
          <p>
            {isLogin
              ? "Don't have an account? "
              : 'Already have an account? '}
            <button
              className="toggle-form-button"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Register' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
