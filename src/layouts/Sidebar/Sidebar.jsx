import React, { useState, useEffect } from 'react';
import './Sidebar.css';
import { USER_MENU_ITEMS } from '../../constants';
import logoImg from '../../assets/images/logo-removebg-preview.png';
import sidebarIcon from '../../assets/icons/sidebar.svg';

const Sidebar = ({
  activeRoute,
  onNavigate,
  isCollapsed,
  onToggle,
  menuItems = USER_MENU_ITEMS,
}) => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 520;
  const isTablet = windowWidth <= 900 && windowWidth > 520;

  const showLabel = !isTablet && (!isMobile || !isCollapsed);

  return (
    <aside
      className={`sidebar ${isMobile && isCollapsed ? 'sidebar-mini' : ''} ${
        isMobile && !isCollapsed ? 'sidebar-drawer-open' : ''
      } ${isTablet ? 'sidebar-compact' : ''}`}
    >
      {/* Logo Section */}
      <div className="sidebar-top">
        {isMobile && (
          <button
            className="burger"
            onClick={onToggle}
            aria-label="Toggle sidebar"
            title="Menu"
          >
            <img src={sidebarIcon} alt="menu" className="burger-icon" />
          </button>
        )}
        {(!isMobile || !isCollapsed) && (
          <img src={logoImg} alt="Logo" className="sidebar-logo" />
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="nav">
        {menuItems.map((item) => {
          if (item.type === 'section') {
            if (!showLabel) {
              return null;
            }

            return (
              <div className="nav-section" key={item.id || item.label}>
                {item.label}
              </div>
            );
          }

          const isActive = activeRoute === item.route;
          const hasBadge = item.badge !== undefined && item.badge !== null;

          return (
            <a
              key={item.id}
              href="#"
              className={`nav-item ${isActive ? 'active' : ''} ${
                isTablet || (isMobile && isCollapsed) ? 'nav-item-centered' : ''
              } ${hasBadge ? 'nav-item-badge' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(item.route);
              }}
            >
              <img
                src={isActive ? item.iconActive : item.icon}
                alt={item.label}
                className="nav-icon"
              />
              {showLabel && <span className="nav-label">{item.label}</span>}
              {hasBadge && <span className="nav-badge">{item.badge}</span>}
            </a>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
