import React from 'react';
import './Dashboard.css';
import HeroSection from '../../../components/user/dashboard/HeroSection/HeroSection';
import RequestList from '../../../components/user/dashboard/RequestList/RequestList';
import adminMascot from '../../../assets/images/admin_maskot.png';

const RECENT_REQUESTS = [
  {
    id: 1,
    title: 'Laptop - ThinkPad IdeaPad',
    description: 'Keyboard rusak',
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
];

const Dashboard = ({ user }) => {
  return (
    <div className="admin-dashboard">
      <HeroSection user={user} mascot={adminMascot} />

      <RequestList
        requests={RECENT_REQUESTS}
        onViewAll={() => {}}
        onViewDetails={() => {}}
      />
    </div>
  );
};

export default Dashboard;
