import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import RequestList from '../../../components/user/dashboard/RequestList/RequestList';
import atasanMascot from '../../../assets/images/atasan_maskot.png';
import { authenticatedRequest, unwrapApiData } from '../../../lib/api';
import { getServiceRequestDetailCached } from '../../../lib/serviceRequestCache';

// Vendor approval status IDs (entity_type_id = 2)
const APPROVAL_STATUS = {
  PENDING: 15,
  APPROVED: 16,
  REJECTED: 17,
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const getErrorMessage = (payload, fallback) => {
  if (!payload) return fallback;
  if (typeof payload === 'string') return payload;
  if (payload?.errors && typeof payload.errors === 'object') {
    const lines = [];
    for (const [key, value] of Object.entries(payload.errors)) {
      lines.push(`${key}: ${Array.isArray(value) ? value.join(', ') : String(value)}`);
    }
    if (lines.length) return lines.join('\n');
  }
  if (typeof payload?.error === 'string') return payload.error;
  if (typeof payload?.message === 'string') return payload.message;
  return fallback;
};

const normalizeApprovalList = (payload) => {
  const data = unwrapApiData(payload);
  if (Array.isArray(data)) return data;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

// Transform approval item to RequestList item shape
const transformApprovalToRequest = (approval, serviceDetail) => {
  const service = serviceDetail || approval?.service_request || {};
  const firstDetail = service?.service_request_details?.[0];
  const deviceInfo = firstDetail?.device;
  const deviceModel = deviceInfo?.device_model;

  let title = service?.service_number || `SR-${service?.id || approval?.service_request_id}`;
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
    id: approval?.service_request_id || service?.id,
    approvalId: approval?.id,
    title,
    description: firstDetail?.complaint || 'No description',
    status: 'Menunggu Approval',
    date: formatDate(approval?.created_at || service?.request_date),
    _original: { approval, service },
  };
};

const Dashboard = ({ user }) => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const statItems = useMemo(
    () => [
      { id: 'total', label: 'Total Request', value: String(stats.total) },
      { id: 'waiting', label: 'Menunggu Approve', value: String(stats.pending) },
      { id: 'approved', label: 'Disetujui', value: String(stats.approved) },
      { id: 'rejected', label: 'Ditolak', value: String(stats.rejected) },
    ],
    [stats]
  );

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError('');

      console.log('[Atasan/Dashboard] Fetching approval stats...');

      try {
        // Fetch all three approval statuses in parallel
        const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
          authenticatedRequest(`/inbox-approvals/${APPROVAL_STATUS.PENDING}`, {
            signal: controller.signal,
          }),
          authenticatedRequest(`/inbox-approvals/${APPROVAL_STATUS.APPROVED}`, {
            signal: controller.signal,
          }),
          authenticatedRequest(`/inbox-approvals/${APPROVAL_STATUS.REJECTED}`, {
            signal: controller.signal,
          }),
        ]);

        if (cancelled) return;

        const pendingItems = pendingRes.ok ? normalizeApprovalList(pendingRes.data) : [];
        const approvedItems = approvedRes.ok ? normalizeApprovalList(approvedRes.data) : [];
        const rejectedItems = rejectedRes.ok ? normalizeApprovalList(rejectedRes.data) : [];

        console.log('[Atasan/Dashboard] Received:', {
          pending: pendingItems.length,
          approved: approvedItems.length,
          rejected: rejectedItems.length,
        });

        // Calculate stats
        const newStats = {
          pending: pendingItems.length,
          approved: approvedItems.length,
          rejected: rejectedItems.length,
          total: pendingItems.length + approvedItems.length + rejectedItems.length,
        };

        if (cancelled) return;
        setStats(newStats);

        // Get 5 most recent pending items for the request list
        const sortedPending = [...pendingItems].sort((a, b) => {
          const aTime = new Date(a?.created_at || 0).getTime();
          const bTime = new Date(b?.created_at || 0).getTime();
          return bTime - aTime;
        });

        const top5 = sortedPending.slice(0, 5);

        // Enrich with service request details
        const enrichedItems = await Promise.all(
          top5.map(async (approval) => {
            const serviceRequestId = approval?.service_request_id;
            if (!serviceRequestId) {
              return transformApprovalToRequest(approval, null);
            }

            try {
              const detail = await getServiceRequestDetailCached(serviceRequestId, {
                signal: controller.signal,
              });
              return transformApprovalToRequest(approval, detail);
            } catch (err) {
              if (err?.name === 'AbortError') throw err;
              console.error('[Atasan/Dashboard] Failed to fetch detail:', serviceRequestId, err);
              return transformApprovalToRequest(approval, approval?.service_request);
            }
          })
        );

        if (cancelled) return;
        setRecentRequests(enrichedItems);
        console.log('[Atasan/Dashboard] Dashboard loaded successfully');
      } catch (err) {
        if (err?.name === 'AbortError') return;
        if (cancelled) return;

        console.error('[Atasan/Dashboard] Fetch error:', err);
        setError(getErrorMessage(err, 'Gagal memuat dashboard'));
        setStats({ total: 0, pending: 0, approved: 0, rejected: 0 });
        setRecentRequests([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchDashboardData();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const handleViewAll = () => navigate('/inbox');
  const handleViewDetails = (request) => navigate(`/inbox/${request.id}`);

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
          <span>{user?.department || user?.departments?.[0]?.name || 'Department'}</span>
        </div>

        <div className="atasan-hero-mascot">
          <img src={atasanMascot} alt="Mascot" />
        </div>
      </section>

      {isLoading && (
        <div className="atasan-dashboard-loading">Memuat dashboard...</div>
      )}

      {!isLoading && error && (
        <div className="atasan-dashboard-error">
          <p>{error}</p>
          <button type="button" onClick={() => window.location.reload()}>
            Coba Lagi
          </button>
        </div>
      )}

      {!isLoading && !error && (
        <>
          <div className="atasan-stats">
            {statItems.map((item) => (
              <div className="atasan-stat-card" key={item.id}>
                <span className="atasan-stat-label">{item.label}</span>
                <span className="atasan-stat-value">{item.value}</span>
              </div>
            ))}
          </div>

          <RequestList
            title="Request Menunggu Approval"
            requests={recentRequests}
            onViewAll={handleViewAll}
            onViewDetails={handleViewDetails}
            viewAllLabel="Lihat Semua"
          />

          {recentRequests.length === 0 && (
            <div className="atasan-empty-state">
              Tidak ada request yang menunggu approval
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
