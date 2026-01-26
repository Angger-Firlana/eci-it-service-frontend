import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import './InboxDetail.css';
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
import { getVendorApprovalEntityTypeId } from '../../../lib/statusHelpers';

const AdminInboxDetail = ({ onBack, requestId }) => {
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resolvedRequestId = requestId || params.id;
  const [detail, setDetail] = useState(null);
  const [locations, setLocations] = useState([]);
  const [costs, setCosts] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [allowedTransitions, setAllowedTransitions] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [deviceModels, setDeviceModels] = useState([]);
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

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
        const [detailRes, locationRes, costRes, approvalRes, transitionRes] =
          await Promise.all([
            apiRequest(`/service-requests/${resolvedRequestId}`),
            apiRequest(`/service-requests/${resolvedRequestId}/locations`),
            apiRequest(`/service-requests/${resolvedRequestId}/costs`),
            apiRequest(`/service-requests/${resolvedRequestId}/approvals`),
            apiRequest(`/service-requests/${resolvedRequestId}/allowed-transitions`),
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

        if (transitionRes.ok && transitionRes.data?.success !== false) {
          const transitionPayload = unwrapApiData(transitionRes.data);
          setAllowedTransitions(
            Array.isArray(transitionPayload) ? transitionPayload : []
          );
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
  const approvalItems = useMemo(() => {
    return approvals.map((approval) => {
      const status = statusMap[approval.status_id];
      const statusCode = String(status?.code || '').toUpperCase();
      const displayStatus =
        statusCode === 'APPROVED'
          ? 'Approved'
          : statusCode === 'REJECTED'
          ? 'Unapprove'
          : 'Waiting';
      return {
        id: approval.id,
        name: approval.approver?.name || '-',
        role: approval.approver?.department?.code || approval.approver?.department?.name || '-',
        note: approval.notes || '',
        status: displayStatus,
        statusCode,
        entityTypeMatch: status?.entity_type_id === vendorApprovalEntityTypeId,
      };
    });
  }, [approvals, statusMap, vendorApprovalEntityTypeId]);

  const approvalStats = useMemo(() => {
    const filtered = approvalItems.filter((item) => item.entityTypeMatch);
    if (filtered.length === 0) return null;
    const approvedCount = filtered.filter((item) => item.statusCode === 'APPROVED').length;
    const progress = Math.round((approvedCount / filtered.length) * 100);
    return {
      progress,
      summary: `${approvedCount}/${filtered.length} Approved`,
      items: filtered,
    };
  }, [approvalItems]);

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

  const handleStatusUpdate = async (statusId) => {
    if (!detail?.id) return;
    setActionError('');
    try {
      const res = await apiRequest(`/service-requests/${detail.id}`, {
        method: 'PUT',
        body: { status_id: statusId },
      });

      if (!res.ok || res.data?.success === false) {
        throw new Error(parseApiError(res.data, 'Gagal memperbarui status.'));
      }

      const updated = unwrapApiData(res.data);
      setDetail(updated || detail);
      clearRequestCache('service-requests');

      const transitionRes = await apiRequest(
        `/service-requests/${detail.id}/allowed-transitions`
      );
      if (transitionRes.ok && transitionRes.data?.success !== false) {
        const transitionPayload = unwrapApiData(transitionRes.data);
        setAllowedTransitions(
          Array.isArray(transitionPayload) ? transitionPayload : []
        );
      }
    } catch (err) {
      setActionError(err.message || 'Gagal memperbarui status.');
    }
  };

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
    <div className="admin-inbox-detail">
      <div className="admin-detail-header">
        <button
          className="admin-detail-back"
          type="button"
          onClick={handleBack}
        >
          <img src={backIcon} alt="Back" />
        </button>
        <div className="admin-detail-title">
          <h1>{detail?.service_number || '-'}</h1>
          <p>
            {detail?.request_date
              ? `Dibuat pada ${formatDateTime(detail.request_date)}`
              : 'Dibuat pada -'}
          </p>
        </div>
        <button className="admin-cancel-btn" type="button" disabled>
          Batalkan Service
        </button>
      </div>

      {loading && <div className="admin-detail-loading">Memuat data...</div>}
      {error && <div className="admin-detail-error">{error}</div>}

      {!loading && !error && (
        <div className="admin-inbox-grid">
          <div className="admin-inbox-left">
            <section className="admin-detail-card">
              <div className="admin-detail-card-head">
                <h2>Detail Request</h2>
                <span className="admin-detail-dept">-</span>
              </div>

              <div className="admin-detail-row">
                <span className="admin-detail-key">Requester</span>
                <span className="admin-detail-value">{detail?.user?.name || '-'}</span>
              </div>
              <div className="admin-detail-row">
                <span className="admin-detail-key">Perangkat</span>
                <span className="admin-detail-value">{deviceSummary.deviceTypeName}</span>
              </div>
              <div className="admin-detail-row">
                <span className="admin-detail-key">Merk</span>
                <span className="admin-detail-value">{deviceSummary.brand}</span>
              </div>
              <div className="admin-detail-row">
                <span className="admin-detail-key">Model</span>
                <span className="admin-detail-value">{deviceSummary.model}</span>
              </div>
              <div className="admin-detail-row">
                <span className="admin-detail-key">Jenis Service</span>
                <span className="admin-detail-value">
                  {detail?.service_type?.name || '-'}
                </span>
              </div>
              <div className="admin-detail-row">
                <span className="admin-detail-key">Serial Number</span>
                <span className="admin-detail-value">{deviceSummary.serialNumber}</span>
              </div>

              <div className="admin-detail-notes">
                <span className="admin-detail-key">Keterangan</span>
                <div className="admin-detail-text">
                  {primaryDetail?.complaint || '-'}
                </div>
              </div>

              <div className="admin-detail-row">
                <span className="admin-detail-key">Tempat service</span>
                <span className="admin-detail-value">{servicePlace}</span>
              </div>

              <div className="admin-detail-location">
                <div className="admin-detail-location-head">
                  <span className="admin-detail-key">Lokasi Service</span>
                </div>
                <div className="admin-detail-address">{serviceLocation}</div>
              </div>

              <div className="admin-detail-row">
                <span className="admin-detail-key">Estimasi Selesai</span>
                <span className="admin-detail-value">
                  {detail?.estimated_date ? formatDateTime(detail.estimated_date) : '-'}
                </span>
              </div>
            </section>

            <section className="admin-estimate-card">
              <h2>Estimasi Biaya</h2>
              <div className="admin-estimate-row">
                <span>Biaya</span>
                <span>{formatCurrency(totalCost)}</span>
              </div>
              <div className="admin-estimate-row">
                <span>Biaya Cancel</span>
                <span>-</span>
              </div>
              <div className="admin-estimate-notes">
                <span className="admin-detail-key">Keterangan Service</span>
                <div className="admin-detail-text">
                  {costs[0]?.description || '-'}
                </div>
              </div>
            </section>
          </div>

          <div className="admin-inbox-right">
            {allowedTransitions.length > 0 && (
              <section className="admin-action-card">
                <h2>Status Actions</h2>
                {actionError && (
                  <div className="admin-action-error">{actionError}</div>
                )}
                <div className="admin-action-buttons">
                  {allowedTransitions.map((status) => (
                    <button
                      key={status.id}
                      className="admin-action-approve"
                      type="button"
                      onClick={() => handleStatusUpdate(status.id)}
                    >
                      {status.name}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {approvalStats && (
              <section className="admin-approval-card">
                <div className="admin-approval-head">
                  <div>
                    <h2>Status Approval</h2>
                    <p>Menunggu approval dari atasan</p>
                  </div>
                </div>

                <div className="admin-approval-progress">
                  <div className="admin-approval-bar">
                    <span
                      className="admin-approval-bar-fill"
                      style={{ width: `${approvalStats.progress}%` }}
                    ></span>
                  </div>
                  <span className="admin-approval-count">{approvalStats.summary}</span>
                </div>

                <div className="admin-approval-list">
                  {approvalStats.items.map((item) => (
                    <div
                      className={`admin-approval-item admin-approval-${
                        item.statusCode === 'APPROVED'
                          ? 'approved'
                          : item.statusCode === 'REJECTED'
                          ? 'rejected'
                          : 'waiting'
                      }`}
                      key={item.id}
                    >
                      <div>
                        <div className="admin-approval-name">{item.name}</div>
                        {item.role && (
                          <div className="admin-approval-role">{item.role}</div>
                        )}
                        {item.note && (
                          <div className="admin-approval-note">{item.note}</div>
                        )}
                      </div>
                      <span className="admin-approval-status">{item.status}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="admin-timeline-card">
              <h2>Timeline</h2>
              <div className="admin-timeline-list">
                {timelineItems.length === 0 && (
                  <div className="admin-timeline-empty">Belum ada timeline.</div>
                )}
                {timelineItems.map((item, index) => (
                  <div className="admin-timeline-item" key={item.id}>
                    <div className="admin-timeline-marker">
                      <span className={`admin-timeline-dot ${item.state}`}></span>
                      {index < timelineItems.length - 1 && (
                        <span
                          className={`admin-timeline-line ${item.state}`}
                        ></span>
                      )}
                    </div>
                    <div className="admin-timeline-content">
                      <span
                        className={`admin-timeline-tag ${item.state || 'active'}`}
                      >
                        {item.label}
                      </span>
                      <span className="admin-timeline-date">{item.date}</span>
                      <span className="admin-timeline-desc">{item.note}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="admin-invoice-btn"
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

export default AdminInboxDetail;
