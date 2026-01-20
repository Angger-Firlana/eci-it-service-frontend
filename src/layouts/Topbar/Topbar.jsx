import React, { useState, useEffect, useRef } from 'react';
import './Topbar.css';
import Avatar from '../../components/common/Avatar/Avatar';

const Topbar = ({ user }) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const handleNotificationPress = () => {
    console.log('Notification pressed');
  };

  const handleLogout = () => {
    console.log('Logout');
    setIsUserMenuOpen(false);
  };

  return (
    <div className="topbar">
      {/* Notification Button */}
      <button className="icon-btn" onClick={handleNotificationPress} aria-label="Notifikasi">
        <i className="bi bi-bell" style={{ fontSize: '18px' }}></i>
      </button>

      {/* User Avatar */}
      <div className="user-area" ref={menuRef}>
        <Avatar
          name={user?.name || 'User'}
          onPress={() => setIsUserMenuOpen(!isUserMenuOpen)}
        />

        {/* User Menu Dropdown */}
        <div className={`user-menu ${isUserMenuOpen ? 'open' : ''}`}>
          <div className="um-head">
            <div>
              <div className="um-name">{user?.name || 'User'}</div>
              <div className="um-email">{user?.email || 'user@example.com'}</div>
            </div>
            <span className="um-role">{user?.role || 'User'}</span>
          </div>

          <div className="um-dept">{user?.department || 'Department'}</div>

          <div className="um-divider"></div>

          <button className="um-logout" type="button" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
