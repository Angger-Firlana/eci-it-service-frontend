import { useMemo } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
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
import AdminInbox from './pages/admin/Inbox/Inbox';
import AdminInboxDetail from './pages/admin/Inbox/InboxDetail';
import AdminCalendar from './pages/admin/Calendar/Calendar';
import AdminManageUsers from './pages/admin/ManageUsers/ManageUsers';
import AdminMasterData from './pages/admin/MasterData/MasterData';
import { ADMIN_MENU_ITEMS, ATASAN_MENU_ITEMS, USER_MENU_ITEMS } from './constants';
import Login from './pages/auth/Login';
import { useAuth } from './contexts/AuthContext';

const AppLoading = () => <div className="app-loading">Loading...</div>;

const useResolvedRole = () => {
  const { user } = useAuth();
  return useMemo(() => {
    const roleName = user?.role?.name || user?.role || 'user';
    if (roleName === 'superior') return 'atasan';
    if (roleName === 'technician') return 'technician';
    return roleName;
  }, [user]);
};

const useDisplayUser = () => {
  const { user } = useAuth();
  const resolvedRole = useResolvedRole();
  return useMemo(() => {
    const roleLabel = user?.role?.name || resolvedRole || 'user';
    const departmentCode =
      user?.department?.code || user?.department?.name || '-';
    return {
      name: user?.name || 'User',
      email: user?.email || 'user@example.com',
      role:
        roleLabel.charAt(0).toUpperCase() + roleLabel.slice(1),
      department: String(departmentCode || '-').toLowerCase(),
      id: user?.id,
    };
  }, [resolvedRole, user]);
};

const RequireAuth = () => {
  const { user, loading } = useAuth();
  if (loading) return <AppLoading />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
};

const PublicOnly = () => {
  const { user, loading } = useAuth();
  if (loading) return <AppLoading />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
};

const AppLayout = () => {
  const { logout } = useAuth();
  const resolvedRole = useResolvedRole();
  const displayUser = useDisplayUser();
  const location = useLocation();
  const navigate = useNavigate();

  const sidebarRoute = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith('/service-requests/new')) return '/service-requests/new';
    if (path.startsWith('/service-requests')) return '/service-requests';
    if (path.startsWith('/inbox')) return '/inbox';
    if (path.startsWith('/master-data')) return '/master-data';
    if (path.startsWith('/users')) return '/users';
    return path;
  }, [location.pathname]);

  const menuItems = useMemo(() => {
    if (resolvedRole === 'atasan') {
      return ATASAN_MENU_ITEMS;
    }
    if (resolvedRole === 'admin') {
      return ADMIN_MENU_ITEMS;
    }
    return USER_MENU_ITEMS;
  }, [resolvedRole]);

  return (
    <Layout
      activeRoute={sidebarRoute}
      onNavigate={(route) => navigate(route)}
      user={displayUser}
      menuItems={menuItems}
      onLogout={() => logout()}
      className={resolvedRole === 'atasan' ? 'theme-atasan' : ''}
    >
      <Outlet />
    </Layout>
  );
};

const DashboardRoute = () => {
  const role = useResolvedRole();
  const displayUser = useDisplayUser();
  if (role === 'admin') return <AdminDashboard user={displayUser} />;
  if (role === 'atasan') return <AtasanDashboard user={displayUser} />;
  return <UserDashboard user={displayUser} />;
};

const ServiceListRoute = () => {
  const role = useResolvedRole();
  if (role === 'admin') return <AdminServiceList />;
  if (role === 'atasan') return <AtasanServiceList />;
  return <UserServiceList />;
};

const ServiceDetailRoute = () => {
  const role = useResolvedRole();
  if (role === 'admin') return <AdminInboxDetail />;
  if (role === 'atasan') return <AtasanServiceDetail />;
  return <UserServiceDetail />;
};

const CalendarRoute = () => {
  const role = useResolvedRole();
  if (role === 'admin') return <AdminCalendar />;
  if (role === 'atasan') return <AtasanCalendar />;
  return <UserCalendar />;
};

const InboxRoute = () => {
  const role = useResolvedRole();
  if (role === 'admin') return <AdminInbox />;
  if (role === 'atasan') return <AtasanInbox />;
  return <Navigate to="/dashboard" replace />;
};

const ManageUsersRoute = () => {
  const role = useResolvedRole();
  if (role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <AdminManageUsers />;
};

const MasterDataRoute = () => {
  const role = useResolvedRole();
  if (role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <AdminMasterData />;
};

function App() {
  return (
    <Routes>
      <Route element={<PublicOnly />}>
        <Route path="/login" element={<Login />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardRoute />} />
          <Route path="/service-list" element={<Navigate to="/service-requests" replace />} />
          <Route path="/create-request" element={<Navigate to="/service-requests/new" replace />} />
          <Route path="/service-requests" element={<ServiceListRoute />} />
          <Route path="/service-requests/new" element={<UserCreateRequest />} />
          <Route path="/service-requests/:id" element={<ServiceDetailRoute />} />
          <Route path="/inbox" element={<InboxRoute />} />
          <Route path="/calendar" element={<CalendarRoute />} />
          <Route path="/manage-users" element={<Navigate to="/users" replace />} />
          <Route path="/users" element={<ManageUsersRoute />} />
          <Route path="/master-data" element={<MasterDataRoute />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
