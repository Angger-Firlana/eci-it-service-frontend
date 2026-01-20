import { useMemo, useState } from 'react';
import './App.css';
import Layout from './layouts/Layout/Layout';
import UserDashboard from './pages/user/Dashboard/Dashboard';
import UserCreateRequest from './pages/user/CreateRequest/CreateRequest';
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

  const content = useMemo(() => {
    switch (activeRoute) {
      case '/dashboard':
        return <UserDashboard user={user} />;
      case '/create-request':
        return <UserCreateRequest />;
      case '/service-list':
        return (
          <div className="app-placeholder">
            <h2>Service List</h2>
            <p>Halaman ini masih dalam pengerjaan.</p>
          </div>
        );
      case '/calendar':
        return (
          <div className="app-placeholder">
            <h2>Kalender</h2>
            <p>Halaman ini masih dalam pengerjaan.</p>
          </div>
        );
      default:
        return <UserDashboard user={user} />;
    }
  }, [activeRoute, user]);

  return (
    <Layout
      activeRoute={activeRoute}
      onNavigate={setActiveRoute}
      user={user}
      menuItems={USER_MENU_ITEMS}
    >
      {content}
    </Layout>
  );
}

export default App;
