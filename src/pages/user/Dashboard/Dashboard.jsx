import React, { useEffect, useMemo, useState } from 'react';
import './Dashboard.css';
import HeroSection from '../../../components/user/dashboard/HeroSection/HeroSection';
import RequestList from '../../../components/user/dashboard/RequestList/RequestList';
import { apiRequest, unwrapApiData, parseApiError } from '../../../lib/api';
import { fetchDeviceModels, fetchDeviceTypes } from '../../../lib/referenceApi';
import { formatDate } from '../../../lib/formatters';
import { buildRequestTitle, getPrimaryDetail } from '../../../lib/serviceRequestUtils';

const Dashboard = ({ user }) => {
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
      if (!user?.id) return;
      setError('');
      try {
        const res = await apiRequest(
          `/service-requests?user_id=${user.id}&per_page=5`
        );
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
  }, [user]);

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

  const handleViewAll = () => {
    console.log('View all requests');
    // TODO: Navigate to service list page
  };

  const handleViewDetails = (request) => {
    console.log('View details for:', request.title);
    // TODO: Navigate to request detail page
  };

  return (
    <div className="dashboard-container">
      {/* Hero Section */}
      <HeroSection user={user} />

      {error && <div className="dashboard-error">{error}</div>}

      {/* Recent Requests */}
      <RequestList
        requests={requestItems}
        onViewAll={handleViewAll}
        onViewDetails={handleViewDetails}
      />
    </div>
  );
};

export default Dashboard;
