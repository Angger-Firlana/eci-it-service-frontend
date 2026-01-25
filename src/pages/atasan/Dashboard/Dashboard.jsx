import React, { useEffect, useMemo, useState } from 'react';
import './Dashboard.css';
import RequestList from '../../../components/user/dashboard/RequestList/RequestList';
import atasanMascot from '../../../assets/images/atasan_maskot.png';
import { apiRequest, unwrapApiData, parseApiError } from '../../../lib/api';
import { fetchDeviceModels, fetchDeviceTypes } from '../../../lib/referenceApi';
import { buildRequestTitle, getPrimaryDetail } from '../../../lib/serviceRequestUtils';
import { formatDate } from '../../../lib/formatters';

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({ total: 0, waiting: 0, approved: 0, rejected: 0 });
  const [requests, setRequests] = useState([]);
  const [deviceModels, setDeviceModels] = useState([]);
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadReferences = async () => {
      try {
        const [models, types] = await Promise.all([
          fetchDeviceModels(),
          fetchDeviceTypes(),
        ]);
        setDeviceModels(models);
        setDeviceTypes(types);
      } catch (err) {
        setError(err.message || 'Gagal memuat referensi perangkat.');
      }
    };
    loadReferences();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      setError('');
      try {
        const res = await apiRequest('/service-requests/stats');
        if (!res.ok || res.data?.success === false) {
          throw new Error(parseApiError(res.data, 'Gagal mengambil statistik.'));
        }
        const payload = unwrapApiData(res.data);
        const byStatus = Array.isArray(payload?.by_status) ? payload.by_status : [];
        const waiting = byStatus.find((item) => item.code === 'PENDING')?.count || 0;
        const approved = byStatus
          .filter((item) => String(item.code || '').startsWith('APPROVED'))
          .reduce((sum, item) => sum + Number(item.count || 0), 0);
        const rejected = byStatus.find((item) => item.code === 'REJECTED')?.count || 0;
        setStats({
          total: payload?.total || 0,
          waiting,
          approved,
          rejected,
        });
      } catch (err) {
        setError(err.message || 'Gagal mengambil statistik.');
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchRequests = async () => {
      setError('');
      try {
        const res = await apiRequest('/service-requests?per_page=5');
        if (!res.ok || res.data?.success === false) {
          throw new Error(parseApiError(res.data, 'Gagal mengambil request.'));
        }
        const payload = unwrapApiData(res.data);
        setRequests(Array.isArray(payload) ? payload : []);
      } catch (err) {
        setError(err.message || 'Gagal mengambil request.');
      }
    };
    fetchRequests();
  }, []);

  const requestItems = useMemo(() => {
    return requests.map((item) => {
      const detail = getPrimaryDetail(item);
      return {
        id: item.id,
        title: buildRequestTitle({
          detail,
          deviceModels,
          deviceTypes,
        }),
        description: detail?.complaint || '-',
        status: item.status?.name || '-',
        statusCode: item.status?.code || '',
        date: formatDate(item.request_date),
      };
    });
  }, [deviceModels, deviceTypes, requests]);

  const statItems = [
    { id: 'total', label: 'Total Request', value: String(stats.total) },
    { id: 'waiting', label: 'Menunggu Approve', value: String(stats.waiting) },
    { id: 'approved', label: 'Disetujui', value: String(stats.approved) },
    { id: 'rejected', label: 'Ditolak', value: String(stats.rejected) },
  ];

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
        {statItems.map((item) => (
          <div className="atasan-stat-card" key={item.id}>
            <span className="atasan-stat-label">{item.label}</span>
            <span className="atasan-stat-value">{item.value}</span>
          </div>
        ))}
      </div>

      {error && <div className="dashboard-error">{error}</div>}

      <RequestList
        requests={requestItems}
        onViewAll={() => {}}
        onViewDetails={() => {}}
      />
    </div>
  );
};

export default Dashboard;
