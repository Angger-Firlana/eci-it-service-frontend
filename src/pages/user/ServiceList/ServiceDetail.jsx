import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ServiceDetail.css';
import backIcon from '../../../assets/icons/back.svg';
import { authenticatedRequest, buildApiUrl } from '../../../lib/api';
import { getStatusMapsCached } from '../../../lib/referenceCache';

const serviceDetailCache = new Map();
const SERVICE_DETAIL_CACHE_TTL_MS = 30_000;

// Statuses that allow printing invoice (APPROVED_BY_ADMIN and beyond, except REJECTED/CANCELLED)
const PRINTABLE_STATUS_CODES = [
  'APPROVED_BY_ADMIN',
  'IN_REVIEW_ABOVE',
  'APPROVED_BY_ABOVE',
  'REJECTED_BY_ABOVE', // Was approved by admin, can still change vendor
  'IN_PROGRESS',
  'COMPLETED',
];

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [detail, setDetail] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasResolved, setHasResolved] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [serviceStatusById, setServiceStatusById] = useState(new Map());

  useEffect(() => {
    let mounted = true;

    const initStatuses = async () => {
      try {
        const serviceStatuses = await getStatusMapsCached({ entityTypeId: 1 });
        if (!mounted) return;
        setServiceStatusById(serviceStatuses.byId);
      } catch (err) {
        console.error('[User/ServiceDetail] Failed to load status maps:', err);
      }
    };

    initStatuses();
    return () => {
      mounted = false;
    };
  }, []);

  const serviceStatusCode = useMemo(() => {
    const statusId = detail?.status_id;
    if (statusId == null) return detail?.status?.code || null;
    return serviceStatusById.get(Number(statusId))?.code || detail?.status?.code || null;
  }, [detail?.status_id, detail?.status?.code, serviceStatusById]);

  // Check if invoice can be printed based on status
  const canPrintInvoice = useMemo(() => {
    return serviceStatusCode && PRINTABLE_STATUS_CODES.includes(serviceStatusCode);
  }, [serviceStatusCode]);

  useEffect(() => {
    setHasResolved(false);

    const cacheKey = String(id || '');
    const cached = serviceDetailCache.get(cacheKey);
    const cachedStillValid =
      cached && Date.now() - cached.cachedAt < SERVICE_DETAIL_CACHE_TTL_MS;

    if (cachedStillValid) {
      setDetail(cached.detail);
      setTimeline(cached.timeline);
      setError(null);
      setIsLoading(false);
      setHasResolved(true);
    }

    const controller = new AbortController();

    const fetchServiceDetail = async () => {
      if (!id) {
        setError('Invalid service ID');
        setIsLoading(false);
        return;
      }

      if (!cachedStillValid) {
        setIsLoading(true);
      }
      setError(null);

      try {
        const response = await authenticatedRequest(`/service-requests/${id}`, {
          signal: controller.signal,
        });

        if (response.ok && response.data) {
          const serviceData = response.data.data || response.data;
          setDetail(serviceData);

          // Timeline might come from different field
          let nextTimeline = [];
          if (serviceData.timeline) {
            nextTimeline = serviceData.timeline;
          } else if (serviceData.service_request_approvals) {
            // Transform approvals to timeline format
            nextTimeline = serviceData.service_request_approvals.map(approval => ({
              id: approval.id,
              label: approval.status?.name || 'Status Update',
              status: approval.status?.name,
              date: approval.created_at,
              created_at: approval.created_at,
              note: approval.remarks || '-',
              description: approval.remarks || '-',
              state: 'active'
            }));
          }

          setTimeline(nextTimeline);
          serviceDetailCache.set(cacheKey, {
            detail: serviceData,
            timeline: nextTimeline,
            cachedAt: Date.now(),
          });

          setHasResolved(true);
        } else if (response.status === 404) {
          setError('Service request not found');
          setHasResolved(true);
        } else {
          throw new Error('Failed to fetch service details');
        }
      } catch (err) {
        if (err?.name === 'AbortError') return;
        console.error('Service detail fetch error:', err);
        setError(err.message || 'Failed to load service details');
        setHasResolved(true);
      } finally {
        if (!cachedStillValid) {
          setIsLoading(false);
        }
      }
    };

    fetchServiceDetail();

    return () => controller.abort();
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('id-ID', options);
  };

  const handlePrintInvoice = async () => {
    if (!id || isDownloading) return;

    setIsDownloading(true);
    console.log('[User/ServiceDetail] Downloading invoice for:', id);

    try {
      const token = localStorage.getItem('auth_token');
      const url = buildApiUrl(`/service-requests/${id}/preview-invoice`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Gagal mengunduh invoice');
      }

      // Get the blob and create download link
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `invoice-${detail?.service_number || id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      console.log('[User/ServiceDetail] Invoice downloaded successfully');
    } catch (err) {
      console.error('[User/ServiceDetail] Invoice download error:', err);
      alert(err.message || 'Gagal mengunduh invoice');
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="service-detail-page">
        <div className="detail-loading">Loading service details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="service-detail-page">
        <div className="detail-error">
          <p>{error}</p>
          <button onClick={() => navigate('/services')}>Back to Service List</button>
        </div>
      </div>
    );
  }

  if (!detail) {
    if (!hasResolved) {
      return (
        <div className="service-detail-page">
          <div className="detail-loading">Loading service details...</div>
        </div>
      );
    }

    return (
      <div className="service-detail-page">
        <div className="detail-error">
          <p>Service request not found</p>
          <button onClick={() => navigate('/services')}>Back to Service List</button>
        </div>
      </div>
    );
  }

  // Get device info from service request details
  const firstDetail = detail.service_request_details?.[0];
  const deviceInfo = firstDetail?.device || {};
  const deviceModel = deviceInfo.device_model || {};

  return (
    <div className="service-detail-page">
      <div className="detail-header">
        <button
          className="detail-back"
          type="button"
          onClick={() => navigate('/services')}
        >
          <img src={backIcon} alt="Back" />
        </button>
        <div className="detail-title">
          <h1>{detail.service_number || `SR-${detail.id}`}</h1>
          <p>Dibuat pada tanggal {formatDate(detail.request_date || detail.created_at)}</p>
        </div>
      </div>

      <div className="detail-grid">
        <section className="detail-card">
          <div className="detail-card-head">
            <h2>Detail Request</h2>
            <span className="detail-dept">
              {detail.user?.departments?.[0]?.name || 'N/A'}
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-key">Requester</span>
            <span className="detail-value">{detail.user?.name || '-'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-key">Perangkat</span>
            <span className="detail-value">
              {deviceInfo.device_type?.name || deviceModel.device_type?.name || '-'}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-key">Merk</span>
            <span className="detail-value">{deviceModel.brand || '-'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-key">Model</span>
            <span className="detail-value">{deviceModel.model || '-'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-key">Jenis Service</span>
            <span className="detail-value">
              {firstDetail?.service_type?.name || '-'}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-key">Serial Number</span>
            <span className="detail-value">{deviceInfo.serial_number || '-'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-key">Service Number</span>
            <span className="detail-value">{detail.service_number || '-'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-key">Status</span>
            <span className="detail-value">{detail.status?.name || '-'}</span>
          </div>

          <div className="detail-notes">
            <span className="detail-key">Keterangan</span>
            <div className="detail-text">{firstDetail?.complaint || '-'}</div>
          </div>
        </section>

        <aside className="timeline-card">
          <h2>Timeline</h2>

          {timeline.length > 0 ? (
            <div className="timeline-list">
              {timeline.map((item, index) => (
                <div className="timeline-item" key={item.id || index}>
                  <div className="timeline-marker">
                    <span className={`timeline-dot ${item.state || 'active'}`}></span>
                    <span
                      className={`timeline-connector ${item.state || 'active'} ${index === timeline.length - 1 ? 'tail' : ''}`}
                    ></span>
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-meta">
                      <span className={`timeline-tag ${item.state || 'active'}`}>
                        {item.label || item.status}
                      </span>
                      <span className="timeline-date">
                        {formatDate(item.date || item.created_at)}
                      </span>
                    </div>
                    <span className="timeline-desc">{item.note || item.description || '-'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="timeline-empty">No timeline available</div>
          )}

          {canPrintInvoice && (
            <button
              className="invoice-btn"
              type="button"
              onClick={handlePrintInvoice}
              disabled={isDownloading}
            >
              {isDownloading ? 'Mengunduh...' : 'Cetak Invoice'}
              <i className="bi bi-printer"></i>
            </button>
          )}
        </aside>
      </div>
    </div>
  );
};

export default ServiceDetail;
