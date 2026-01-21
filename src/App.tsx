import { useMemo, useState } from 'react';
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

function App() {
  const [activeRoute, setActiveRoute] = useState('/create-request');
  const [role, setRole] = useState(null);
  const [detailVariant, setDetailVariant] = useState('progress');
  const [adminInboxVariant, setAdminInboxVariant] = useState('approval');

  const user = useMemo(
    () => ({
      name: 'Toni Apalah',
      email: 'Toni@gmail.com',
      role: role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User',
      department: role === 'atasan' || role === 'admin' ? 'IT' : 'ECOMERS',
    }),
    [role]
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
    if (role === 'atasan') {
      return ATASAN_MENU_ITEMS;
    }
    if (role === 'admin') {
      return ADMIN_MENU_ITEMS;
    }
    return USER_MENU_ITEMS;
  }, [role]);

  const content = useMemo(() => {
    if (role === 'admin') {
      switch (activeRoute) {
        case '/dashboard':
          return <AdminDashboard user={user} />;
        case '/create-request':
          return <UserCreateRequest />;
        case '/service-list':
          return (
            <AdminServiceList
              onViewDetail={() => setActiveRoute('/service-list/detail')}
            />
          );
        case '/service-list/detail':
          return (
            <AdminServiceDetail onBack={() => setActiveRoute('/service-list')} />
          );
        case '/inbox':
          return (
            <AdminInbox
              onViewDetail={(row) => {
                setAdminInboxVariant(row?.variant || 'approval');
                setActiveRoute('/inbox/detail');
              }}
            />
          );
        case '/inbox/detail':
          return (
            <AdminInboxDetail
              variant={adminInboxVariant}
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

    if (role === 'atasan') {
      switch (activeRoute) {
        case '/dashboard':
          return <AtasanDashboard user={user} />;
        case '/service-list':
          return (
            <AtasanServiceList
              onViewDetail={(row) => {
                setDetailVariant(row?.detailVariant || 'progress');
                setActiveRoute('/service-list/detail');
              }}
            />
          );
        case '/service-list/detail':
          return (
            <AtasanServiceDetail
              variant={detailVariant}
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
            onViewDetail={() => setActiveRoute('/service-list/detail')}
          />
        );
      case '/service-list/detail':
        return (
          <UserServiceDetail onBack={() => setActiveRoute('/service-list')} />
        );
      case '/calendar':
        return <UserCalendar />;
      default:
        return <UserDashboard user={user} />;
    }
  }, [activeRoute, adminInboxVariant, detailVariant, role, user]);

  if (!role) {
    return (
      <Login
        onLogin={(selectedRole) => {
          setRole(selectedRole);
          setActiveRoute('/dashboard');
        }}
      />
    );
  }

  return (
    <Layout
      activeRoute={sidebarRoute}
      onNavigate={setActiveRoute}
      user={user}
      menuItems={menuItems}
      onLogout={() => {
        setRole(null);
        setActiveRoute('/create-request');
        setDetailVariant('progress');
        setAdminInboxVariant('approval');
      }}
      className={role === 'atasan' ? 'theme-atasan' : ''}
    >
      {content}
    </Layout>
  );
}

export default App;
