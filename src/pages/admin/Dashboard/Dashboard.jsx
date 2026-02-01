import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import HeroSection from '../../../components/user/dashboard/HeroSection/HeroSection';
import RequestList from '../../../components/user/dashboard/RequestList/RequestList';
import adminMascot from '../../../assets/images/admin_maskot.png';

import { authenticatedRequest } from '../../../lib/api';
import { getServiceRequestDetailCached } from '../../../lib/serviceRequestCache';

const PENDING_STATUS_ID = 1;

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// Transform backend data to RequestList item shape
const transformServiceRequest = (request) => {
  const firstDetail = request.service_request_details?.[0];
  const deviceInfo = firstDetail?.device;
  const deviceModel = deviceInfo?.device_model;

  let title = request.service_number || `SR-${request.id}`;
  if (deviceInfo) {
    const deviceTypeName =
      deviceInfo.device_type?.name || deviceModel?.device_type?.name || '';
    const brand = deviceModel?.brand || '';
    const model = deviceModel?.model || '';
    const modelLabel = [brand, model].filter(Boolean).join(' ');
    const nextTitle = [deviceTypeName, modelLabel].filter(Boolean).join(' ');
    if (nextTitle) {
      title = nextTitle;
    }
  }

  return {
    id: request.id,
    title,
    description: firstDetail?.complaint || 'No description',
    status: request.status?.name || 'Pending',
    date: formatDate(request.request_date || request.created_at),
    _original: request,
  };
};

const needsDetailFetch = (item) => {
  const firstDetail = item?.service_request_details?.[0];
  return !firstDetail || !firstDetail.device || !firstDetail.service_type;
};

const Dashboard = ({ user }) => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const adminId = user?.id;
  const perPage = 10;

  const listTitle = useMemo(() => 'Request Terbaru', []);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const sortTime = (item) => {
      const raw = item?.created_at || item?.request_date;
      const time = raw ? new Date(raw).getTime() : 0;
      return Number.isFinite(time) ? time : 0;
    };

    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError('');

      try {
        const [myRes, pendingRes] = await Promise.all([
          adminId
            ? authenticatedRequest(`/service-requests?admin_id=${adminId}&per_page=${perPage}`)
            : Promise.resolve({ ok: true, data: { data: [] } }),
          authenticatedRequest(`/service-requests?status_id=${PENDING_STATUS_ID}&per_page=${perPage}`),
        ]);

        if (!myRes.ok) {
          throw new Error(myRes.data?.message || 'Failed to fetch admin requests');
        }
        if (!pendingRes.ok) {
          throw new Error(pendingRes.data?.message || 'Failed to fetch pending requests');
        }

        const myData = myRes.data?.data || myRes.data;
        const pendingData = pendingRes.data?.data || pendingRes.data;

        const myItems = Array.isArray(myData) ? myData : myData?.data || [];
        const pendingItems = Array.isArray(pendingData) ? pendingData : pendingData?.data || [];

        const merged = [...myItems, ...pendingItems]
          .filter((item) => item && item.id)
          .reduce((acc, item) => {
            if (!acc.seen.has(item.id)) {
              acc.seen.add(item.id);
              acc.items.push(item);
            }
            return acc;
          }, { items: [], seen: new Set() }).items;

        const top = merged
          .sort((a, b) => sortTime(b) - sortTime(a))
          .slice(0, 5);

        const enrichedTop = await Promise.all(
          top.map(async (item) => {
            if (!needsDetailFetch(item)) return item;
            try {
              return await getServiceRequestDetailCached(item.id, {
                signal: controller.signal,
              });
            } catch (err) {
              if (err?.name === 'AbortError') return item;
              console.error('Admin dashboard detail fetch error:', err);
              return item;
            }
          })
        );

        if (cancelled) return;
        setRequests(enrichedTop.map(transformServiceRequest));
      } catch (err) {
        if (cancelled) return;
        setError(err.message || 'Failed to load dashboard');
        setRequests([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchDashboardData();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [adminId, perPage]);

  const handleViewAll = () => navigate('/services');
  const handleViewDetails = (request) => navigate(`/services/${request.id}`);

  return (
    <div className="admin-dashboard">
      <HeroSection user={user} mascot={adminMascot} />

      {error && <div className="dashboard-error">{error}</div>}

      {isLoading && <div className="admin-dashboard-loading">Loading dashboard...</div>}

      {!isLoading && error && (
        <div className="admin-dashboard-error">
          <p>Failed to load dashboard: {error}</p>
          <button type="button" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      )}

      {!isLoading && !error && (
        <>
          <RequestList
            title={listTitle}
            requests={requests}
            onViewAll={handleViewAll}
            onViewDetails={handleViewDetails}
          />
        </>
      )}
    </div>
  );
};

export default Dashboard;
