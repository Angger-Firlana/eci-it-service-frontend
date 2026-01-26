import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import './ServiceDetail.css';
import backIcon from '../../../assets/icons/back.svg';
import {
  apiRequest,
  unwrapApiData,
  parseApiError,
  buildApiUrl,
  clearRequestCache,
} from '../../../lib/api';
import {
  fetchDeviceModels,
  fetchDeviceTypes,
  fetchStatuses,
} from '../../../lib/referenceApi';
import { formatCurrency, formatDateTime } from '../../../lib/formatters';
import { getDeviceSummary, getPrimaryDetail } from '../../../lib/serviceRequestUtils';
import { useAuth } from '../../../contexts/AuthContext';
import { getVendorApprovalEntityTypeId } from '../../../lib/statusHelpers';

const ServiceDetail = ({ onBack, variant, requestId }) => {
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const resolvedRequestId = requestId || params.id;
  const resolvedVariant = variant || searchParams.get('variant') || 'progress';
  const [detail, setDetail] = useState(null);
  const [locations, setLocations] = useState([]);
  const [costs, setCosts] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [deviceModels, setDeviceModels] = useState([]);
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    const loadReferences = async () => {
      try {
        const [models, types, statusList] = await Promise.all([
          fetchDeviceModels(),
          fetchDeviceTypes(),
          fetchStatuses(),
        ]);
        setDeviceModels(models);
        setDeviceTypes(types);
        setStatuses(statusList);
      } catch (err) {
        setError(err.message || 'Gagal memuat data referensi.');
      }
    };
    loadReferences();
  }, []);

  useEffect(() => {
    if (!resolvedRequestId) return;
    const loadDetail = async () => {
      setLoading(true);
      setError('');
      try {
        const [detailRes, locationRes, costRes, approvalRes] = await Promise.all([
          apiRequest(`/service-requests/${resolvedRequestId}`),
          apiRequest(`/service-requests/${resolvedRequestId}/locations`),
          apiRequest(`/service-requests/${resolvedRequestId}/costs`),
          apiRequest(`/service-requests/${resolvedRequestId}/approvals`),
        ]);

        if (!detailRes.ok || detailRes.data?.success === false) {
          throw new Error(parseApiError(detailRes.data, 'Gagal mengambil detail.'));
        }

        const detailPayload = unwrapApiData(detailRes.data);
        setDetail(detailPayload || null);

        if (locationRes.ok && locationRes.data?.success !== false) {
          const locationPayload = unwrapApiData(locationRes.data);
          setLocations(Array.isArray(locationPayload) ? locationPayload : []);
        }

        if (costRes.ok && costRes.data?.success !== false) {
          const costPayload = unwrapApiData(costRes.data);
          setCosts(Array.isArray(costPayload) ? costPayload : []);
        }

        if (approvalRes.ok && approvalRes.data?.success !== false) {
          const approvalPayload = unwrapApiData(approvalRes.data);
          setApprovals(Array.isArray(approvalPayload) ? approvalPayload : []);
        }
      } catch (err) {
        setError(err.message || 'Gagal mengambil detail.');
      } finally {
        setLoading(false);
      }
    };
    loadDetail();
  }, [resolvedRequestId]);

  const statusMap = useMemo(() => {
    return statuses.reduce((acc, status) => {
      acc[status.id] = status;
      return acc;
    }, {});
  }, [statuses]);

  const primaryDetail = getPrimaryDetail(detail);
  const deviceSummary = getDeviceSummary({
    detail: primaryDetail,
    deviceModels,
    deviceTypes,
  });

  const activeLocation = useMemo(() => {
    if (!locations.length) return null;
    return locations.find((loc) => loc.is_active) || locations[0];
  }, [locations]);

  const locationLabel = useMemo(() => {
    if (!activeLocation) return '-';
    if (activeLocation.location_type === 'internal') return 'Workshop';
    if (activeLocation.location_type === 'external') return 'Vendor';
    return activeLocation.location_type || '-';
  }, [activeLocation]);

  const servicePlace = useMemo(() => {
    if (!activeLocation) return '-';
    if (activeLocation.location_type === 'internal') return 'Workshop IT';
    return activeLocation.vendor?.name || '-';
  }, [activeLocation]);

  const serviceLocation = useMemo(() => {
    if (!activeLocation) return '-';
    return activeLocation.vendor?.maps_url || activeLocation.vendor?.description || '-';
  }, [activeLocation]);

  const totalCost = useMemo(() => {
    return costs.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [costs]);

  const vendorApprovalEntityTypeId = getVendorApprovalEntityTypeId(statuses);
  const pendingApproval = useMemo(() => {
    if (!user?.id) return null;
    return approvals.find((approval) => {
      const status = statusMap[approval.status_id];
      return (
        approval.approver_id === user.id &&
        status?.entity_type_id === vendorApprovalEntityTypeId &&
        String(status?.code || '').toUpperCase() === 'PENDING'
      );
    });
  }, [approvals, statusMap, user, vendorApprovalEntityTypeId]);

  const handleApproval = async (action) => {
    if (!pendingApproval?.id) return;
    setActionError('');
    try {
      const res = await apiRequest(
        `/service-requests/${action}/${pendingApproval.id}`,
        {
          method: 'POST',
          body: note ? { notes: note } : {},
        }
      );

      if (!res.ok || res.data?.success === false) {
        throw new Error(parseApiError(res.data, 'Gagal memproses approval.'));
      }

      clearRequestCache('service-requests');
      const approvalRes = await apiRequest(`/service-requests/${resolvedRequestId}/approvals`);
      if (approvalRes.ok && approvalRes.data?.success !== false) {
        const payload = unwrapApiData(approvalRes.data);
        setApprovals(Array.isArray(payload) ? payload : []);
      }
    } catch (err) {
      setActionError(err.message || 'Gagal memproses approval.');
    }
  };

  const timelineItems = useMemo(() => {
    const logs = detail?.audit_logs || [];
    if (!Array.isArray(logs) || logs.length === 0) {
      return [];
    }

    return logs.map((log) => {
      const newStatus = statusMap[log.new_status_id];
      return {
        id: log.id,
        label: newStatus?.name || 'Status Update',
        date: formatDateTime(log.created_at),
        note: log.notes || newStatus?.name || '-',
        state: 'active',
      };
    });
  }, [detail, statusMap]);

  const showActions = resolvedVariant === 'approval' && pendingApproval;

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    const from = searchParams.get('from');
    if (from === 'inbox') {
      navigate('/inbox');
      return;
    }
    navigate('/service-requests');
  };

  return (
    <div className="atasan-detail-page">
      <div className="atasan-detail-header">
        <button
          className="atasan-detail-back"
          type="button"
          onClick={handleBack}
        >
          <img src={backIcon} alt="Back" />
        </button>
        <div className="atasan-detail-title">
          <h1>{detail?.service_number || '-'}</h1>
          <p>
            {detail?.request_date
              ? `Dibuat pada ${formatDateTime(detail.request_date)}`
              : 'Dibuat pada -'}
          </p>
        </div>
      </div>

      {loading && <div className="atasan-detail-loading">Memuat data...</div>}
      {error && <div className="atasan-detail-error">{error}</div>}

      {!loading && !error && (
        <div className="atasan-detail-grid">
          <div className="atasan-detail-left">
            <section className="atasan-detail-card">
              <div className="atasan-detail-card-head">
                <h2>Detail Request</h2>
                <span className="atasan-detail-dept">-</span>
              </div>

              <div className="atasan-detail-row">
                <span className="atasan-detail-key">Requester</span>
                <span className="atasan-detail-value">
                  {detail?.user?.name || '-'}
                </span>
              </div>
              <div className="atasan-detail-row">
                <span className="atasan-detail-key">Perangkat</span>
                <span className="atasan-detail-value">
                  {deviceSummary.deviceTypeName}
                </span>
              </div>
              <div className="atasan-detail-row">
                <span className="atasan-detail-key">Merk</span>
                <span className="atasan-detail-value">{deviceSummary.brand}</span>
              </div>
              <div className="atasan-detail-row">
                <span className="atasan-detail-key">Model</span>
                <span className="atasan-detail-value">{deviceSummary.model}</span>
              </div>
              <div className="atasan-detail-row">
                <span className="atasan-detail-key">Jenis Service</span>
                <span className="atasan-detail-value">
                  {detail?.service_type?.name || '-'}
                </span>
              </div>
              <div className="atasan-detail-row">
                <span className="atasan-detail-key">Serial Number</span>
                <span className="atasan-detail-value">
                  {deviceSummary.serialNumber}
                </span>
              </div>

              <div className="atasan-detail-notes">
                <span className="atasan-detail-key">Keterangan</span>
                <div className="atasan-detail-text">
                  {primaryDetail?.complaint || '-'}
                </div>
              </div>

              <div className="atasan-detail-row">
                <span className="atasan-detail-key">Tempat service</span>
                <span className="atasan-detail-value">{servicePlace}</span>
              </div>

              <div className="atasan-detail-location">
                <span className="atasan-detail-key">Lokasi Service</span>
                <div className="atasan-detail-address">
                  {serviceLocation}
                </div>
                <div className="atasan-detail-location-note">
                  {locationLabel}
                </div>
              </div>
            </section>

            <section className="atasan-estimate-card">
              <h2>Estimasi Biaya</h2>
              <div className="atasan-estimate-row">
                <span>Biaya</span>
                <span>{formatCurrency(totalCost)}</span>
              </div>
              <div className="atasan-estimate-row">
                <span>Biaya Cancel</span>
                <span>-</span>
              </div>
              <div className="atasan-estimate-notes">
                <span className="atasan-detail-key">Keterangan Service</span>
                <div className="atasan-detail-text">
                  {costs[0]?.description || '-'}
                </div>
              </div>
            </section>
          </div>

          <div className="atasan-detail-right">
            {showActions && (
              <section className="atasan-action-card">
                <h2>Aksi</h2>
                <label className="atasan-action-label" htmlFor="atasan-action-note">
                  Keterangan
                </label>
                <textarea
                  id="atasan-action-note"
                  className="atasan-action-textarea"
                  rows={4}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
                {actionError && (
                  <div className="atasan-action-error">{actionError}</div>
                )}
                <div className="atasan-action-buttons">
                  <button
                    className="atasan-action-reject"
                    type="button"
                    onClick={() => handleApproval('rejected')}
                  >
                    Reject
                  </button>
                  <button
                    className="atasan-action-approve"
                    type="button"
                    onClick={() => handleApproval('approved')}
                  >
                    Approve
                  </button>
                </div>
              </section>
            )}

            <section className="atasan-timeline-card">
              <h2>Timeline</h2>

              <div className="atasan-timeline-list">
                {timelineItems.length === 0 && (
                  <div className="atasan-timeline-empty">
                    Belum ada timeline.
                  </div>
                )}
                {timelineItems.map((item, index) => (
                  <div className="atasan-timeline-item" key={item.id}>
                    <div className="atasan-timeline-marker">
                      <span className={`atasan-timeline-dot ${item.state}`}></span>
                      {index < timelineItems.length - 1 && (
                        <span
                          className={`atasan-timeline-line ${item.state}`}
                        ></span>
                      )}
                    </div>
                    <div className="atasan-timeline-content">
                      <span
                        className={`atasan-timeline-tag ${
                          item.state === 'active' ? 'active' : ''
                        }`}
                      >
                        {item.label}
                      </span>
                      <span className="atasan-timeline-date">{item.date}</span>
                      <span className="atasan-timeline-desc">{item.note}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="atasan-invoice-btn"
                type="button"
                onClick={() => {
                  if (!detail?.id) return;
                  window.open(
                    buildApiUrl(`/service-requests/${detail.id}/download-invoice`),
                    '_blank'
                  );
                }}
              >
                Cetak Invoice
                <i className="bi bi-printer"></i>
              </button>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceDetail;
