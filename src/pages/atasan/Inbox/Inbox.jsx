import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Inbox.css';
import eyeIcon from '../../../assets/icons/lihatdetail(eye).svg';
import {
  apiRequest,
  unwrapApiData,
  parseApiError,
} from '../../../lib/api';
import { fetchStatuses } from '../../../lib/referenceApi';
import { formatDate } from '../../../lib/formatters';
import { getVendorApprovalEntityTypeId, getStatusByCode } from '../../../lib/statusHelpers';

const Inbox = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStatuses = async () => {
      try {
        const statusList = await fetchStatuses();
        setStatuses(statusList);
      } catch (err) {
        setError(err.message || 'Gagal memuat status.');
      }
    };
    loadStatuses();
  }, []);

  useEffect(() => {
    const fetchInbox = async () => {
      if (!statuses.length) return;
      setLoading(true);
      setError('');
      try {
        const entityTypeId = getVendorApprovalEntityTypeId(statuses);
        const pendingStatus = getStatusByCode(statuses, entityTypeId, 'PENDING');
        if (!pendingStatus?.id) {
          throw new Error('Status PENDING untuk approval tidak ditemukan.');
        }
        const res = await apiRequest(`/inbox-approvals/${pendingStatus.id}`);
        if (!res.ok || res.data?.success === false) {
          throw new Error(parseApiError(res.data, 'Gagal mengambil inbox.'));
        }
        const payload = unwrapApiData(res.data);
        const list = Array.isArray(payload) ? payload : [];
        setRows(list);
      } catch (err) {
        setError(err.message || 'Gagal mengambil inbox.');
      } finally {
        setLoading(false);
      }
    };
    fetchInbox();
  }, [statuses]);

  const statusMap = useMemo(() => {
    return statuses.reduce((acc, status) => {
      acc[status.id] = status;
      return acc;
    }, {});
  }, [statuses]);

  return (
    <div className="atasan-inbox-page">
      <div className="atasan-inbox-header">
        <h1>Inbox Approval</h1>
      </div>

      {loading && <div className="atasan-inbox-status">Memuat data...</div>}
      {!loading && error && <div className="atasan-inbox-status">{error}</div>}

      {!loading && !error && rows.length === 0 && (
        <div className="atasan-inbox-status">Tidak ada approval.</div>
      )}

      {!loading &&
        !error &&
        rows.map((row) => {
          const serviceRequest = row.service_request;
          const status = statusMap[row.status_id];
          return (
            <div className="atasan-inbox-row" key={row.id}>
              <div className="atasan-inbox-main">
                <div className="atasan-inbox-code">
                  {serviceRequest?.service_number || `REQ-${row.service_request_id}`}
                </div>
                <div className="atasan-inbox-meta">
                  <span>{serviceRequest?.request_date ? formatDate(serviceRequest.request_date) : '-'}</span>
                  <span>{status?.name || '-'}</span>
                </div>
              </div>
              <button
                className="atasan-inbox-detail"
                type="button"
                onClick={async () => {
                  if (row.id) {
                    await apiRequest(`/inbox-approvals/${row.id}/read`, { method: 'PUT' });
                  }
                  navigate(`/service-requests/${row.service_request_id}?from=inbox&variant=approval`);
                }}
              >
                <img src={eyeIcon} alt="Detail" />
                Detail
              </button>
            </div>
          );
        })}
    </div>
  );
};

export default Inbox;
