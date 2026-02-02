import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../ServiceList/ServiceList.css';
import eyeIcon from '../../../assets/icons/lihatdetail(eye).svg';
import { authenticatedRequest, unwrapApiData } from '../../../lib/api';
import {
  getServiceRequestDetailCached,
  getServiceRequestCostsTotalCached,
  getServiceRequestLocationsCached,
} from '../../../lib/serviceRequestCache';
import { PageHeader, SearchBox } from '../../../components/ui';
import globalCache from '../../../lib/globalCache';

// Vendor approval status IDs (entity_type_id = 2)
const APPROVAL_STATUS = {
  PENDING: 15,
  APPROVED: 16,
  REJECTED: 17,
};

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

const normalizeApprovalList = (payload) => {
  const data = unwrapApiData(payload);
  if (Array.isArray(data)) return data;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const getDeviceLabel = (service) => {
  const firstDetail = service?.service_request_details?.[0];
  const device = firstDetail?.device;
  const deviceModel = device?.device_model;
  return (
    device?.device_type?.name ||
    deviceModel?.device_type?.name ||
    '-'
  );
};

const getModelLabel = (service) => {
  const firstDetail = service?.service_request_details?.[0];
  const deviceModel = firstDetail?.device?.device_model;
  const brand = deviceModel?.brand || '';
  const model = deviceModel?.model || '';
  return [brand, model].filter(Boolean).join(' ') || '-';
};

const getServiceLabel = (service) => {
  const firstDetail = service?.service_request_details?.[0];
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

const getApprovalStatusLabel = (statusId) => {
  switch (Number(statusId)) {
    case APPROVAL_STATUS.PENDING:
      return 'Menunggu Approval';
    case APPROVAL_STATUS.APPROVED:
      return 'Disetujui';
    case APPROVAL_STATUS.REJECTED:
      return 'Ditolak';
    default:
      return '-';
  }
};

const Inbox = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending'); // pending, approved, rejected, all
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((row) => {
      const fields = [
        row?.code,
        row?.device,
        row?.model,
        row?.service,
        row?.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return fields.includes(query);
    });
  }, [items, search]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const fetchInbox = async () => {
      const cacheKey = `atasan-inbox:${statusFilter}`;
      const cached = globalCache.get(cacheKey);

      if (cached) {
        setItems(cached.items || cached);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');

      console.log('[Atasan/Inbox] Fetching approvals with filter:', statusFilter);

      try {
        let statusIds = [];
        if (statusFilter === 'all') {
          statusIds = [APPROVAL_STATUS.PENDING, APPROVAL_STATUS.APPROVED, APPROVAL_STATUS.REJECTED];
        } else if (statusFilter === 'approved') {
          statusIds = [APPROVAL_STATUS.APPROVED];
        } else if (statusFilter === 'rejected') {
          statusIds = [APPROVAL_STATUS.REJECTED];
        } else {
          statusIds = [APPROVAL_STATUS.PENDING];
        }

        // Fetch all selected statuses
        const responses = await Promise.all(
          statusIds.map((id) =>
            authenticatedRequest(`/inbox-approvals/${id}`, {
              signal: controller.signal,
            })
          )
        );

        if (cancelled) return;

        // Merge and deduplicate
        const allApprovals = [];
        const seen = new Set();

        for (const res of responses) {
          if (!res.ok) continue;
          const list = normalizeApprovalList(res.data);
          for (const item of list) {
            if (!item?.id || seen.has(item.id)) continue;
            seen.add(item.id);
            allApprovals.push(item);
          }
        }

        console.log('[Atasan/Inbox] Received', allApprovals.length, 'approvals');

        // Sort by created_at descending
        allApprovals.sort((a, b) => {
          const aTime = new Date(a?.created_at || 0).getTime();
          const bTime = new Date(b?.created_at || 0).getTime();
          return bTime - aTime;
        });

        // Enrich with service details, locations, and costs
        const enrichedRows = await Promise.all(
          allApprovals.map(async (approval) => {
            const serviceRequestId = approval?.service_request_id;
            let service = approval?.service_request || {};
            let locations = [];
            let costTotal = 0;

            if (serviceRequestId) {
              try {
                const [detail, locs, cost] = await Promise.all([
                  getServiceRequestDetailCached(serviceRequestId, { signal: controller.signal }),
                  getServiceRequestLocationsCached(serviceRequestId, { signal: controller.signal }),
                  getServiceRequestCostsTotalCached(serviceRequestId, { signal: controller.signal }),
                ]);
                service = detail || service;
                locations = locs || [];
                costTotal = cost || 0;
              } catch (err) {
                if (err?.name === 'AbortError') throw err;
                console.error('[Atasan/Inbox] Failed to enrich:', serviceRequestId, err);
              }
            }

            return {
              id: serviceRequestId || approval?.id,
              approvalId: approval?.id,
              code: service?.service_number || `SR-${serviceRequestId}`,
              device: getDeviceLabel(service),
              model: getModelLabel(service),
              service: getServiceLabel(service),
              location: getLocationLabel(locations),
              date: formatDate(approval?.created_at || service?.request_date),
              cost: formatRupiah(costTotal),
              status: getApprovalStatusLabel(approval?.status_id),
              statusId: approval?.status_id,
              _original: { approval, service },
            };
          })
        );

        if (cancelled) return;
        setItems(enrichedRows);
        globalCache.set(cacheKey, { items: enrichedRows }, 30_000);
        console.log('[Atasan/Inbox] Inbox loaded successfully');
      } catch (err) {
        if (err?.name === 'AbortError') return;
        if (cancelled) return;

        console.error('[Atasan/Inbox] Fetch error:', err);
        setError(getErrorMessage(err, 'Gagal memuat inbox'));
        setItems([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchInbox();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [statusFilter]);

  const handleViewDetail = (row) => {
    navigate(`/inbox/${row.id}`);
  };

  return (
    <div className="atasan-service-list">
      <PageHeader className="atasan-service-header" title="Inbox Request" />

      <div className="atasan-service-controls">
        <SearchBox
          className="atasan-search-box"
          placeholder="Cari request..."
          ariaLabel="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="atasan-filter-group">
          <select
            className="atasan-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="pending">Menunggu Approval</option>
            <option value="approved">Disetujui</option>
            <option value="rejected">Ditolak</option>
            <option value="all">Semua Status</option>
          </select>
        </div>
      </div>

      {error && <div className="atasan-inbox-error">{error}</div>}

      {isLoading ? (
        <div className="atasan-inbox-loading">Memuat inbox...</div>
      ) : (
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

          {filteredItems.length === 0 ? (
            <div className="atasan-inbox-empty">
              {search ? 'Tidak ada hasil pencarian' : 'Tidak ada request di inbox'}
            </div>
          ) : (
            filteredItems.map((row) => (
              <div className="atasan-service-row" key={row.approvalId}>
                <div className="atasan-code" data-label="Kode">{row.code}</div>
                <div data-label="Perangkat">{row.device}</div>
                <div data-label="Model">{row.model}</div>
                <div data-label="Service">{row.service}</div>
                <div data-label="Lokasi">{row.location}</div>
                <div data-label="Tanggal">
                  <input
                    className="atasan-date-input"
                    type="text"
                    value={row.date}
                    readOnly
                  />
                </div>
                <div className="atasan-cost" data-label="Biaya">{row.cost}</div>
                <div
                  data-label="Status"
                  className={`atasan-status atasan-status-${row.statusId === APPROVAL_STATUS.PENDING ? 'pending' : row.statusId === APPROVAL_STATUS.APPROVED ? 'approved' : 'rejected'}`}
                >
                  {row.status}
                </div>
                <div className="atasan-actions" data-label="Aksi">
                  <button className="atasan-ellipsis" type="button" aria-label="Menu">
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
      )}
    </div>
  );
};

export default Inbox;
