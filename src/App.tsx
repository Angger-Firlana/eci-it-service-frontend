import { useEffect, useMemo, useState } from 'react';
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

function App() {
  const [activeRoute, setActiveRoute] = useState('/dashboard');
  const [detailVariant, setDetailVariant] = useState('progress');
  const [adminInboxVariant, setAdminInboxVariant] = useState('approval');
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const { user: authUser, loading: authLoading, logout } = useAuth();

  const resolvedRole = useMemo(() => {
    const roleName = authUser?.role?.name || authUser?.role || 'user';
    if (roleName === 'superior') return 'atasan';
    if (roleName === 'technician') return 'technician';
    return roleName;
  }, [authUser]);

  useEffect(() => {
    if (!authUser) {
      setActiveRoute('/dashboard');
      setSelectedRequestId(null);
      setDetailVariant('progress');
      setAdminInboxVariant('approval');
    }
  }, [authUser]);

  const user = useMemo(
    () => ({
      name: authUser?.name || 'User',
      email: authUser?.email || 'user@example.com',
      role: authUser?.role?.name
        ? authUser.role.name.charAt(0).toUpperCase() + authUser.role.name.slice(1)
        : resolvedRole.charAt(0).toUpperCase() + resolvedRole.slice(1),
      department: authUser?.department?.code || authUser?.department?.name || '-',
    }),
    [authUser, resolvedRole]
  );

  const sidebarRoute = useMemo(() => {
    if (activeRoute.startsWith('/service-list')) {
      return '/service-list';
    }
    if (activeRoute.startsWith('/inbox')) {
      return '/inbox';
    }

    return activeRoute;
  }, [activeRoute]);

  const menuItems = useMemo(() => {
    if (resolvedRole === 'atasan') {
      return ATASAN_MENU_ITEMS;
    }
    if (resolvedRole === 'admin') {
      return ADMIN_MENU_ITEMS;
    }
    return USER_MENU_ITEMS;
  }, [resolvedRole]);

  const content = useMemo(() => {
    if (resolvedRole === 'admin') {
      switch (activeRoute) {
        case '/dashboard':
          return <AdminDashboard user={user} />;
        case '/create-request':
          return <UserCreateRequest />;
        case '/service-list':
          return (
            <AdminServiceList
              onViewDetail={(row) => {
                setSelectedRequestId(row?.id || null);
                setActiveRoute('/service-list/detail');
              }}
            />
          );
        case '/service-list/detail':
          return (
            <AdminServiceDetail
              requestId={selectedRequestId}
              onBack={() => setActiveRoute('/service-list')}
            />
          );
        case '/inbox':
          return (
            <AdminInbox
              onViewDetail={(row) => {
                setAdminInboxVariant(row?.variant || 'approval');
                setSelectedRequestId(row?.id || null);
                setActiveRoute('/inbox/detail');
              }}
            />
          );
        case '/inbox/detail':
          return (
            <AdminInboxDetail
              variant={adminInboxVariant}
              requestId={selectedRequestId}
              onBack={() => setActiveRoute('/inbox')}
            />
          );
        case '/calendar':
          return <AdminCalendar />;
        case '/manage-users':
          return <AdminManageUsers />;
        case '/master-data':
          return <AdminMasterData />;
        default:
          return <AdminDashboard user={user} />;
      }
    }

    if (resolvedRole === 'atasan') {
      switch (activeRoute) {
        case '/dashboard':
          return <AtasanDashboard user={user} />;
        case '/service-list':
          return (
            <AtasanServiceList
              onViewDetail={(row) => {
                setDetailVariant(row?.detailVariant || 'progress');
                setSelectedRequestId(row?.id || null);
                setActiveRoute('/service-list/detail');
              }}
            />
          );
        case '/service-list/detail':
          return (
            <AtasanServiceDetail
              variant={detailVariant}
              requestId={selectedRequestId}
              onBack={() => setActiveRoute('/service-list')}
            />
          );
        case '/calendar':
          return <AtasanCalendar />;
        case '/inbox':
          return <AtasanInbox />;
        default:
          return <AtasanDashboard user={user} />;
      }
    }

    switch (activeRoute) {
      case '/dashboard':
        return <UserDashboard user={user} />;
      case '/create-request':
        return <UserCreateRequest />;
      case '/service-list':
        return (
          <UserServiceList
            onViewDetail={(row) => {
              setSelectedRequestId(row?.id || null);
              setActiveRoute('/service-list/detail');
            }}
          />
        );
      case '/service-list/detail':
        return (
          <UserServiceDetail
            requestId={selectedRequestId}
            onBack={() => setActiveRoute('/service-list')}
          />
        );
      case '/calendar':
        return <UserCalendar />;
      default:
        return <UserDashboard user={user} />;
    }
  }, [activeRoute, adminInboxVariant, detailVariant, role, user]);

  if (authLoading) {
    return <div className="app-loading">Loading...</div>;
  }

  if (!authUser) {
    return (
      <Login />
    );
  }

  return (
    <Layout
      activeRoute={sidebarRoute}
      onNavigate={setActiveRoute}
      user={user}
      menuItems={menuItems}
      onLogout={() => {
        logout();
      }}
      className={resolvedRole === 'atasan' ? 'theme-atasan' : ''}
    >
      {content}
    </Layout>
  );
}

export default App;
