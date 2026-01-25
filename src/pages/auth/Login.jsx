import React, { useState } from 'react';
import './Login.css';
import robotImg from '../../assets/images/login_maskot.png';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);
  const { login } = useAuth();

  const handleCredentialChange = (field) => (event) => {
    setCredentials((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setError('');
    setSubmitting(true);
    try {
      await login(credentials);
    } catch (err) {
      setError(err.message || 'Login gagal.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-hero" aria-hidden="true"></div>

      <div className="login-card">
        <h1>Welcome!</h1>
        <p>Please enter your details</p>
        <div className="login-divider"></div>

        <label>
          Username
          <input
            type="text"
            placeholder="Username"
            value={credentials.email}
            onChange={handleCredentialChange('email')}
          />
        </label>

        <label>
          Password
          <input
            type="password"
            placeholder="Password"
            value={credentials.password}
            onChange={handleCredentialChange('password')}
          />
        </label>

        {error && <div className="login-error">{error}</div>}

        <button className="login-btn" type="button" onClick={handleSubmit}>
          {isSubmitting ? 'Memproses...' : 'Login'}
        </button>

        <img src={robotImg} alt="" className="login-robot" />
      </div>
    </div>
  );
};

export default Login;
