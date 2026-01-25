import React, { useEffect, useMemo, useState } from 'react';
import './ServiceList.css';
import eyeIcon from '../../../assets/icons/lihatdetail(eye).svg';
import { apiRequest, unwrapApiData, parseApiError } from '../../../lib/api';
import { fetchDeviceModels, fetchDeviceTypes } from '../../../lib/referenceApi';
import { formatDate, formatCurrency } from '../../../lib/formatters';
import { getDeviceSummary, getPrimaryDetail } from '../../../lib/serviceRequestUtils';
import { mapStatusVariant } from '../../../lib/statusHelpers';

const ServiceList = ({ onViewDetail }) => {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deviceModels, setDeviceModels] = useState([]);
  const [deviceTypes, setDeviceTypes] = useState([]);

  useEffect(() => {
    const loadReferences = async () => {
      try {
        const [models, types] = await Promise.all([
          fetchDeviceModels(),
          fetchDeviceTypes(),
        ]);
        setDeviceModels(models);
        setDeviceTypes(types);
      } catch (err) {
        setError(err.message || 'Gagal mengambil referensi perangkat.');
      }
    };
    loadReferences();
  }, []);

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiRequest('/service-requests?per_page=50');
        if (!res.ok || res.data?.success === false) {
          throw new Error(parseApiError(res.data, 'Gagal mengambil data.'));
        }
        const payload = unwrapApiData(res.data);
        const list = Array.isArray(payload) ? payload : [];
        setRows(list);
      } catch (err) {
        setError(err.message || 'Gagal mengambil data.');
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const mappedRows = useMemo(() => {
    return rows.map((item) => {
      const detail = getPrimaryDetail(item);
      const deviceSummary = getDeviceSummary({
        detail,
        deviceModels,
        deviceTypes,
      });
      return {
        id: item.id,
        serviceNumber: item.service_number,
        device: deviceSummary.deviceTypeName,
        model: deviceSummary.model,
        service: item.service_type?.name || '-',
        location: '-',
        date: formatDate(item.request_date),
        cost: '',
        status: item.status?.name || '-',
        statusCode: item.status?.code || '',
        statusVariant: mapStatusVariant(item.status?.code),
      };
    });
  }, [deviceModels, deviceTypes, rows]);

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return mappedRows;
    return mappedRows.filter((row) => {
      const values = [
        row.serviceNumber,
        row.device,
        row.model,
        row.service,
        row.location,
        row.status,
      ];
      return values.some((value) =>
        String(value || '').toLowerCase().includes(keyword)
      );
    });
  }, [mappedRows, search]);

  return (
    <div className="admin-service-list">
      <div className="admin-service-header">
        <h1>Service List</h1>
      </div>

      <div className="admin-service-controls">
        <div className="admin-search-box">
          <input
            type="text"
            placeholder=""
            aria-label="Search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <i className="bi bi-search"></i>
        </div>

        <div className="admin-filter-group">
          <button className="admin-filter-btn" type="button">
            <i className="bi bi-calendar3"></i>
            <span>Date</span>
            <i className="bi bi-chevron-down"></i>
          </button>
          <button className="admin-filter-btn" type="button">
            <i className="bi bi-funnel"></i>
            <span>Service</span>
            <i className="bi bi-chevron-down"></i>
          </button>
          <button className="admin-filter-btn" type="button">
            <i className="bi bi-funnel"></i>
            <span>Status</span>
            <i className="bi bi-chevron-down"></i>
          </button>
        </div>
      </div>

      <div className="admin-service-table">
        <div className="admin-service-row admin-service-head">
          <div>Kode</div>
          <div>Perangkat</div>
          <div>Model</div>
          <div>Service</div>
          <div>Lokasi</div>
          <div>Tanggal</div>
          <div>Biaya</div>
          <div>Status</div>
          <div></div>
        </div>

        {loading && (
          <div className="admin-service-row">
            <div>Memuat data...</div>
          </div>
        )}
        {!loading && error && (
          <div className="admin-service-row">
            <div>{error}</div>
          </div>
        )}
        {!loading && !error && filteredRows.length === 0 && (
          <div className="admin-service-row">
            <div>Data kosong.</div>
          </div>
        )}
        {!loading &&
          !error &&
          filteredRows.map((row) => (
            <div className="admin-service-row" key={row.id}>
              <div className="admin-code">{row.serviceNumber || '-'}</div>
              <div>{row.device}</div>
              <div>{row.model}</div>
              <div>{row.service}</div>
              <div>{row.location}</div>
              <div>
                <input
                  className="admin-date-input"
                  type="text"
                  value={row.date}
                  readOnly
                />
              </div>
              <div className="admin-cost">
                {row.cost ? formatCurrency(row.cost) : '-'}
              </div>
              <div className={`admin-status status-${row.statusVariant}`}>
                {row.status}
              </div>
              <div className="admin-actions">
                <button className="admin-ellipsis" type="button" aria-label="Menu">
                  ...
                </button>
                <button
                  className="admin-detail-btn"
                  type="button"
                  onClick={() => onViewDetail?.(row)}
                >
                  <img src={eyeIcon} alt="Detail" />
                  Detail
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default ServiceList;
