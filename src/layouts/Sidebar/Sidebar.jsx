import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';
import { USER_MENU_ITEMS } from '../../constants';
import logoImg from '../../assets/images/logo-removebg-preview.png';
import sidebarIcon from '../../assets/icons/sidebar.svg';

const Sidebar = ({
  activeRoute,
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

  const isDrawerOpen = isMobile && !isCollapsed;
  const showLabel = !isTablet && (!isMobile || isDrawerOpen);
  const handleNavClick = () => {
    if (isMobile && !isCollapsed) {
      onToggle?.();
    }
  };

  return (
    <>
      {isDrawerOpen && <div className="sidebar-overlay" onClick={onToggle} />}
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

          const routeMap = {
            '/service-list': '/services',
            '/create-request': '/create-request',
            '/calendar': '/calendar',
            '/dashboard': '/dashboard',
            '/inbox': '/inbox',
            '/manage-users': '/manage-users',
            '/master-data': '/master-data',
          };

          const linkTo = routeMap[item.route] || item.route;

          return (
            <Link
              key={item.id}
              to={linkTo}
              onClick={handleNavClick}
              className={`nav-item ${isActive ? 'active' : ''} ${
                isTablet || (isMobile && isCollapsed) ? 'nav-item-centered' : ''
              } ${hasBadge ? 'nav-item-badge' : ''}`}
            >
              <img
                src={isActive ? item.iconActive : item.icon}
                alt={item.label}
                className="nav-icon"
              />
              {showLabel && <span className="nav-label">{item.label}</span>}
              {hasBadge && <span className="nav-badge">{item.badge}</span>}
            </Link>
          );
        })}
      </nav>
      </aside>
    </>
  );
};

export default Sidebar;
