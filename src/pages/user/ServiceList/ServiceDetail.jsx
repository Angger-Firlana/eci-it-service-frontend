import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import './ServiceDetail.css';
import backIcon from '../../../assets/icons/back.svg';
import { apiRequest, unwrapApiData, parseApiError, buildApiUrl } from '../../../lib/api';
import { fetchDeviceModels, fetchDeviceTypes, fetchStatuses } from '../../../lib/referenceApi';
import { formatDateTime } from '../../../lib/formatters';
import { getDeviceSummary, getPrimaryDetail } from '../../../lib/serviceRequestUtils';

const ServiceDetail = ({ onBack, requestId }) => {
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resolvedRequestId = requestId || params.id;
  const [detail, setDetail] = useState(null);
  const [deviceModels, setDeviceModels] = useState([]);
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        const res = await apiRequest(`/service-requests/${resolvedRequestId}`);
        if (!res.ok || res.data?.success === false) {
          throw new Error(parseApiError(res.data, 'Gagal mengambil detail.'));
        }
        const payload = unwrapApiData(res.data);
        setDetail(payload || null);
      } catch (err) {
        setError(err.message || 'Gagal mengambil detail.');
      } finally {
        setLoading(false);
      }
    };
    loadDetail();
  }, [resolvedRequestId]);

  const primaryDetail = getPrimaryDetail(detail);
  const deviceSummary = getDeviceSummary({
    detail: primaryDetail,
    deviceModels,
    deviceTypes,
  });

  const statusMap = useMemo(() => {
    return statuses.reduce((acc, status) => {
      acc[status.id] = status;
      return acc;
    }, {});
  }, [statuses]);

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
        note: log.notes || newStatus?.name || '- ',
        state: 'active',
      };
    });
  }, [detail, statusMap]);

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
    <div className="service-detail-page">
      <div className="detail-header">
        <button
          className="detail-back"
          type="button"
          onClick={handleBack}
        >
          <img src={backIcon} alt="Back" />
        </button>
        <div className="detail-title">
          <h1>{detail?.service_number || '-'}</h1>
          <p>
            {detail?.request_date
              ? `Dibuat pada ${formatDateTime(detail.request_date)}`
              : 'Dibuat pada -'}
          </p>
        </div>
      </div>

      {loading && <div className="detail-loading">Memuat data...</div>}
      {error && <div className="detail-error">{error}</div>}

      {!loading && !error && (
        <div className="detail-grid">
          <section className="detail-card">
            <div className="detail-card-head">
              <h2>Detail Request</h2>
              <span className="detail-dept">-</span>
            </div>

            <div className="detail-row">
              <span className="detail-key">Requester</span>
              <span className="detail-value">{detail?.user?.name || '-'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-key">Perangkat</span>
              <span className="detail-value">{deviceSummary.deviceTypeName}</span>
            </div>
            <div className="detail-row">
              <span className="detail-key">Merk</span>
              <span className="detail-value">{deviceSummary.brand}</span>
            </div>
            <div className="detail-row">
              <span className="detail-key">Model</span>
              <span className="detail-value">{deviceSummary.model}</span>
            </div>
            <div className="detail-row">
              <span className="detail-key">Jenis Service</span>
              <span className="detail-value">
                {detail?.service_type?.name || '-'}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-key">Serial Number</span>
              <span className="detail-value">{deviceSummary.serialNumber}</span>
            </div>

            <div className="detail-notes">
              <span className="detail-key">Keterangan</span>
              <div className="detail-text">
                {primaryDetail?.complaint || '-'}
              </div>
            </div>
          </section>

          <aside className="timeline-card">
            <h2>Timeline</h2>

            <div className="timeline-list">
              {timelineItems.length === 0 && (
                <div className="timeline-empty">Belum ada timeline.</div>
              )}
              {timelineItems.map((item, index) => (
                <div className="timeline-item" key={item.id}>
                  <div className="timeline-marker">
                    <span className={`timeline-dot ${item.state}`}></span>
                    {index < timelineItems.length - 1 && (
                      <span className={`timeline-line ${item.state}`}></span>
                    )}
                  </div>
                  <div className="timeline-content">
                    <span className={`timeline-tag ${item.state}`}>{item.label}</span>
                    <span className="timeline-date">{item.date}</span>
                    <span className="timeline-desc">{item.note}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              className="invoice-btn"
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
          </aside>
        </div>
      )}
    </div>
  );
};

export default ServiceDetail;
