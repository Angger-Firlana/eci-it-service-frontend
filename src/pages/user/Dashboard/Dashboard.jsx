import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import HeroSection from '../../../components/user/dashboard/HeroSection/HeroSection';
import RequestList from '../../../components/user/dashboard/RequestList/RequestList';
import { authenticatedRequest } from '../../../lib/api';
import { useServiceCache } from '../../../contexts/ServiceCacheContext';

// Transform backend data to frontend format
const transformServiceRequest = (request) => {
  const firstDetail = request.service_request_details?.[0];
  const deviceInfo = firstDetail?.device;

  // Get device type/model info
  let title = request.service_type?.name || 'Service Request';
  if (deviceInfo) {
    title = `Device SN: ${deviceInfo.serial_number}`;
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return {
    id: request.id,
    title: title,
    description: firstDetail?.complaint || 'No description',
    status: request.status?.name || 'Pending',
    date: formatDate(request.created_at),
    // Keep original data for detail view
    _original: request,
  };
};

const Dashboard = ({ user }) => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { updateCache } = useServiceCache();

  useEffect(() => {
    const fetchRecentRequests = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await authenticatedRequest('/service-requests?limit=5&sort=created_at&order=desc');

        console.log('Dashboard response:', response);

        if (response.ok && response.data) {
          const data = response.data.data || response.data;
          // Handle both array and paginated response
          const rawServices = Array.isArray(data) ? data : [];
          console.log('Dashboard raw services:', rawServices);

          // Transform to frontend format
          const transformedServices = rawServices.map(transformServiceRequest);
          console.log('Dashboard transformed services:', transformedServices);

          setRequests(transformedServices);
        } else {
          throw new Error('Failed to fetch requests');
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(err.message || 'Failed to load requests');
        setRequests([]); // Set empty array to prevent crashes
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentRequests();
  }, [updateCache]);

  const handleViewAll = () => {
    navigate('/services');
  };

  const handleViewDetails = (request) => {
    navigate(`/services/${request.id}`);
  };

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <HeroSection user={user} />
        <div className="dashboard-loading">Loading recent requests...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <HeroSection user={user} />
        <div className="dashboard-error">
          <p>Failed to load requests: {error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <HeroSection user={user} />

      <RequestList
        requests={requests}
        onViewAll={handleViewAll}
        onViewDetails={handleViewDetails}
      />
    </div>
  );
};

export default Dashboard;
