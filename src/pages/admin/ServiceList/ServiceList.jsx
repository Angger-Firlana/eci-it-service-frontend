import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './ServiceList.css';
import eyeIcon from '../../../assets/icons/lihatdetail(eye).svg';
import {
  apiRequest,
  unwrapApiData,
  parseApiError,
  unwrapApiMeta,
} from '../../../lib/api';
import {
  fetchDeviceModels,
  fetchDeviceTypes,
  fetchStatuses,
} from '../../../lib/referenceApi';
import { formatDate, formatCurrency } from '../../../lib/formatters';
import { getDeviceSummary, getPrimaryDetail } from '../../../lib/serviceRequestUtils';
import { mapStatusVariant, getServiceRequestEntityTypeId } from '../../../lib/statusHelpers';
import { Pagination } from '../../../components/common';

const DEFAULT_PER_PAGE = 10;

const ServiceList = ({ onViewDetail }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deviceModels, setDeviceModels] = useState([]);
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [meta, setMeta] = useState(null);

  const page = Number(searchParams.get('page') || 1);
  const perPage = Number(searchParams.get('per_page') || DEFAULT_PER_PAGE);

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
        setError(err.message || 'Gagal mengambil referensi perangkat.');
      }
    };
    loadReferences();
  }, []);

  useEffect(() => {
    setSearch(searchParams.get('search') || '');
    setStatusFilter(searchParams.get('status') || '');
  }, [searchParams]);

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      setError('');
      try {
        const query = new URLSearchParams();
        query.set('page', String(page));
        query.set('per_page', String(perPage));
        if (searchParams.get('search')) {
          query.set('search', searchParams.get('search'));
        }
        if (statusFilter) {
          query.set('status_id', statusFilter);
        }

        const res = await apiRequest(`/service-requests?${query.toString()}`, {
          cacheKey: `service-requests:admin:${page}:${perPage}:${searchParams.get('search') || ''}:${statusFilter}`,
          staleTime: 60 * 1000,
        });
        if (!res.ok || res.data?.success === false) {
          throw new Error(parseApiError(res.data, 'Gagal mengambil data.'));
        }
        const payload = unwrapApiData(res.data);
        const list = Array.isArray(payload) ? payload : [];
        setRows(list);
        setMeta(unwrapApiMeta(res.data));
      } catch (err) {
        setError(err.message || 'Gagal mengambil data.');
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [page, perPage, searchParams, statusFilter]);

  const serviceRequestEntityTypeId = useMemo(
    () => getServiceRequestEntityTypeId(statuses),
    [statuses]
  );

  const statusOptions = useMemo(() => {
    return statuses.filter(
      (status) => status.entity_type_id === serviceRequestEntityTypeId
    );
  }, [serviceRequestEntityTypeId, statuses]);

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

  const updateParams = (next) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    setSearchParams(params);
  };

  const handleViewDetail = (row) => {
    if (onViewDetail) {
      onViewDetail(row);
      return;
    }
    navigate(`/service-requests/${row.id}?from=service-requests`);
  };

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
            onChange={(event) => {
              const value = event.target.value;
              setSearch(value);
              updateParams({ search: value, page: 1 });
            }}
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
          <select
            className="admin-filter-select"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              updateParams({ status: event.target.value, page: 1 });
            }}
          >
            <option value="">Semua Status</option>
            {statusOptions.map((status) => (
              <option key={status.id} value={status.id}>
                {status.name}
              </option>
            ))}
          </select>
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
                  onClick={() => handleViewDetail(row)}
                >
                  <img src={eyeIcon} alt="Detail" />
                  Detail
                </button>
              </div>
            </div>
          ))}
      </div>

      <Pagination
        meta={meta}
        onPageChange={(nextPage) => updateParams({ page: nextPage })}
      />
    </div>
  );
};

export default ServiceList;
