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
  const deviceModel = deviceInfo?.device_model;

  let title = 'Service Request';
  if (deviceInfo) {
    const deviceTypeName =
      deviceInfo.device_type?.name || deviceModel?.device_type?.name || '';
    const brand = deviceModel?.brand || '';
    const model = deviceModel?.model || '';
    const modelLabel = [brand, model].filter(Boolean).join(' ');
    title = [deviceTypeName, modelLabel].filter(Boolean).join(' ');
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
    date: formatDate(request.request_date || request.created_at),
    // Keep original data for detail view
    _original: request,
  };
};

const Dashboard = ({ user }) => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { serviceListCache, updateCache, isCacheValid } = useServiceCache();

  useEffect(() => {
    const needsDetailFetch = (item) => {
      const firstDetail = item.service_request_details?.[0];
      return !firstDetail || !firstDetail.service_type;
    };

    const enrichServices = async (items) => {
      const enriched = await Promise.all(
        items.map(async (item) => {
          if (!needsDetailFetch(item)) {
            return item;
          }

          try {
            const detailResponse = await authenticatedRequest(
              `/service-requests/${item.id}`
            );
            if (detailResponse.ok && detailResponse.data) {
              return detailResponse.data.data || detailResponse.data;
            }
          } catch (err) {
            console.error('Dashboard detail fetch error:', err);
          }

          return item;
        })
      );

      return enriched;
    };

    const fetchRecentRequests = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (isCacheValid() && Array.isArray(serviceListCache) && serviceListCache.length > 0) {
          const enrichedCache = await enrichServices(serviceListCache);
          setRequests(enrichedCache.slice(0, 5).map(transformServiceRequest));
          if (enrichedCache.some(needsDetailFetch)) {
            updateCache(enrichedCache);
          }
          setIsLoading(false);
          return;
        }

        const response = await authenticatedRequest(
          '/service-requests?per_page=10&sort=created_at&order=desc'
        );

        if (response.ok && response.data) {
          const data = response.data.data || response.data;
          const rawServices = Array.isArray(data) ? data : data.data || [];
          const enrichedServices = await enrichServices(rawServices);

          updateCache(enrichedServices);
          setRequests(enrichedServices.slice(0, 5).map(transformServiceRequest));
        } else {
          throw new Error('Failed to fetch requests');
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(err.message || 'Failed to load requests');
        setRequests([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentRequests();
  }, [isCacheValid, serviceListCache, updateCache]);

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
