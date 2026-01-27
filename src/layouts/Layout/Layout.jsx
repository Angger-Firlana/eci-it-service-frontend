import React, { useState } from 'react';
import './Layout.css';
import Sidebar from '../Sidebar';
import Topbar from '../Topbar';

const Layout = ({
  children,
  activeRoute,
  user,
  menuItems,
  onLogout,
  className = '',
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const appClassName = ['app', className].filter(Boolean).join(' ');

  return (
    <div className={appClassName}>
      <Sidebar
        activeRoute={activeRoute}
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        menuItems={menuItems}
      />

      <main className="main">
        <Topbar user={user} onLogout={onLogout} />
        <div className="content">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
