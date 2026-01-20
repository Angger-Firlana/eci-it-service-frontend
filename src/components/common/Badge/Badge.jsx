import React from 'react';
import './Badge.css';

const Badge = ({ label, variant = 'default', className }) => {
  return (
    <div className={`badge badge-${variant} ${className || ''}`}>
      <span className="badge-text">{label}</span>
    </div>
  );
};

export default Badge;
