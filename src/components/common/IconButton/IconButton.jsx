import React from 'react';
import './IconButton.css';

const IconButton = ({ icon, onClick, size = 38, className, iconSize = 18 }) => {
  return (
    <button
      className={`icon-button ${className || ''}`}
      onClick={onClick}
      style={{ width: size, height: size, borderRadius: size / 2 }}
    >
      <img
        src={icon}
        alt="icon"
        className="icon-button-img"
        style={{ width: iconSize, height: iconSize }}
      />
    </button>
  );
};

export default IconButton;
