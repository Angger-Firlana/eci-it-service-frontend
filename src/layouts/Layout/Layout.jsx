import React, { useState } from 'react';
import './Layout.css';
import Sidebar from '../Sidebar';
import Topbar from '../Topbar';

const Layout = ({ children, activeRoute, onNavigate, user, menuItems }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="app">
      <Sidebar
        activeRoute={activeRoute}
        onNavigate={onNavigate}
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        menuItems={menuItems}
      />

      <main className="main">
        <Topbar user={user} />
        <div className="content">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
