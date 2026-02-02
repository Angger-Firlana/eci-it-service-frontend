import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Inbox.css';
import eyeIcon from '../../../assets/icons/lihatdetail(eye).svg';
import { authenticatedRequest, unwrapApiData } from '../../../lib/api';
import { getStatusMapsCached } from '../../../lib/referenceCache';
import { getServiceRequestDetailCached } from '../../../lib/serviceRequestCache';
import globalCache from '../../../lib/globalCache';
import { PageHeader, SearchBox } from '../../../components/ui';

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const getDeviceLabel = (item) => {
  const firstDetail = item?.service_request_details?.[0];
  const device = firstDetail?.device;
  const deviceModel = device?.device_model;
  return (
    device?.device_type?.name ||
    deviceModel?.device_type?.name ||
    firstDetail?.device_type?.name ||
    '-'
  );
};

const getModelLabel = (item) => {
  const firstDetail = item?.service_request_details?.[0];
  const device = firstDetail?.device;
  const deviceModel = device?.device_model;
  const brand = deviceModel?.brand || firstDetail?.brand || '';
  const model = deviceModel?.model || firstDetail?.model || '';
  return [brand, model].filter(Boolean).join(' ') || '-';
};

const getServiceLabel = (item) => {
  const firstDetail = item?.service_request_details?.[0];
  return firstDetail?.service_type?.name || '-';
};

const needsDetailFetch = (item) => {
  const firstDetail = item?.service_request_details?.[0];
  return !firstDetail || !firstDetail.device || !firstDetail.service_type;
};

const normalizeListPayload = (payload) => {
  const data = unwrapApiData(payload);
  if (Array.isArray(data)) return { items: data, meta: payload?.meta || null };
  if (Array.isArray(payload?.data)) return { items: payload.data, meta: payload?.meta || null };
  if (Array.isArray(payload?.data?.data)) return { items: payload.data.data, meta: payload?.meta || null };
  return { items: [], meta: null };
};

const Inbox = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusById, setStatusById] = useState(new Map());
  const [serviceStatusIds, setServiceStatusIds] = useState(null);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((row) => {
      const fields = [
        row?.service_number,
        row?.user?.name,
        getDeviceLabel(row),
        getModelLabel(row),
        getServiceLabel(row),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return fields.includes(query);
    });
  }, [items, search]);

  useEffect(() => {
    let mounted = true;

    const initStatuses = async () => {
      try {
        const allStatuses = await getStatusMapsCached();
        const serviceStatuses = await getStatusMapsCached({ entityTypeId: 1 });
        if (!mounted) return;

        setStatusById(allStatuses.byId);
        setServiceStatusIds({
          PENDING: serviceStatuses.byCode.get('PENDING')?.id,
          IN_REVIEW_ADMIN: serviceStatuses.byCode.get('IN_REVIEW_ADMIN')?.id,
          APPROVED_BY_ADMIN: serviceStatuses.byCode.get('APPROVED_BY_ADMIN')?.id,
          REJECTED_BY_ABOVE: serviceStatuses.byCode.get('REJECTED_BY_ABOVE')?.id,
          NEED_REVISION: serviceStatuses.byCode.get('NEED_REVISION')?.id,
        });
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Gagal memuat data status');
      }
    };

    initStatuses();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!serviceStatusIds) return;
    const controller = new AbortController();
    let cancelled = false;

    const fetchInbox = async () => {
      // Check cache first
      const cacheKey = 'admin-inbox:list';
      const cached = globalCache.get(cacheKey);
      
      if (cached) {
        setItems(cached.items);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const statusIds = Object.values(serviceStatusIds).filter(Boolean);
        const requests = statusIds.map((id) =>
          authenticatedRequest(`/service-requests?status_id=${id}&per_page=30`, {
            signal: controller.signal,
          })
        );

        const responses = await Promise.all(requests);
        const list = [];
        const seen = new Set();

        for (const res of responses) {
          if (!res.ok) continue;
          const { items: resItems } = normalizeListPayload(res.data);
          for (const item of resItems) {
            if (!item?.id || seen.has(item.id)) continue;
            seen.add(item.id);
            list.push(item);
          }
        }

        list.sort((a, b) => {
          const aTime = new Date(a?.created_at || a?.request_date || 0).getTime();
          const bTime = new Date(b?.created_at || b?.request_date || 0).getTime();
          return bTime - aTime;
        });

        const enriched = await Promise.all(
          list.map(async (item) => {
            if (!needsDetailFetch(item)) return item;
            try {
              return await getServiceRequestDetailCached(item.id, {
                signal: controller.signal,
              });
            } catch (err) {
              if (err?.name === 'AbortError') return item;
              return item;
            }
          })
        );

        if (!cancelled) {
          setItems(enriched);
          // Cache the result (30s for inbox)
          globalCache.set(cacheKey, { items: enriched }, 30_000);
        }
      } catch (err) {
        if (err?.name === 'AbortError') return;
        if (!cancelled) {
          setError(err.message || 'Gagal memuat inbox');
          setItems([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchInbox();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [serviceStatusIds]);

  return (
    <div className="admin-inbox-page">
      <PageHeader className="admin-inbox-header" title="Inbox Request" />

      <div className="admin-inbox-controls">
        <SearchBox
          className="admin-search-box"
          placeholder="Cari request"
          ariaLabel="Search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <button className="admin-filter-btn" type="button" disabled>
          <i className="bi bi-funnel"></i>
          <span>Departemen</span>
          <i className="bi bi-chevron-down"></i>
        </button>
      </div>

      {error && <div className="admin-inbox-error">{error}</div>}

      {isLoading ? (
        <div className="admin-inbox-loading">Loading...</div>
      ) : (
        <div className="admin-inbox-table">
          <div className="admin-inbox-row admin-inbox-head">
            <div>Kode</div>
            <div>Perangkat</div>
            <div>Model</div>
            <div>Service</div>
            <div>Tanggal</div>
            <div>Status</div>
            <div></div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="admin-inbox-empty">Tidak ada item</div>
          ) : (
            filteredItems.map((row) => {
              const status = statusById.get(Number(row?.status_id)) || row?.status;
              return (
                <div className="admin-inbox-row" key={row.id}>
                  <div className="admin-code" data-label="Kode">{row.service_number || `SR-${row.id}`}</div>
                  <div data-label="Perangkat">{getDeviceLabel(row)}</div>
                  <div data-label="Model">{getModelLabel(row)}</div>
                  <div data-label="Service">{getServiceLabel(row)}</div>
                  <div data-label="Tanggal">
                    <input
                      className="admin-date-input"
                      type="text"
                      value={formatDate(row.request_date || row.created_at)}
                      readOnly
                    />
                  </div>
                  <div className="admin-status" data-label="Status">{status?.name || '-'}</div>
                  <div className="admin-actions" data-label="Aksi">
                    <button className="admin-ellipsis" type="button" aria-label="Menu" disabled>
                      ...
                    </button>
                    <button
                      className="admin-detail-btn"
                      type="button"
                      onClick={() => navigate(`/inbox/${row.id}`)}
                    >
                      <img src={eyeIcon} alt="Detail" />
                      Detail
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default Inbox;
