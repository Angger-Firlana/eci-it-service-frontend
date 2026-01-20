import { useMemo, useState } from 'react';
import './App.css';
import Layout from './layouts/Layout/Layout';
import UserDashboard from './pages/user/Dashboard/Dashboard';
import UserCreateRequest from './pages/user/CreateRequest/CreateRequest';
import UserServiceList from './pages/user/ServiceList/ServiceList';
import UserServiceDetail from './pages/user/ServiceList/ServiceDetail';
import UserCalendar from './pages/user/Calendar/Calendar';
import { USER_MENU_ITEMS } from './constants';

function App() {
  const [activeRoute, setActiveRoute] = useState('/create-request');

  const user = useMemo(
    () => ({
      name: 'Toni Apalah',
      email: 'Toni@gmail.com',
      role: 'User',
      department: 'ECOMERS',
    }),
    []
  );

  const sidebarRoute = useMemo(() => {
    if (activeRoute.startsWith('/service-list')) {
      return '/service-list';
    }

    return activeRoute;
  }, [activeRoute]);

  const content = useMemo(() => {
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
  }, [activeRoute, user]);

  return (
    <Layout
      activeRoute={sidebarRoute}
      onNavigate={setActiveRoute}
      user={user}
      menuItems={USER_MENU_ITEMS}
    >
      {content}
    </Layout>
  );
}

export default App;
