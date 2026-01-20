import React from 'react';
import './Dashboard.css';
import Layout from '../../../layouts/Layout/Layout';
import HeroSection from '../../../components/user/dashboard/HeroSection/HeroSection';
import RequestList from '../../../components/user/dashboard/RequestList/RequestList';
import { USER_MENU_ITEMS } from '../../../constants';

// Dummy data for user
const dummyUser = {
  name: 'Toni Apalah',
  email: 'Toni@gmail.com',
  role: 'User',
  department: 'ECOMERS',
};

// Dummy data for requests
const dummyRequests = [
  {
    id: 1,
    title: 'Laptop - ThinkPad IdeaPad',
    description: 'keyboard rusak',
    status: 'MENUNGGU APPROVE',
    date: '16/01/2026',
  },
  {
    id: 2,
    title: 'Printer - Canon G2010',
    description: 'Bocor tintanya',
    status: 'PROSES',
    date: '16/01/2026',
  },
  {
    id: 3,
    title: 'Monitor - LG UltraWide',
    description: 'Layar bergaris',
    status: 'MENUNGGU APPROVE',
    date: '15/01/2026',
  },
  {
    id: 4,
    title: 'Mouse - Logitech M590',
    description: 'Tidak terdeteksi',
    status: 'SELESAI',
    date: '14/01/2026',
  },
];

const Dashboard = () => {
  const handleNavigate = (route) => {
    console.log('Navigate to:', route);
    // TODO: Implement navigation logic
  };

  const handleViewAll = () => {
    console.log('View all requests');
    // TODO: Navigate to service list page
  };

  const handleViewDetails = (request) => {
    console.log('View details for:', request.title);
    // TODO: Navigate to request detail page
  };

  return (
    <Layout
      activeRoute="/dashboard"
      onNavigate={handleNavigate}
      user={dummyUser}
      menuItems={USER_MENU_ITEMS}
    >
      <div className="dashboard-container">
        {/* Hero Section */}
        <HeroSection user={dummyUser} />

        {/* Recent Requests */}
        <RequestList
          requests={dummyRequests}
          onViewAll={handleViewAll}
          onViewDetails={handleViewDetails}
        />
      </div>
    </Layout>
  );
};

export default Dashboard;
