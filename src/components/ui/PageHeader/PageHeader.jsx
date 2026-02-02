import React from 'react';

const PageHeader = ({ title, subtitle, actions, className = '', children }) => {
  if (children) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={className}>
      {title && <h1>{title}</h1>}
      {subtitle && <p>{subtitle}</p>}
      {actions}
    </div>
  );
};

export default PageHeader;
