import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import HeroSection from '../../../components/user/dashboard/HeroSection/HeroSection';
import RequestList from '../../../components/user/dashboard/RequestList/RequestList';
import adminMascot from '../../../assets/images/admin_maskot.png';
import { apiRequest, unwrapApiData, parseApiError } from '../../../lib/api';
import { fetchDeviceModels, fetchDeviceTypes } from '../../../lib/referenceApi';
import { buildRequestTitle, getPrimaryDetail } from '../../../lib/serviceRequestUtils';
import { formatDate } from '../../../lib/formatters';

const Dashboard = ({ user }) => {
  const navigate = useNavigate();
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

  return (
    <div className="admin-dashboard">
      <HeroSection user={user} mascot={adminMascot} />

      {error && <div className="dashboard-error">{error}</div>}

      <RequestList
        requests={requestItems}
        onViewAll={() => navigate('/service-requests')}
        onViewDetails={(request) => {
          if (!request?.id) return;
          navigate(`/service-requests/${request.id}?from=service-requests`);
        }}
      />
    </div>
  );
};

export default Dashboard;
