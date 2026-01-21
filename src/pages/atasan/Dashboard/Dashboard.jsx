import React from 'react';
import './Dashboard.css';
import RequestList from '../../../components/user/dashboard/RequestList/RequestList';
import atasanMascot from '../../../assets/images/atasan_maskot.png';

const STAT_ITEMS = [
  { id: 'total', label: 'Total Request', value: '10' },
  { id: 'waiting', label: 'Menunggu Approve', value: '10' },
  { id: 'approved', label: 'Disetujui', value: '10' },
  { id: 'rejected', label: 'Ditolak', value: '10' },
];

const RECENT_REQUESTS = [
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
];

const Dashboard = ({ user }) => {
  return (
    <div className="atasan-dashboard">
      <section className="atasan-hero">
        <div className="atasan-hero-content">
          <h1 className="atasan-hero-title">
            Welcome back, {user?.name || 'User'}
          </h1>
          <div className="atasan-hero-subtitle">Dashboard</div>
        </div>

        <div className="atasan-hero-meta">
          <span>{user?.role || 'Atasan'}</span>
          <span>{user?.department || 'IT'}</span>
        </div>

        <div className="atasan-hero-mascot">
          <img src={atasanMascot} alt="Mascot" />
        </div>
      </section>

      <div className="atasan-stats">
        {STAT_ITEMS.map((item) => (
          <div className="atasan-stat-card" key={item.id}>
            <span className="atasan-stat-label">{item.label}</span>
            <span className="atasan-stat-value">{item.value}</span>
          </div>
        ))}
      </div>

      <RequestList
        requests={RECENT_REQUESTS}
        onViewAll={() => {}}
        onViewDetails={() => {}}
      />
    </div>
  );
};

export default Dashboard;
