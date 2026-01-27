import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import robotImg from '../../assets/images/login_maskot.png';
import { useAuth } from '../../contexts/AuthContext';
import { apiRequest } from '../../lib/api';

const Login = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { login, setIsLoading, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleCredentialChange = (field) => (event) => {
    setCredentials((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!credentials.email || !credentials.password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: {
          email: credentials.email,
          password: credentials.password,
        },
      });

      console.log('Login response:', response);

      if (response.ok && response.data) {
        // Backend returns: { success, data: { user, token }, message }
        const responseData = response.data.data || response.data;
        const token = responseData.token;
        const rawUser = responseData.user;

        if (!token || !rawUser) {
          console.error('Missing token or user in response:', response.data);
          throw new Error('Invalid response from server');
        }

        // Transform user object to match frontend expectations
        const user = {
          id: rawUser.id,
          name: rawUser.name,
          email: rawUser.email,
          role: rawUser.role?.name || 'user',
          department: rawUser.department?.name || rawUser.department?.code || 'N/A',
        };

        login(token, user);
        navigate('/dashboard');
      } else {
        // Show detailed error message
        let errorMsg = response.data?.message || `Server error: ${response.status}`;

        // If there are validation errors, show them
        if (response.data?.errors) {
          const errors = response.data.errors;
          const errorList = Object.values(errors).flat();
          errorMsg = errorList.join(', ');
        }

        console.error('Login failed:', response);
        setError(errorMsg);
      }
    } catch (err) {
      console.error('Login error:', err);

      // Better error messages
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        setError('Cannot connect to server. Is the backend running?');
      } else if (err.message.includes('NetworkError')) {
        setError('Network error. Check your connection.');
      } else {
        setError(err.message || 'Failed to login. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Dummy login for testing (bypasses API)
  const handleDummyLogin = (role) => {
    const dummyToken = `dummy_token_${role}_${Date.now()}`;
    const dummyUser = {
      id: 1,
      name: role === 'user' ? 'Toni Apalah' : role === 'atasan' ? 'Manager User' : 'Admin User',
      email: `${role}@example.com`,
      role: role,
      department: role === 'user' ? 'ECOMERS' : 'IT',
    };

    login(dummyToken, dummyUser);
    navigate('/dashboard');
  };

  return (
    <div className="login-page">
      <div className="login-hero" aria-hidden="true"></div>

      <div className="login-card">
        <h1>Welcome!</h1>
        <p>Please enter your details</p>
        <div className="login-divider"></div>

        <form onSubmit={handleLogin}>
          <label>
            Email
            <input
              type="text"
              placeholder="Email"
              value={credentials.email}
              onChange={handleCredentialChange('email')}
              disabled={isLoading}
            />
          </label>

          <label>
            Password
            <input
              type="password"
              placeholder="Password"
              value={credentials.password}
              onChange={handleCredentialChange('password')}
              disabled={isLoading}
            />
          </label>

          {error && <div className="login-error">{error}</div>}

          <button
            className="login-btn"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="login-alt">
          <button
            type="button"
            className="login-alt-btn"
            onClick={() => handleDummyLogin('user')}
            disabled={isLoading}
          >
            Login sebagai User
          </button>
          <button
            type="button"
            className="login-alt-btn"
            onClick={() => handleDummyLogin('atasan')}
            disabled={isLoading}
          >
            Login sebagai Atasan
          </button>
          <button
            type="button"
            className="login-alt-btn"
            onClick={() => handleDummyLogin('admin')}
            disabled={isLoading}
          >
            Login sebagai Admin
          </button>
        </div>

        <img src={robotImg} alt="" className="login-robot" />
      </div>
    </div>
  );
};

export default Login;
