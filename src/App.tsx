import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import './App.css';
import Layout from './layouts/Layout/Layout';
import UserDashboard from './pages/user/Dashboard/Dashboard';
import UserCreateRequest from './pages/user/CreateRequest/CreateRequest';
import UserServiceList from './pages/user/ServiceList/ServiceList';
import UserServiceDetail from './pages/user/ServiceList/ServiceDetail';
import UserCalendar from './pages/user/Calendar/Calendar';
import AtasanDashboard from './pages/atasan/Dashboard/Dashboard';
import AtasanServiceList from './pages/atasan/ServiceList/ServiceList';
import AtasanServiceDetail from './pages/atasan/ServiceList/ServiceDetail';
import AtasanCalendar from './pages/atasan/Calendar/Calendar';
import AtasanInbox from './pages/atasan/Inbox/Inbox';
import AtasanInboxDetail from './pages/atasan/Inbox/InboxDetail';
import AdminDashboard from './pages/admin/Dashboard/Dashboard';
import AdminServiceList from './pages/admin/ServiceList/ServiceList';
import AdminServiceDetail from './pages/admin/ServiceList/ServiceDetail';
import AdminInbox from './pages/admin/Inbox/Inbox';
import AdminInboxDetail from './pages/admin/Inbox/InboxDetail';
import AdminCalendar from './pages/admin/Calendar/Calendar';
import AdminManageUsers from './pages/admin/ManageUsers/ManageUsers';
import AdminMasterData from './pages/admin/MasterData/MasterData';
import { ADMIN_MENU_ITEMS, ATASAN_MENU_ITEMS, USER_MENU_ITEMS } from './constants';
import Login from './pages/auth/Login';
import { useAuth } from './contexts/AuthContext';
import { setUnauthorizedHandler } from './lib/api';

function App() {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
      // Force reload to /login to clear any stale state
      window.location.href = '/login';
    });
  }, [logout]);

  // Clear auth if user is missing but token exists (corrupted state)
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    
    if (token && !storedUser) {
      console.warn('[App] Token exists but no user data - clearing auth');
      logout();
    }
  }, [logout]);

  const role = user?.role?.toLowerCase() || 'user';

  const activeRoute = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith('/services')) {
      return '/service-list';
    }
    if (path.startsWith('/inbox')) {
      return '/inbox';
    }
    if (path === '/create-request') {
      return '/create-request';
    }
    if (path === '/calendar') {
      return '/calendar';
    }
    if (path === '/manage-users') {
      return '/manage-users';
    }
    if (path === '/master-data') {
      return '/master-data';
    }
    return '/dashboard';
  }, [location.pathname]);

  const menuItems = useMemo(() => {
    if (role === 'atasan') {
      return ATASAN_MENU_ITEMS;
    }
    if (role === 'admin') {
      return ADMIN_MENU_ITEMS;
    }
    return USER_MENU_ITEMS;
  }, [role]);

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout
      activeRoute={activeRoute}
      user={user}
      menuItems={menuItems}
      onLogout={logout}
      className={role === 'atasan' ? 'theme-atasan' : ''}
    >
      <Routes>
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />

        {/* User Routes */}
        {role === 'user' && (
          <>
            <Route path="/dashboard" element={<UserDashboard user={user} />} />
            <Route path="/create-request" element={<UserCreateRequest />} />
            <Route path="/services" element={<UserServiceList />} />
            <Route path="/services/:id" element={<UserServiceDetail />} />
            <Route path="/calendar" element={<UserCalendar />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </>
        )}

        {/* Atasan Routes */}
        {role === 'atasan' && (
          <>
            <Route path="/dashboard" element={<AtasanDashboard user={user} />} />
            <Route path="/services" element={<AtasanServiceList />} />
            <Route path="/services/:id" element={<AtasanServiceDetail />} />
            <Route path="/calendar" element={<AtasanCalendar />} />
            <Route path="/inbox" element={<AtasanInbox />} />
            <Route path="/inbox/:id" element={<AtasanInboxDetail />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </>
        )}

        {/* Admin Routes */}
        {role === 'admin' && (
          <>
            <Route path="/dashboard" element={<AdminDashboard user={user} />} />
            <Route path="/create-request" element={<UserCreateRequest />} />
            <Route path="/services" element={<AdminServiceList />} />
            <Route path="/services/:id" element={<AdminServiceDetail />} />
            <Route path="/inbox" element={<AdminInbox />} />
            <Route path="/inbox/:id" element={<AdminInboxDetail />} />
            <Route path="/calendar" element={<AdminCalendar />} />
            <Route path="/manage-users" element={<AdminManageUsers />} />
            <Route path="/master-data" element={<AdminMasterData />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </>
        )}

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
