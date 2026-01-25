import React, { useEffect, useMemo, useState } from 'react';
import './ServiceList.css';
import eyeIcon from '../../../assets/icons/lihatdetail(eye).svg';
import { apiRequest, unwrapApiData, parseApiError } from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';
import { fetchDeviceModels, fetchDeviceTypes } from '../../../lib/referenceApi';
import { formatDate } from '../../../lib/formatters';
import { getDeviceSummary, getPrimaryDetail } from '../../../lib/serviceRequestUtils';
import { mapStatusVariant } from '../../../lib/statusHelpers';

const ServiceList = ({ onViewDetail }) => {
  const { user } = useAuth();
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
      if (!user?.id) return;
      setLoading(true);
      setError('');
      try {
        const res = await apiRequest(
          `/service-requests?user_id=${user.id}&per_page=50`
        );
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
  }, [user]);

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
        date: formatDate(item.request_date),
        description: detail?.complaint || '-',
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
        row.description,
        row.status,
      ];
      return values.some((value) =>
        String(value || '').toLowerCase().includes(keyword)
      );
    });
  }, [mappedRows, search]);

  return (
    <div className="service-list-page">
      <div className="service-list-header">
        <h1>Service List</h1>
      </div>

      <div className="service-list-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder=""
            aria-label="Search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <i className="bi bi-search"></i>
        </div>

        <div className="filter-group">
          <button className="filter-btn" type="button">
            <i className="bi bi-calendar3"></i>
            <span>Date</span>
            <i className="bi bi-chevron-down"></i>
          </button>
          <button className="filter-btn" type="button">
            <i className="bi bi-funnel"></i>
            <span>Status</span>
            <i className="bi bi-chevron-down"></i>
          </button>
        </div>
      </div>

      <div className="service-table-card">
        <div className="service-table-row service-table-head">
          <div>Perangkat</div>
          <div>Model</div>
          <div>Service</div>
          <div>Tanggal</div>
          <div>Keterangan</div>
          <div>Status</div>
          <div></div>
        </div>

        {loading && (
          <div className="service-table-row">
            <div>Memuat data...</div>
          </div>
        )}
        {!loading && error && (
          <div className="service-table-row">
            <div>{error}</div>
          </div>
        )}
        {!loading && !error && filteredRows.length === 0 && (
          <div className="service-table-row">
            <div>Data kosong.</div>
          </div>
        )}

        {!loading &&
          !error &&
          filteredRows.map((row) => (
            <div className="service-table-row" key={row.id}>
              <div>{row.device}</div>
              <div>{row.model}</div>
              <div>{row.service}</div>
              <div>
                <div className="date-pill">
                  <span>{row.date}</span>
                  <i className="bi bi-calendar3"></i>
                </div>
              </div>
              <div className="service-desc">{row.description}</div>
              <div className={`status-pill status-${row.statusVariant}`}>
                {row.status}
              </div>
              <div className="service-actions">
                <button className="ellipsis-btn" type="button" aria-label="Menu">
                  ...
                </button>
                <button
                  className="detail-btn"
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
