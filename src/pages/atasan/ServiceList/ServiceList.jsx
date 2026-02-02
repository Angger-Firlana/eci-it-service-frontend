import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './ServiceList.css';
import eyeIcon from '../../../assets/icons/lihatdetail(eye).svg';
import { authenticatedRequest } from '../../../lib/api';
import {
  getServiceRequestCostsTotalCached,
  getServiceRequestDetailCached,
  getServiceRequestLocationsCached,
} from '../../../lib/serviceRequestCache';
import { PageHeader, SearchBox, TablePagination } from '../../../components/ui';
import globalCache from '../../../lib/globalCache';

const PER_PAGE = 10;

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '-';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
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

const normalizeListPayload = (responseData) => {
  const data = responseData?.data || responseData;
  const items = Array.isArray(data) ? data : data?.data || [];
  const meta = data?.meta || responseData?.meta || null;
  return { items, meta };
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
  return '-';
};

const needsDetailFetch = (item) => {
  const firstDetail = item?.service_request_details?.[0];
  return !firstDetail || !firstDetail.device || !firstDetail.service_type;
};

const ServiceList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const querySearch = searchParams.get('search') || '';

  const [search, setSearch] = useState(querySearch);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setSearch(querySearch);
  }, [querySearch]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const fetchServices = async () => {
      const cacheKey = `atasan-service-list:${currentPage}:${querySearch}`;
      const cached = globalCache.get(cacheKey);

      if (cached) {
        setRows(cached.rows || []);
        setPagination(cached.pagination || null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');

      console.log('[Atasan/ServiceList] Fetching page', currentPage);

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
          throw new Error(getErrorMessage(response.data, 'Gagal memuat daftar service'));
        }

        const { items, meta } = normalizeListPayload(response.data);
        const baseItems = items.filter((item) => item && item.id);

        console.log('[Atasan/ServiceList] Received', baseItems.length, 'items');

        // Enrich with details, locations, and costs
        const details = await Promise.all(
          baseItems.map(async (item) => {
            if (!needsDetailFetch(item)) return item;
            try {
              return await getServiceRequestDetailCached(item.id, {
                signal: controller.signal,
              });
            } catch (err) {
              if (err?.name === 'AbortError') return item;
              console.error('[Atasan/ServiceList] Detail fetch error:', item.id, err);
              return item;
            }
          })
        );

        const detailIds = details.map((item) => item?.id).filter(Boolean);

        const [locationsList, costsTotals] = await Promise.all([
          Promise.all(
            detailIds.map((id) =>
              getServiceRequestLocationsCached(id, { signal: controller.signal })
            )
          ),
          Promise.all(
            detailIds.map((id) =>
              getServiceRequestCostsTotalCached(id, { signal: controller.signal })
            )
          ),
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
        const paginationData = meta
          ? {
              current_page: meta.current_page,
              last_page: meta.last_page,
              total: meta.total,
            }
          : null;

        setRows(computedRows);
        setPagination(paginationData);
        globalCache.set(cacheKey, { rows: computedRows, pagination: paginationData }, 30_000);

        console.log('[Atasan/ServiceList] Loaded successfully');
      } catch (err) {
        if (cancelled) return;
        if (err?.name === 'AbortError') return;
        console.error('[Atasan/ServiceList] Fetch error:', err);
        setError(getErrorMessage(err, 'Gagal memuat daftar service'));
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
    <div className="atasan-service-list">
      <PageHeader className="atasan-service-header" title="Service List" />

      <div className="atasan-service-controls">
        <SearchBox
          className="atasan-search-box"
          placeholder="Cari service..."
          ariaLabel="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onSearch={applySearch}
        />

        <div className="atasan-filter-group">
          <button className="atasan-filter-btn" type="button" disabled>
            <i className="bi bi-calendar3"></i>
            <span>Date</span>
            <i className="bi bi-chevron-down"></i>
          </button>
          <button className="atasan-filter-btn" type="button" disabled>
            <i className="bi bi-funnel"></i>
            <span>Status</span>
            <i className="bi bi-chevron-down"></i>
          </button>
        </div>
      </div>

      {isLoading && <div className="atasan-inbox-loading">Memuat daftar service...</div>}

      {!isLoading && error && (
        <div className="atasan-inbox-error">
          <p>{error}</p>
          <button type="button" onClick={() => window.location.reload()}>
            Coba Lagi
          </button>
        </div>
      )}

      {!isLoading && !error && (
        <>
          <div className="atasan-service-table">
            <div className="atasan-service-row atasan-service-head">
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

            {rows.length === 0 ? (
              <div className="atasan-inbox-empty">Tidak ada service request</div>
            ) : (
              rows.map((row) => (
                <div className="atasan-service-row" key={row.id}>
                  <div className="atasan-code" data-label="Kode">{row.code}</div>
                  <div data-label="Perangkat">{row.device}</div>
                  <div data-label="Model">{row.model}</div>
                  <div data-label="Service">{row.service}</div>
                  <div data-label="Lokasi">{row.location}</div>
                  <div data-label="Tanggal">
                    <input className="atasan-date-input" type="text" value={row.date} readOnly />
                  </div>
                  <div className="atasan-cost" data-label="Biaya">{row.cost}</div>
                  <div className="atasan-status" data-label="Status">{row.status}</div>
                  <div className="atasan-actions" data-label="Aksi">
                    <button className="atasan-ellipsis" type="button" aria-label="Menu" disabled>
                      ...
                    </button>
                    <button
                      className="atasan-detail-btn"
                      type="button"
                      onClick={() => handleViewDetail(row)}
                    >
                      <img src={eyeIcon} alt="Detail" />
                      Detail
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {pagination && pagination.last_page > 1 && (
            <TablePagination
              wrapperClassName="atasan-pagination"
              buttonClassName="atasan-pagination-btn"
              infoClassName="atasan-pagination-info"
              currentPage={pagination.current_page}
              totalPages={pagination.last_page}
              onPrev={() => setPage(currentPage - 1)}
              onNext={() => setPage(currentPage + 1)}
              disablePrev={!canGoPrev}
              disableNext={!canGoNext}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ServiceList;
