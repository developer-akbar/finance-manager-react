import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { DollarSign, Eye, EyeOff, UserPlus, LogIn } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [credentials, setCredentials] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    confirmPassword: '' 
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login logic
        if (!credentials.username || !credentials.password) {
          setError('Please enter both username and password');
          return;
        }

        const result = await login(credentials.username, credentials.password);
        if (!result.success) {
          setError(result.message);
        }
      } else {
        // Registration logic
        if (!credentials.username || !credentials.email || !credentials.password || !credentials.confirmPassword) {
          setError('Please fill in all fields');
          return;
        }

        if (credentials.password !== credentials.confirmPassword) {
          setError('Passwords do not match');
          return;
        }

        if (credentials.password.length < 6) {
          setError('Password must be at least 6 characters long');
          return;
        }

        const result = await register({
          username: credentials.username,
          email: credentials.email,
          password: credentials.password
        });

        if (!result.success) {
          setError(result.message);
        }
      }
    } catch (error) {
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const result = await login('demo', 'demo');
      if (!result.success) {
        setError(result.message);
      }
    } catch (error) {
      setError(error.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setCredentials({ username: '', email: '', password: '', confirmPassword: '' });
    setError('');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <DollarSign size={48} />
          </div>
          <h1>Finance Manager</h1>
          <p>{isLogin ? 'Sign in to your account' : 'Create a new account'}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              placeholder="Enter username"
              disabled={loading}
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={credentials.email}
                onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                placeholder="Enter email"
                disabled={loading}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                placeholder="Enter password"
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-input">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={credentials.confirmPassword}
                  onChange={(e) => setCredentials({ ...credentials, confirmPassword: e.target.value })}
                  placeholder="Confirm password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>

          {isLogin && (
            <button type="button" className="demo-btn" onClick={handleDemoLogin} disabled={loading}>
              Try Demo Account
            </button>
          )}
        </form>

        <div className="login-footer">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button type="button" className="toggle-mode-btn" onClick={toggleMode}>
              {isLogin ? (
                <>
                  <UserPlus size={16} />
                  Sign Up
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  Sign In
                </>
              )}
            </button>
          </p>
          
          {isLogin && (
            <p className="demo-info">Demo credentials: username "demo", password "demo"</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;