import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './ServiceDetail.css';
import backIcon from '../../../assets/icons/back.svg';
import { authenticatedRequest, unwrapApiData, buildApiUrl } from '../../../lib/api';
import { getStatusMapsCached } from '../../../lib/referenceCache';
import {
  getServiceRequestDetailCached,
  getServiceRequestLocationsCached,
} from '../../../lib/serviceRequestCache';

// Statuses that allow printing invoice (APPROVED_BY_ADMIN and beyond, except REJECTED/CANCELLED)
const PRINTABLE_STATUS_CODES = [
  'APPROVED_BY_ADMIN',
  'IN_REVIEW_ABOVE',
  'APPROVED_BY_ABOVE',
  'REJECTED_BY_ABOVE',
  'IN_PROGRESS',
  'COMPLETED',
];

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatRupiah = (amount) => {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return '-';
  return `Rp ${Math.round(value).toLocaleString('id-ID')}`;
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

const normalizeArrayPayload = (payload) => {
  const data = unwrapApiData(payload);
  if (Array.isArray(data)) return data;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const getActiveLocation = (locations) => {
  if (!Array.isArray(locations) || locations.length === 0) return null;
  return locations.find((l) => l?.is_active) || locations[0] || null;
};

const getDeviceInfo = (detail) => {
  const firstDetail = detail?.service_request_details?.[0];
  const device = firstDetail?.device;
  const deviceModel = device?.device_model;
  return {
    deviceType: device?.device_type?.name || deviceModel?.device_type?.name || '-',
    brand: deviceModel?.brand || '-',
    model: deviceModel?.model || '-',
    serviceType: firstDetail?.service_type?.name || '-',
    serialNumber: device?.serial_number || '-',
    complaint: firstDetail?.complaint || '-',
  };
};

const ServiceDetail = ({ onBack } = {}) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [detail, setDetail] = useState(null);
  const [locations, setLocations] = useState([]);
  const [costs, setCosts] = useState([]);
  const [allStatusById, setAllStatusById] = useState(new Map());
  const [serviceStatusById, setServiceStatusById] = useState(new Map());

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  // Check if invoice can be printed based on status
  const canPrintInvoice = useMemo(() => {
    const statusId = detail?.status_id;
    const statusCode =
      statusId != null
        ? serviceStatusById.get(Number(statusId))?.code
        : detail?.status?.code;
    return statusCode && PRINTABLE_STATUS_CODES.includes(statusCode);
  }, [detail?.status_id, detail?.status?.code, serviceStatusById]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const [allStatuses, serviceStatuses] = await Promise.all([
          getStatusMapsCached(),
          getStatusMapsCached({ entityTypeId: 1 }),
        ]);
        if (!mounted) return;

        setAllStatusById(allStatuses.byId);
        setServiceStatusById(serviceStatuses.byId);
      } catch (err) {
        if (!mounted) return;
        console.error('[Atasan/ServiceDetail] Status init error:', err);
      }
    };

    init();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const fetchDetail = async () => {
      if (!id) return;
      setIsLoading(true);
      setError('');

      console.log('[Atasan/ServiceDetail] Loading request:', id);

      try {
        const [detailData, locationsData] = await Promise.all([
          getServiceRequestDetailCached(id, { signal: controller.signal }),
          getServiceRequestLocationsCached(id, { signal: controller.signal }),
        ]);

        const costsRes = await authenticatedRequest(`/service-requests/${id}/costs`, {
          signal: controller.signal,
        });
        const costsData = costsRes.ok ? normalizeArrayPayload(costsRes.data) : [];

        if (cancelled) return;

        setDetail(detailData);
        setLocations(Array.isArray(locationsData) ? locationsData : []);
        setCosts(costsData);

        console.log('[Atasan/ServiceDetail] Loaded successfully:', detailData?.service_number);
      } catch (err) {
        if (err?.name === 'AbortError') return;
        if (cancelled) return;

        console.error('[Atasan/ServiceDetail] Load error:', err);
        setDetail(null);
        setLocations([]);
        setCosts([]);
        setError(getErrorMessage(err, 'Gagal memuat detail request'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchDetail();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [id]);

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    navigate('/services');
  };

  // Computed values
  const serviceStatus = useMemo(() => {
    if (!detail) return null;
    return serviceStatusById.get(Number(detail.status_id)) || null;
  }, [detail, serviceStatusById]);

  const serviceStatusCode = serviceStatus?.code || '';

  const handlePrintInvoice = async () => {
    if (!id || isDownloading) return;

    setIsDownloading(true);

    try {
      const token = localStorage.getItem('auth_token');
      // Use preview-invoice for non-COMPLETED status (generates on-the-fly)
      // Use download-invoice for COMPLETED status (stored Invoice record)
      const isCompleted = serviceStatusCode === 'COMPLETED';
      const endpoint = isCompleted ? 'download-invoice' : 'preview-invoice';
      const url = buildApiUrl(`/service-requests/${id}/${endpoint}`);

      console.log('[Atasan/ServiceDetail] Downloading invoice:', { id, endpoint, status: serviceStatusCode });

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

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `invoice-${detail?.service_number || id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      console.log('[Atasan/ServiceDetail] Invoice downloaded successfully');
    } catch (err) {
      console.error('[Atasan/ServiceDetail] Invoice download error:', err);
      alert(err.message || 'Gagal mengunduh invoice');
    } finally {
      setIsDownloading(false);
    }
  };

  const activeLocation = useMemo(
    () => getActiveLocation(locations),
    [locations]
  );

  const deviceInfo = useMemo(() => getDeviceInfo(detail), [detail]);

  const departmentLabel =
    detail?.user?.departments?.[0]?.name || detail?.user?.department?.name || '-';

  const vendorApprovals = Array.isArray(detail?.vendor_approvals)
    ? detail.vendor_approvals
    : [];

  const approvalSummary = useMemo(() => {
    const total = vendorApprovals.length;
    if (!total) return null;

    let approved = 0;
    let rejected = 0;

    for (const item of vendorApprovals) {
      const statusInfo = allStatusById.get(Number(item?.status_id));
      const code = statusInfo?.code || '';
      if (code === 'APPROVED') approved += 1;
      if (code === 'REJECTED') rejected += 1;
    }

    const progress = total ? Math.round((approved / total) * 100) : 0;
    return {
      total,
      approved,
      rejected,
      progress,
      summary: `${approved}/${total} Approved`,
    };
  }, [allStatusById, vendorApprovals]);

  // Build timeline from audit_logs
  const timelineItems = useMemo(() => {
    const items = [];
    const createdAt = detail?.created_at || detail?.request_date;
    const requesterName = detail?.user?.name || 'User';

    // Always add creation entry first
    if (createdAt) {
      items.push({
        id: 'created',
        label: 'Request Dibuat',
        date: createdAt,
        note: `Request dibuat oleh ${requesterName}`,
        state: 'active',
      });
    }

    // Process audit_logs
    const logs = Array.isArray(detail?.audit_logs) ? [...detail.audit_logs] : [];
    logs.sort((a, b) => {
      const aTime = new Date(a?.created_at || 0).getTime();
      const bTime = new Date(b?.created_at || 0).getTime();
      return aTime - bTime;
    });

    for (const log of logs) {
      if (log?.action === 'CREATE_REQUEST') continue;

      const newStatus = log?.new_status_id != null
        ? allStatusById.get(Number(log.new_status_id))
        : null;

      const actorName = log?.actor?.name || 'System';
      const statusCode = newStatus?.code || '';
      let label = newStatus?.name || log?.action || 'Update';
      let note = log?.notes || '-';

      // Map status codes to readable labels
      if (statusCode === 'APPROVED_BY_ADMIN') {
        label = 'Disetujui Admin';
        note = note || `Disetujui oleh ${actorName}`;
      } else if (statusCode === 'IN_REVIEW_ABOVE') {
        label = 'Menunggu Approval Atasan';
        note = note || 'Menunggu approval dari atasan';
      } else if (statusCode === 'APPROVED_BY_ABOVE') {
        label = 'Disetujui Atasan';
        note = note || 'Semua atasan sudah menyetujui';
      } else if (statusCode === 'REJECTED_BY_ABOVE') {
        label = 'Ditolak Atasan';
        note = note || 'Ada atasan yang menolak';
      } else if (statusCode === 'IN_PROGRESS') {
        label = 'Dalam Proses';
        note = note || 'Barang sedang diservis';
      } else if (statusCode === 'COMPLETED') {
        label = 'Selesai';
        note = note || 'Service selesai';
      } else if (log?.action === 'APPROVE_VENDOR') {
        label = 'Approval Atasan';
        note = `Disetujui oleh ${actorName}`;
      } else if (log?.action === 'REJECT_VENDOR') {
        label = 'Penolakan Atasan';
        note = `Ditolak oleh ${actorName}${log?.notes ? `: ${log.notes}` : ''}`;
      }

      items.push({
        id: log?.id || `${log?.action}-${log?.created_at}`,
        label,
        date: log?.created_at,
        note,
        state: 'active',
      });
    }

    // Sort and format dates
    items.sort((a, b) => {
      const aTime = new Date(a.date || 0).getTime();
      const bTime = new Date(b.date || 0).getTime();
      return aTime - bTime;
    });

    return items.map((item) => ({
      ...item,
      date: formatDateTime(item.date),
    }));
  }, [allStatusById, detail]);

  // Cost breakdown
  const totalCost = useMemo(() => {
    return costs.reduce((sum, c) => sum + Number(c?.amount || 0), 0);
  }, [costs]);

  const serviceFee = costs.find((c) => c?.cost_type?.code === 'SERVICE_FEE');
  const cancellationFee = costs.find((c) => c?.cost_type?.code === 'CANCELLATION');

  if (isLoading) {
    return (
      <div className="atasan-detail-page">
        <div className="atasan-detail-loading">Memuat detail request...</div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="atasan-detail-page">
        <div className="atasan-detail-error">
          <p>{error || 'Request tidak ditemukan'}</p>
          <button type="button" onClick={handleBack}>
            Kembali
          </button>
        </div>
      </div>
    );
  }

  const serviceNumber = detail.service_number || `SR-${detail.id}`;
  const createdAt = formatDateTime(detail.request_date || detail.created_at);

  const placeLabel =
    activeLocation?.location_type === 'external'
      ? activeLocation?.vendor?.name || 'Vendor'
      : activeLocation
        ? 'Workshop IT'
        : '-';

  const addressLabel =
    activeLocation?.location_type === 'external'
      ? [
          activeLocation?.address,
          activeLocation?.city,
          activeLocation?.province,
          activeLocation?.postal_code,
        ]
          .filter(Boolean)
          .join(', ')
      : activeLocation
        ? 'Workshop IT (Internal)'
        : '-';

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
          <h1>{serviceNumber}</h1>
          <p>Dibuat pada tanggal {createdAt}</p>
        </div>
      </div>

      <div className="atasan-detail-grid">
        <div className="atasan-detail-left">
          {/* Detail Request Card */}
          <section className="atasan-detail-card">
            <div className="atasan-detail-card-head">
              <h2>Detail Request</h2>
              <span className="atasan-detail-dept">{departmentLabel}</span>
            </div>

            <div className="atasan-detail-row">
              <span className="atasan-detail-key">Requester</span>
              <span className="atasan-detail-value">{detail.user?.name || '-'}</span>
            </div>
            <div className="atasan-detail-row">
              <span className="atasan-detail-key">Perangkat</span>
              <span className="atasan-detail-value">{deviceInfo.deviceType}</span>
            </div>
            <div className="atasan-detail-row">
              <span className="atasan-detail-key">Merk</span>
              <span className="atasan-detail-value">{deviceInfo.brand}</span>
            </div>
            <div className="atasan-detail-row">
              <span className="atasan-detail-key">Model</span>
              <span className="atasan-detail-value">{deviceInfo.model}</span>
            </div>
            <div className="atasan-detail-row">
              <span className="atasan-detail-key">Jenis Service</span>
              <span className="atasan-detail-value">{deviceInfo.serviceType}</span>
            </div>
            <div className="atasan-detail-row">
              <span className="atasan-detail-key">Serial Number</span>
              <span className="atasan-detail-value">{deviceInfo.serialNumber}</span>
            </div>

            <div className="atasan-detail-notes">
              <span className="atasan-detail-key">Keterangan</span>
              <div className="atasan-detail-text">{deviceInfo.complaint}</div>
            </div>

            <div className="atasan-detail-row">
              <span className="atasan-detail-key">Status</span>
              <span className="atasan-detail-value">{serviceStatus?.name || '-'}</span>
            </div>

            {activeLocation && (
              <>
                <div className="atasan-detail-row">
                  <span className="atasan-detail-key">Tempat Service</span>
                  <span className="atasan-detail-value">{placeLabel}</span>
                </div>

                <div className="atasan-detail-location">
                  <span className="atasan-detail-key">Lokasi Service</span>
                  <div className="atasan-detail-address">{addressLabel}</div>
                </div>
              </>
            )}
          </section>

          {/* Estimasi Biaya Card - only show if there are costs */}
          {costs.length > 0 && (
            <section className="atasan-estimate-card">
              <h2>Estimasi Biaya</h2>
              {serviceFee && (
                <div className="atasan-estimate-row">
                  <span>Biaya Service</span>
                  <span>{formatRupiah(serviceFee?.amount)}</span>
                </div>
              )}
              {cancellationFee && (
                <div className="atasan-estimate-row">
                  <span>Biaya Cancel</span>
                  <span>{formatRupiah(cancellationFee?.amount)}</span>
                </div>
              )}
              <div className="atasan-estimate-row atasan-estimate-total">
                <span>Total</span>
                <span>{formatRupiah(totalCost)}</span>
              </div>
              {(serviceFee?.description || cancellationFee?.description) && (
                <div className="atasan-estimate-notes">
                  <span className="atasan-detail-key">Keterangan</span>
                  <div className="atasan-detail-text">
                    {serviceFee?.description || cancellationFee?.description || '-'}
                  </div>
                </div>
              )}
            </section>
          )}
        </div>

        <div className="atasan-detail-right">
          {/* Approval Status Card - only show if there are approvals */}
          {approvalSummary && (
            <section className="atasan-approval-card">
              <h2>Status Approval</h2>
              <p>Approval dari atasan</p>

              <div className="atasan-approval-progress">
                <div className="atasan-approval-bar">
                  <span
                    className="atasan-approval-bar-fill"
                    style={{ width: `${approvalSummary.progress}%` }}
                  ></span>
                </div>
                <span className="atasan-approval-count">{approvalSummary.summary}</span>
              </div>

              <div className="atasan-approval-list">
                {vendorApprovals.map((item) => {
                  const statusInfo = allStatusById.get(Number(item?.status_id));
                  const statusCode = statusInfo?.code || '';
                  const state =
                    statusCode === 'APPROVED'
                      ? 'approved'
                      : statusCode === 'REJECTED'
                        ? 'rejected'
                        : 'waiting';
                  const statusLabel =
                    state === 'approved'
                      ? 'Approved'
                      : state === 'rejected'
                        ? 'Rejected'
                        : 'Waiting';

                  return (
                    <div
                      className={`atasan-approval-item atasan-approval-${state}`}
                      key={item.id}
                    >
                      <div>
                        <div className="atasan-approval-name">
                          {item.approver?.name || '-'}
                        </div>
                        {item.notes && (
                          <div className="atasan-approval-note">{item.notes}</div>
                        )}
                      </div>
                      <span className="atasan-approval-status">{statusLabel}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Timeline Card */}
          <section className="atasan-timeline-card">
            <h2>Timeline</h2>

            <div className="atasan-timeline-list">
              {timelineItems.length === 0 ? (
                <div className="atasan-timeline-empty">Belum ada aktivitas</div>
              ) : (
                timelineItems.map((item, index) => (
                  <div className="atasan-timeline-item" key={item.id}>
                    <div className="atasan-timeline-marker">
                      <span className={`atasan-timeline-dot ${item.state}`}></span>
                      {index < timelineItems.length - 1 && (
                        <span className={`atasan-timeline-line ${item.state}`}></span>
                      )}
                    </div>
                    <div className="atasan-timeline-content">
                      <span
                        className={`atasan-timeline-tag ${item.state === 'active' ? 'active' : ''}`}
                      >
                        {item.label}
                      </span>
                      <span className="atasan-timeline-date">{item.date}</span>
                      <span className="atasan-timeline-desc">{item.note}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {canPrintInvoice && (
              <button
                className="atasan-invoice-btn"
                type="button"
                onClick={handlePrintInvoice}
                disabled={isDownloading}
              >
                {isDownloading ? 'Mengunduh...' : 'Cetak Invoice'}
                <i className="bi bi-printer"></i>
              </button>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetail;
