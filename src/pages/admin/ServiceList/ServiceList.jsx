import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './ServiceList.css';
import eyeIcon from '../../../assets/icons/lihatdetail(eye).svg';
import { authenticatedRequest } from '../../../lib/api';

const PER_PAGE = 10;

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatRupiah = (amount) => {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return '';
  return `Rp ${Math.round(value).toLocaleString('id-ID')}`;
};

const normalizeListPayload = (responseData) => {
  const data = responseData?.data || responseData;
  const items = Array.isArray(data) ? data : data?.data || [];
  const meta = data?.meta || responseData?.meta || null;
  return { items, meta };
};

const normalizeDetailPayload = (responseData) => responseData?.data || responseData;

const normalizeArrayPayload = (responseData) => {
  const data = responseData?.data || responseData;
  return Array.isArray(data) ? data : data?.data || [];
};

const getDeviceLabel = (service) => {
  const firstDetail = service.service_request_details?.[0];
  const device = firstDetail?.device;
  const deviceModel = device?.device_model;
  return (
    device?.device_type?.name ||
    deviceModel?.device_type?.name ||
    '-'
  );
};

const getModelLabel = (service) => {
  const firstDetail = service.service_request_details?.[0];
  const deviceModel = firstDetail?.device?.device_model;
  const brand = deviceModel?.brand || '';
  const model = deviceModel?.model || '';
  const label = [brand, model].filter(Boolean).join(' ');
  return label || '-';
};

const getServiceTypeLabel = (service) => {
  const firstDetail = service.service_request_details?.[0];
  return firstDetail?.service_type?.name || '-';
};

const getLocationLabel = (locations) => {
  if (!Array.isArray(locations) || locations.length === 0) return '-';
  const active = locations.find((loc) => loc?.is_active) || locations[locations.length - 1];
  const type = String(active?.location_type || '').toLowerCase();
  if (type === 'internal') return 'Workshop';
  if (type === 'external') return 'Vendor';
  return active?.location_type || '-';
};

const ServiceList = ({ onViewDetail } = {}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const querySearch = searchParams.get('search') || '';

  const [search, setSearch] = useState(querySearch);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const locationsCacheRef = useRef(new Map());
  const costsCacheRef = useRef(new Map());

  useEffect(() => {
    setSearch(querySearch);
  }, [querySearch]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const fetchDetail = async (id) => {
      const detailRes = await authenticatedRequest(`/service-requests/${id}`, {
        signal: controller.signal,
      });
      if (!detailRes.ok) {
        throw new Error(detailRes.data?.message || 'Failed to fetch service detail');
      }
      return normalizeDetailPayload(detailRes.data);
    };

    const fetchLocations = async (id) => {
      if (locationsCacheRef.current.has(id)) return locationsCacheRef.current.get(id);
      const res = await authenticatedRequest(`/service-requests/${id}/locations`, {
        signal: controller.signal,
      });
      if (!res.ok) {
        locationsCacheRef.current.set(id, []);
        return [];
      }
      const list = normalizeArrayPayload(res.data);
      locationsCacheRef.current.set(id, list);
      return list;
    };

    const fetchCostsTotal = async (id) => {
      if (costsCacheRef.current.has(id)) return costsCacheRef.current.get(id);
      const res = await authenticatedRequest(`/service-requests/${id}/costs`, {
        signal: controller.signal,
      });
      if (!res.ok) {
        costsCacheRef.current.set(id, 0);
        return 0;
      }
      const list = normalizeArrayPayload(res.data);
      const total = list.reduce((sum, item) => sum + Number(item?.amount || 0), 0);
      costsCacheRef.current.set(id, total);
      return total;
    };

    const fetchServices = async () => {
      setIsLoading(true);
      setError('');

      try {
        const params = new URLSearchParams();
        params.set('page', String(currentPage));
        params.set('per_page', String(PER_PAGE));
        if (querySearch.trim()) {
          params.set('search', querySearch.trim());
        }

        const response = await authenticatedRequest(`/service-requests?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok || response.data?.success === false) {
          throw new Error(response.data?.message || 'Failed to fetch service list');
        }

        const { items, meta } = normalizeListPayload(response.data);

        const detailIds = items.map((item) => item?.id).filter(Boolean);
        const details = await Promise.all(detailIds.map((id) => fetchDetail(id)));

        const [locationsList, costsTotals] = await Promise.all([
          Promise.all(detailIds.map((id) => fetchLocations(id))),
          Promise.all(detailIds.map((id) => fetchCostsTotal(id))),
        ]);

        const computedRows = details.map((service, index) => {
          const id = service.id;
          const locations = locationsList[index] || [];
          const costTotal = costsTotals[index] || 0;

          return {
            id,
            code: service.service_number || `SR-${id}`,
            device: getDeviceLabel(service),
            model: getModelLabel(service),
            service: getServiceTypeLabel(service),
            location: getLocationLabel(locations),
            date: formatDate(service.request_date || service.created_at),
            cost: formatRupiah(costTotal),
            status: service.status?.name || '-',
            _original: service,
          };
        });

        if (cancelled) return;
        setRows(computedRows);
        setPagination(
          meta
            ? {
                current_page: meta.current_page,
                last_page: meta.last_page,
                total: meta.total,
              }
            : null
        );
      } catch (err) {
        if (cancelled) return;
        if (err?.name === 'AbortError') return;
        setError(err.message || 'Failed to load services');
        setRows([]);
        setPagination(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchServices();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [currentPage, querySearch]);

  const handleViewDetail = (row) => {
    if (onViewDetail) {
      onViewDetail(row);
      return;
    }
    navigate(`/services/${row.id}`);
  };

  const canGoPrev = useMemo(() => currentPage > 1, [currentPage]);
  const canGoNext = useMemo(
    () => (pagination ? currentPage < pagination.last_page : false),
    [currentPage, pagination]
  );

  const setPage = (page) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('page', String(page));
    setSearchParams(nextParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const applySearch = () => {
    const nextParams = new URLSearchParams(searchParams);
    const trimmed = search.trim();
    if (trimmed) {
      nextParams.set('search', trimmed);
    } else {
      nextParams.delete('search');
    }
    nextParams.set('page', '1');
    setSearchParams(nextParams);
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
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                applySearch();
              }
            }}
          />
          <i className="bi bi-search" onClick={applySearch} role="button" tabIndex={0} />
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

      {isLoading && <div className="admin-service-loading">Loading services...</div>}

      {!isLoading && error && (
        <div className="admin-service-error">
          <p>Failed to load services: {error}</p>
          <button type="button" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      )}

      {!isLoading && !error && (
        <>
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

            {rows.map((row) => (
              <div className="admin-service-row" key={row.id}>
                <div className="admin-code">{row.code}</div>
                <div>{row.device}</div>
                <div>{row.model}</div>
                <div>{row.service}</div>
                <div>{row.location}</div>
                <div>
                  <input className="admin-date-input" type="text" value={row.date} readOnly />
                </div>
                <div className="admin-cost">{row.cost}</div>
                <div className="admin-status">{row.status}</div>
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

            {rows.length === 0 && (
              <div className="admin-service-empty">No service requests found.</div>
            )}
          </div>

          {pagination && pagination.last_page > 1 && (
            <div className="admin-pagination">
              <button
                className="admin-pagination-btn"
                type="button"
                onClick={() => setPage(currentPage - 1)}
                disabled={!canGoPrev}
              >
                <i className="bi bi-chevron-left"></i>
                Prev
              </button>

              <span className="admin-pagination-info">
                Page {pagination.current_page} of {pagination.last_page}
              </span>

              <button
                className="admin-pagination-btn"
                type="button"
                onClick={() => setPage(currentPage + 1)}
                disabled={!canGoNext}
              >
                Next
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ServiceList;
