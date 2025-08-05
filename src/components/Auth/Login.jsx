import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { DollarSign, Eye, EyeOff } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!credentials.username || !credentials.password) {
      setError('Please enter both username and password');
      return;
    }

    const success = login(credentials.username, credentials.password);
    if (!success) {
      setError('Invalid credentials. Use "demo" for both username and password.');
    }
  };

  const handleDemoLogin = () => {
    setCredentials({ username: 'demo', password: 'demo' });
    login('demo', 'demo');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <DollarSign size={48} />
          </div>
          <h1>Finance Manager</h1>
          <p>Track your finances with ease</p>
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
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                placeholder="Enter password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-btn">
            Sign In
          </button>

          <button type="button" className="demo-btn" onClick={handleDemoLogin}>
            Try Demo Account
          </button>
        </form>

        <div className="login-footer">
          <p>Demo credentials: username "demo", password "demo"</p>
        </div>
      </div>
    </div>
  );
};

export default Login;