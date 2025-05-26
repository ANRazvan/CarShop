import React, { useState } from 'react';
import './Login.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import TwoFactorVerify from './TwoFactorVerify';

const Login = () => {
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
    setError('');
    
    try {
      if (isLogin) {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
          if (data.requires2FA) {
            setRequires2FA(true);
          } else {
            localStorage.setItem('token', data.token);
            navigate('/');
          }
        } else {
          setError(data.message || 'Authentication failed');
        }
      } else {
        await register(username, email, password);
        setIsLogin(true);
        setError('Registration successful! Please log in.');
      }
    } catch (error) {
      setError(error.message || 'Authentication failed');
    }
  };

  const handle2FASuccess = (data) => {
    localStorage.setItem('token', data.token);
    navigate('/');
  };

  const handle2FACancel = () => {
    setRequires2FA(false);
    setPassword('');
  };
  
  if (requires2FA) {
    return (
      <div className="login-container">
        <div className="login-form-container">
          <TwoFactorVerify 
            username={username}
            password={password}
            onSuccess={handle2FASuccess}
            onCancel={handle2FACancel}
          />
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
                required={!isLogin}
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
