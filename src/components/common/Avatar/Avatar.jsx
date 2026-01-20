import React from 'react';
import './Avatar.css';

const Avatar = ({ name, size = 38, onPress, className }) => {
  const initial = name ? name.charAt(0).toUpperCase() : '?';

  const style = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const content = (
    <div className={`avatar ${className || ''}`} style={style}>
      <span className="avatar-text">{initial}</span>
    </div>
  );

  if (onPress) {
    return (
      <button className="avatar-button" onClick={onPress}>
        {content}
      </button>
    );
  }

  return content;
};

export default Avatar;
