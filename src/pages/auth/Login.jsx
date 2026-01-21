import React from 'react';
import './Login.css';
import robotImg from '../../assets/images/login_maskot.png';

const Login = ({ onLogin }) => {
  return (
    <div className="login-page">
      <div className="login-hero" aria-hidden="true"></div>

      <div className="login-card">
        <h1>Welcome!</h1>
        <p>Please enter your details</p>
        <div className="login-divider"></div>

        <label>
          Username
          <input type="text" placeholder="Username" />
        </label>

        <label>
          Password
          <input type="password" placeholder="Password" />
        </label>

        <button className="login-btn" type="button" onClick={() => onLogin?.('user')}>
          Login
        </button>

        <div className="login-alt">
          <button
            type="button"
            className="login-alt-btn"
            onClick={() => onLogin?.('user')}
          >
            Login sebagai User
          </button>
          <button
            type="button"
            className="login-alt-btn"
            onClick={() => onLogin?.('atasan')}
          >
            Login sebagai Atasan
          </button>
          <button
            type="button"
            className="login-alt-btn"
            onClick={() => onLogin?.('admin')}
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
