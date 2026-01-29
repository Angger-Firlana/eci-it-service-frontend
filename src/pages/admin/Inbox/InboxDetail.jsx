import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './InboxDetail.css';
import backIcon from '../../../assets/icons/back.svg';
import { Modal } from '../../../components/common';
import { authenticatedRequest, unwrapApiData } from '../../../lib/api';
import {
  getCostTypesCached,
  getStatusMapsCached,
  getVendorsCached,
} from '../../../lib/referenceCache';
import {
  getServiceRequestDetailCached,
  getServiceRequestLocationsCached,
  invalidateServiceRequestCache,
} from '../../../lib/serviceRequestCache';

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

const formatDateShort = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const normalizeArrayPayload = (payload) => {
  const data = unwrapApiData(payload);
  if (Array.isArray(data)) return data;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
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
    brand: deviceModel?.brand || firstDetail?.brand || '-',
    model: deviceModel?.model || firstDetail?.model || '-',
    serviceType: firstDetail?.service_type?.name || '-',
    serialNumber: device?.serial_number || firstDetail?.serial_number || '-',
    complaint: firstDetail?.complaint || '-',
  };
};

const getErrorMessage = (payload, fallback) => {
  if (!payload) return fallback;
  if (typeof payload === 'string') {
    if (payload.includes('condition_type') && payload.includes('ApprovalPolicyStep')) {
      return (
        'Backend error: Approval policy eager-load references a missing relationship on ApprovalPolicyStep.\n' +
        'Fix needed in API (remove approval_policy_steps.condition_type eager load).'
      );
    }
    return payload;
  }
  if (typeof payload?.message === 'string' && payload.message) return payload.message;
  if (payload?.errors && typeof payload.errors === 'object') {
    const lines = [];
    for (const [key, value] of Object.entries(payload.errors)) {
      lines.push(`${key}: ${Array.isArray(value) ? value.join(', ') : String(value)}`);
    }
    if (lines.length) return lines.join('\n');
  }
  return fallback;
};

const parseCurrencyNumber = (value) => {
  if (value === null || value === undefined) return 0;
  const digits = String(value).replace(/[^0-9]/g, '');
  return digits ? Number(digits) : 0;
};

const AdminInboxDetail = ({ onBack } = {}) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [detail, setDetail] = useState(null);
  const [locations, setLocations] = useState([]);
  const [costs, setCosts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [costTypes, setCostTypes] = useState([]);
  const [serviceStatusById, setServiceStatusById] = useState(new Map());
  const [serviceStatusByCode, setServiceStatusByCode] = useState(new Map());
  const [allStatusById, setAllStatusById] = useState(new Map());

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [actionNote, setActionNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [isLocationModalOpen, setLocationModalOpen] = useState(false);
  const [locationType, setLocationType] = useState('internal');
  const [locationForm, setLocationForm] = useState({
    estimatedDate: '',
    vendorId: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    mapsUrl: '',
    serviceFee: '',
    cancellationFee: '',
    costNotes: '',
  });
  const [locationError, setLocationError] = useState('');

  const [isApprovalModalOpen, setApprovalModalOpen] = useState(false);
  const [approverOptions, setApproverOptions] = useState([]);
  const [selectedApprovers, setSelectedApprovers] = useState(new Set());
  const [approvalError, setApprovalError] = useState('');
  const [pendingVendorSubmit, setPendingVendorSubmit] = useState(null);

  const refresh = async () => {
    if (!id) return;
    setIsLoading(true);
    setError('');
    try {
      const [detailData, locationsData] = await Promise.all([
        getServiceRequestDetailCached(id),
        getServiceRequestLocationsCached(id),
      ]);

      const costsRes = await authenticatedRequest(`/service-requests/${id}/costs`);
      const costsData = costsRes.ok ? normalizeArrayPayload(costsRes.data) : [];

      setDetail(detailData);
      setLocations(Array.isArray(locationsData) ? locationsData : []);
      setCosts(costsData);
    } catch (err) {
      setDetail(null);
      setLocations([]);
      setCosts([]);
      setError(err.message || 'Gagal memuat detail request');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const [allStatuses, serviceStatuses, vendorsList, costTypeList] =
          await Promise.all([
            getStatusMapsCached(),
            getStatusMapsCached({ entityTypeId: 1 }),
            getVendorsCached(),
            getCostTypesCached(),
          ]);
        if (!mounted) return;

        setAllStatusById(allStatuses.byId);
        setServiceStatusById(serviceStatuses.byId);
        setServiceStatusByCode(serviceStatuses.byCode);
        setVendors(Array.isArray(vendorsList) ? vendorsList : []);
        setCostTypes(Array.isArray(costTypeList) ? costTypeList : []);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Gagal memuat referensi');
      }
    };

    init();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const serviceStatus = useMemo(() => {
    if (!detail) return null;
    return serviceStatusById.get(Number(detail.status_id)) || null;
  }, [detail, serviceStatusById]);

  const serviceStatusCode = serviceStatus?.code || '';
  const needsAdminApprove =
    serviceStatusCode === 'PENDING' || serviceStatusCode === 'IN_REVIEW_ADMIN';
  const needsLocationSet = serviceStatusCode === 'APPROVED_BY_ADMIN';

  const activeLocation = useMemo(
    () => getActiveLocation(locations),
    [locations]
  );

  const deviceInfo = useMemo(() => getDeviceInfo(detail), [detail]);

  const departmentLabel =
    detail?.user?.departments?.[0]?.name || detail?.user?.department?.name || '-';

  const vendorOptionById = useMemo(() => {
    const map = new Map();
    for (const vendor of vendors) {
      if (!vendor?.id) continue;
      map.set(String(vendor.id), vendor);
    }
    return map;
  }, [vendors]);

  const costTypeByCode = useMemo(() => {
    const map = new Map();
    for (const ct of costTypes) {
      if (ct?.code) map.set(String(ct.code), ct);
    }
    return map;
  }, [costTypes]);

  const existingCostsByCode = useMemo(() => {
    const map = new Map();
    for (const cost of costs) {
      const code = cost?.cost_type?.code;
      if (code) map.set(String(code), cost);
    }
    return map;
  }, [costs]);

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

  const timelineItems = useMemo(() => {
    const auditLogs = Array.isArray(detail?.audit_logs) ? detail.audit_logs : [];
    const auditById = new Map();
    for (const log of auditLogs) {
      if (!log?.id) continue;
      auditById.set(Number(log.id), log);
    }

    // Prefer backend-built timeline for consistency across pages.
    if (Array.isArray(detail?.timeline) && detail.timeline.length) {
      const normalized = [...detail.timeline].sort((a, b) => {
        const aTime = new Date(a?.created_at || a?.date || 0).getTime();
        const bTime = new Date(b?.created_at || b?.date || 0).getTime();
        return aTime - bTime;
      });
      return normalized.map((item) => ({
        id: item?.id || `${item?.label}-${item?.date}`,
        label: (() => {
          const baseLabel = item?.label || item?.status || 'Update';
          if (baseLabel !== 'Status diubah') return baseLabel;
          const log = item?.id ? auditById.get(Number(item.id)) : null;
          const newStatusId = log?.new_status_id;
          const status = newStatusId != null ? allStatusById.get(Number(newStatusId)) : null;
          return status?.name || baseLabel;
        })(),
        date: formatDateTime(item?.date || item?.created_at),
        note: item?.note || item?.description || '-',
        state: item?.state || 'active',
      }));
    }

    const logs = Array.isArray(detail?.audit_logs) ? [...detail.audit_logs] : [];
    logs.sort((a, b) => {
      const aTime = new Date(a?.created_at || 0).getTime();
      const bTime = new Date(b?.created_at || 0).getTime();
      return aTime - bTime;
    });

    return logs.map((log) => {
      const newStatus =
        log?.new_status_id != null
          ? allStatusById.get(Number(log.new_status_id))
          : null;

      const actorName = log?.actor?.name || 'Unknown';

      let label = newStatus?.name || log?.action || 'Update';
      let note = log?.notes || '-';

      if (log?.action === 'CREATE_REQUEST') {
        label = newStatus?.name || 'Request dibuat';
        note = `Request dibuat oleh ${actorName}`;
      }

      if (log?.action === 'APPROVE_VENDOR') {
        label = 'Approval Atasan';
        note = `Disetujui oleh ${actorName}`;
      }

      if (log?.action === 'UPDATE_VENDOR_APPROVAL') {
        label = 'Approval Atasan';
      }

      return {
        id: log?.id || `${log?.action}-${log?.created_at}`,
        label,
        date: formatDateTime(log?.created_at),
        note,
        state: 'active',
      };
    });
  }, [allStatusById, detail?.audit_logs, detail?.timeline]);

  const setLocationFormValue = (field) => (event) => {
    const value = event?.target?.value;
    setLocationForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const openLocationModal = () => {
    setLocationError('');

    const nextType =
      activeLocation?.location_type === 'external' ? 'external' : 'internal';

    const serviceFee = existingCostsByCode.get('SERVICE_FEE')?.amount;
    const cancellationFee = existingCostsByCode.get('CANCELLATION')?.amount;

    setLocationType(nextType);
    setLocationForm({
      estimatedDate: detail?.estimated_date
        ? String(detail.estimated_date).slice(0, 10)
        : '',
      vendorId: activeLocation?.vendor_id ? String(activeLocation.vendor_id) : '',
      address: activeLocation?.address || '',
      city: activeLocation?.city || '',
      province: activeLocation?.province || '',
      postalCode: activeLocation?.postal_code || '',
      mapsUrl: activeLocation?.maps_url || '',
      serviceFee: serviceFee != null ? String(serviceFee) : '',
      cancellationFee: cancellationFee != null ? String(cancellationFee) : '',
      costNotes: '',
    });
    setLocationModalOpen(true);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    navigate('/inbox');
  };

  const handleAdminApprove = async () => {
    if (!id) return;
    const approvedByAdminId = serviceStatusByCode.get('APPROVED_BY_ADMIN')?.id;
    if (!approvedByAdminId) {
      setError('Status APPROVED_BY_ADMIN tidak ditemukan');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      // Use PUT so we always get an audit log entry.
      // The dedicated /approved-by-admin endpoint currently throws 500 in some environments.
      const res = await authenticatedRequest(`/service-requests/${id}`, {
        method: 'PUT',
        body: {
          status_id: Number(approvedByAdminId),
          log_notes: actionNote.trim() || 'Request di-approve oleh admin',
        },
      });
      if (!res.ok) {
        throw new Error(getErrorMessage(res.data, 'Gagal approve request'));
      }

      invalidateServiceRequestCache(id);
      await refresh();
      setActionNote('');
      setLocationModalOpen(true);
    } catch (err) {
      setError(err.message || 'Gagal approve request');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdminReject = async () => {
    if (!id) return;
    const rejectedId = serviceStatusByCode.get('REJECTED')?.id;
    if (!rejectedId) {
      setError('Status REJECTED tidak ditemukan');
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      const res = await authenticatedRequest(`/service-requests/${id}`, {
        method: 'PUT',
        body: {
          status_id: Number(rejectedId),
          log_notes: actionNote.trim() || 'Request ditolak oleh admin',
        },
      });
      if (!res.ok) {
        throw new Error(getErrorMessage(res.data, 'Gagal reject request'));
      }

      invalidateServiceRequestCache(id);
      await refresh();
      setActionNote('');
    } catch (err) {
      setError(err.message || 'Gagal reject request');
    } finally {
      setIsSaving(false);
    }
  };

  const upsertCost = async (serviceRequestId, costTypeCode, amount, description) => {
    const costType = costTypeByCode.get(costTypeCode);
    if (!costType?.id) {
      throw new Error(`Cost type ${costTypeCode} tidak ditemukan`);
    }

    const existing = existingCostsByCode.get(costTypeCode);
    const payload = {
      cost_type_id: Number(costType.id),
      amount: Number(amount),
      description: description || null,
    };

    if (existing?.id) {
      const res = await authenticatedRequest(
        `/service-requests/${serviceRequestId}/costs/${existing.id}`,
        {
          method: 'PUT',
          body: payload,
        }
      );
      if (!res.ok) {
        throw new Error(getErrorMessage(res.data, 'Gagal update biaya'));
      }
      return;
    }

    const res = await authenticatedRequest(`/service-requests/${serviceRequestId}/costs`, {
      method: 'POST',
      body: payload,
    });
    if (!res.ok) {
      throw new Error(getErrorMessage(res.data, 'Gagal tambah biaya'));
    }
  };

  const fetchApproverOptions = async (serviceRequestId) => {
    const res = await authenticatedRequest(`/service-requests/${serviceRequestId}/approver`);
    if (!res.ok) {
      throw new Error(getErrorMessage(res.data, 'Gagal memuat list atasan'));
    }
    const data = unwrapApiData(res.data) || {};
    const list = Array.isArray(data?.approvers) ? data.approvers : [];
    return { list, raw: data };
  };

  const handleSaveLocation = async () => {
    if (!id) return;
    setLocationError('');
    setIsSaving(true);

    try {
      const estimatedDate = String(locationForm.estimatedDate || '').trim();
      if (!estimatedDate) {
        throw new Error('Estimasi tanggal selesai wajib diisi');
      }

      if (locationType === 'internal') {
        const locationRes = await authenticatedRequest(`/service-requests/${id}/locations`, {
          method: 'POST',
          body: {
            location_type: 'internal',
            is_active: true,
          },
        });

        if (!locationRes.ok) {
          throw new Error(getErrorMessage(locationRes.data, 'Gagal set lokasi workshop'));
        }

        const inProgressId = serviceStatusByCode.get('IN_PROGRESS')?.id;
        if (!inProgressId) {
          throw new Error('Status IN_PROGRESS tidak ditemukan');
        }

        const updateRes = await authenticatedRequest(`/service-requests/${id}`, {
          method: 'PUT',
          body: {
            status_id: Number(inProgressId),
            estimated_date: estimatedDate,
            log_notes: 'Diset ke workshop (internal)',
          },
        });
        if (!updateRes.ok) {
          throw new Error(getErrorMessage(updateRes.data, 'Gagal update status'));
        }

        setLocationModalOpen(false);
        invalidateServiceRequestCache(id);
        await refresh();
        return;
      }

      // External vendor path
      const vendorId = String(locationForm.vendorId || '').trim();
      if (!vendorId) {
        throw new Error('Vendor wajib dipilih');
      }

      const address = String(locationForm.address || '').trim();
      const city = String(locationForm.city || '').trim();
      const province = String(locationForm.province || '').trim();
      const postalCode = String(locationForm.postalCode || '').trim();
      const mapsUrl = String(locationForm.mapsUrl || '').trim();
      if (!address || !city || !province || !postalCode || !mapsUrl) {
        throw new Error('Alamat vendor harus lengkap (alamat, kota, provinsi, kode pos, link maps)');
      }

      const normalizedMapsUrl = /^https?:\/\//i.test(mapsUrl)
        ? mapsUrl
        : `https://${mapsUrl}`;

      const fee = parseCurrencyNumber(locationForm.serviceFee);
      const cancelFee = parseCurrencyNumber(locationForm.cancellationFee);
      if (!fee) {
        throw new Error('Biaya service wajib diisi');
      }

      const locationRes = await authenticatedRequest(`/service-requests/${id}/locations`, {
        method: 'POST',
        body: {
          location_type: 'external',
          vendor_id: Number(vendorId),
          address,
          city,
          province,
          postal_code: postalCode,
          maps_url: normalizedMapsUrl,
          is_active: true,
        },
      });
      if (!locationRes.ok) {
        throw new Error(getErrorMessage(locationRes.data, 'Gagal set lokasi vendor'));
      }

      await upsertCost(id, 'SERVICE_FEE', fee, locationForm.costNotes);
      if (cancelFee) {
        await upsertCost(id, 'CANCELLATION', cancelFee, locationForm.costNotes);
      }

      const { list: approvers } = await fetchApproverOptions(id);
      if (!approvers.length) {
        throw new Error('Tidak ada atasan tersedia untuk approval');
      }

      setApproverOptions(approvers);
      setSelectedApprovers((prev) => {
        if (prev.size) return prev;
        const next = new Set();
        const pickCount = Math.min(2, approvers.length);
        for (let i = 0; i < pickCount; i += 1) {
          if (approvers[i]?.id) next.add(String(approvers[i].id));
        }
        return next;
      });
      setPendingVendorSubmit({
        estimatedDate,
        logNotes: locationForm.costNotes,
      });

      setLocationModalOpen(false);
      setApprovalError('');
      setApprovalModalOpen(true);
    } catch (err) {
      setLocationError(err.message || 'Gagal menyimpan lokasi');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleApprover = (approverId) => {
    setSelectedApprovers((prev) => {
      const next = new Set(prev);
      if (next.has(approverId)) next.delete(approverId);
      else next.add(approverId);
      return next;
    });
  };

  const handleSaveApprovers = async () => {
    if (!id) return;
    setApprovalError('');
    setIsSaving(true);

    try {
      const approvers = Array.from(selectedApprovers)
        .map((v) => Number(v))
        .filter(Boolean);

      if (!approvers.length) {
        throw new Error('Pilih minimal 1 atasan');
      }

      const hasExisting = Array.isArray(detail?.vendor_approvals) && detail.vendor_approvals.length > 0;
      const method = hasExisting ? 'PUT' : 'POST';

      const res = await authenticatedRequest(`/service-requests/${id}/approvals`, {
        method,
        body: { approvers },
      });
      if (!res.ok) {
        throw new Error(getErrorMessage(res.data, 'Gagal menyimpan approval atasan'));
      }

      const inReviewAboveId = serviceStatusByCode.get('IN_REVIEW_ABOVE')?.id;
      if (!inReviewAboveId) {
        throw new Error('Status IN_REVIEW_ABOVE tidak ditemukan');
      }

      const updateRes = await authenticatedRequest(`/service-requests/${id}`, {
        method: 'PUT',
        body: {
          status_id: Number(inReviewAboveId),
          estimated_date: pendingVendorSubmit?.estimatedDate,
          log_notes:
            pendingVendorSubmit?.logNotes || 'Menunggu approval atasan (vendor)',
        },
      });
      if (!updateRes.ok) {
        throw new Error(getErrorMessage(updateRes.data, 'Gagal update status'));
      }

      setApprovalModalOpen(false);
      setPendingVendorSubmit(null);

      invalidateServiceRequestCache(id);
      await refresh();
    } catch (err) {
      setApprovalError(err.message || 'Gagal menyimpan approval');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="admin-inbox-detail">
        <div className="admin-detail-loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-inbox-detail">
        <div className="admin-detail-error">
          <p>{error}</p>
          <button type="button" onClick={handleBack}>
            Kembali
          </button>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="admin-inbox-detail">
        <div className="admin-detail-error">
          <p>Request tidak ditemukan</p>
          <button type="button" onClick={handleBack}>
            Kembali
          </button>
        </div>
      </div>
    );
  }

  const serviceNumber = detail.service_number || `SR-${detail.id}`;
  const createdAt = formatDateTime(detail.request_date || detail.created_at);

  const vendorLabel = activeLocation?.vendor?.name
    ? activeLocation.vendor.name
    : activeLocation?.vendor_id
      ? vendorOptionById.get(String(activeLocation.vendor_id))?.name
      : '';

  const placeLabel =
    activeLocation?.location_type === 'external'
      ? vendorLabel || 'Vendor'
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
        ? 'Workshop IT'
        : '-';

  return (
    <div className="admin-inbox-detail">
      <div className="admin-detail-header">
        <button className="admin-detail-back" type="button" onClick={handleBack}>
          <img src={backIcon} alt="Back" />
        </button>
        <div className="admin-detail-title">
          <h1>{serviceNumber}</h1>
          <p>Dibuat pada tanggal {createdAt}</p>
        </div>
      </div>

      <div className="admin-inbox-grid">
        <div className="admin-inbox-left">
          <section className="admin-detail-card">
            <div className="admin-detail-card-head">
              <h2>Detail Request</h2>
              <span className="admin-detail-dept">{departmentLabel}</span>
            </div>

            <div className="admin-detail-row">
              <span className="admin-detail-key">Requester</span>
              <span className="admin-detail-value">{detail.user?.name || '-'}</span>
            </div>
            <div className="admin-detail-row">
              <span className="admin-detail-key">Perangkat</span>
              <span className="admin-detail-value">{deviceInfo.deviceType}</span>
            </div>
            <div className="admin-detail-row">
              <span className="admin-detail-key">Merk</span>
              <span className="admin-detail-value">{deviceInfo.brand}</span>
            </div>
            <div className="admin-detail-row">
              <span className="admin-detail-key">Model</span>
              <span className="admin-detail-value">{deviceInfo.model}</span>
            </div>
            <div className="admin-detail-row">
              <span className="admin-detail-key">Jenis Service</span>
              <span className="admin-detail-value">{deviceInfo.serviceType}</span>
            </div>
            <div className="admin-detail-row">
              <span className="admin-detail-key">Serial Number</span>
              <span className="admin-detail-value">{deviceInfo.serialNumber}</span>
            </div>

            <div className="admin-detail-notes">
              <span className="admin-detail-key">Keterangan</span>
              <div className="admin-detail-text">{deviceInfo.complaint}</div>
            </div>

            <div className="admin-detail-row">
              <span className="admin-detail-key">Status</span>
              <span className="admin-detail-value">{serviceStatus?.name || '-'}</span>
            </div>

            {activeLocation && (
              <>
                <div className="admin-detail-row">
                  <span className="admin-detail-key">Tempat service</span>
                  <span className="admin-detail-value">{placeLabel}</span>
                </div>

                <div className="admin-detail-location">
                  <div className="admin-detail-location-head">
                    <span className="admin-detail-key">Lokasi Service</span>
                  </div>
                  <div className="admin-detail-address">{addressLabel || '-'}</div>
                </div>
              </>
            )}

            {detail.estimated_date && (
              <div className="admin-detail-row">
                <span className="admin-detail-key">Estimasi Selesai</span>
                <span className="admin-detail-value">
                  {formatDateShort(detail.estimated_date)}
                </span>
              </div>
            )}
          </section>
        </div>

        <div className="admin-inbox-right">
          {needsAdminApprove && (
            <section className="admin-action-card">
              <h2>Aksi</h2>
              <label className="admin-action-label" htmlFor="admin-action-note">
                Keterangan (opsional)
              </label>
              <textarea
                id="admin-action-note"
                className="admin-action-textarea"
                rows={4}
                value={actionNote}
                onChange={(event) => setActionNote(event.target.value)}
              />

              <div className="admin-action-buttons">
                <button
                  className="admin-action-reject"
                  type="button"
                  onClick={handleAdminReject}
                  disabled={isSaving}
                >
                  Reject
                </button>
                <button
                  className="admin-action-approve"
                  type="button"
                  onClick={handleAdminApprove}
                  disabled={isSaving}
                >
                  Approve
                </button>
              </div>
            </section>
          )}

          {needsLocationSet && (
            <section className="admin-action-card">
              <h2>Set Lokasi Service</h2>
              <button
                className="admin-action-primary"
                type="button"
                onClick={openLocationModal}
              >
                <i className="bi bi-geo-alt"></i>
                Set Lokasi
              </button>
            </section>
          )}

          {vendorApprovals.length > 0 && approvalSummary && (
            <section className="admin-approval-card">
              <div className="admin-approval-head">
                <div>
                  <h2>Status Approval</h2>
                  <p>Menunggu approval dari atasan</p>
                </div>
                <button
                  className="admin-detail-edit"
                  type="button"
                  onClick={async () => {
                    setApprovalError('');
                    try {
                      const { list: approvers } = await fetchApproverOptions(id);
                      setApproverOptions(approvers);
                      setSelectedApprovers(
                        new Set(vendorApprovals.map((a) => String(a.approver_id)).filter(Boolean))
                      );
                      setPendingVendorSubmit({
                        estimatedDate: detail?.estimated_date
                          ? String(detail.estimated_date).slice(0, 10)
                          : null,
                        logNotes: 'Update approval atasan',
                      });
                      setApprovalModalOpen(true);
                    } catch (err) {
                      setError(err.message || 'Gagal memuat atasan');
                    }
                  }}
                >
                  <i className="bi bi-pencil"></i>
                </button>
              </div>

              <div className="admin-approval-progress">
                <div className="admin-approval-bar">
                  <span
                    className="admin-approval-bar-fill"
                    style={{ width: `${approvalSummary.progress}%` }}
                  ></span>
                </div>
                <span className="admin-approval-count">{approvalSummary.summary}</span>
              </div>

              <div className="admin-approval-list">
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
                        ? 'Unapprove'
                        : 'Waiting';

                  return (
                    <div
                      className={`admin-approval-item admin-approval-${state}`}
                      key={item.id}
                    >
                      <div>
                        <div className="admin-approval-name">
                          {item.approver?.name || '-'}
                        </div>
                        {item.notes && (
                          <div className="admin-approval-note">{item.notes}</div>
                        )}
                      </div>
                      <span className="admin-approval-status">{statusLabel}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="admin-timeline-card">
            <h2>Timeline</h2>
            <div className="admin-timeline-list">
              {timelineItems.length === 0 ? (
                <div className="admin-timeline-empty">Belum ada aktivitas</div>
              ) : (
                timelineItems.map((item, index) => (
                  <div className="admin-timeline-item" key={item.id}>
                    <div className="admin-timeline-marker">
                      <span className={`admin-timeline-dot ${item.state}`}></span>
                      {index < timelineItems.length - 1 && (
                        <span className={`admin-timeline-line ${item.state}`}></span>
                      )}
                    </div>
                    <div className="admin-timeline-content">
                      <span className={`admin-timeline-tag ${item.state || 'active'}`}>
                        {item.label}
                      </span>
                      <span className="admin-timeline-date">{item.date}</span>
                      <span className="admin-timeline-desc">{item.note}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      <Modal
        isOpen={isLocationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        className="admin-modal"
      >
        <button
          className="admin-modal-close"
          type="button"
          onClick={() => setLocationModalOpen(false)}
        >
          <i className="bi bi-x"></i>
        </button>
        <h2>Pilih Lokasi Service</h2>
        <p>Set lokasi service dan estimasi tanggal selesai</p>

        {locationError && <div className="admin-modal-error">{locationError}</div>}

        <div className="admin-modal-options">
          <label className="admin-modal-option">
            <input
              type="radio"
              checked={locationType === 'internal'}
              onChange={() => setLocationType('internal')}
            />
            Workshop IT (Internal)
          </label>
          <label className="admin-modal-option">
            <input
              type="radio"
              checked={locationType === 'external'}
              onChange={() => setLocationType('external')}
            />
            Vendor (Eksternal)
          </label>
        </div>

        <div className="admin-modal-field">
          <label>Estimasi Tanggal Selesai</label>
          <div className="admin-modal-input">
            <input
              type="date"
              value={locationForm.estimatedDate}
              onChange={setLocationFormValue('estimatedDate')}
            />
            <i className="bi bi-calendar3"></i>
          </div>
        </div>

        {locationType === 'external' && (
          <>
            <div className="admin-modal-field">
              <label>Vendor</label>
              <select
                value={locationForm.vendorId}
                onChange={setLocationFormValue('vendorId')}
              >
                <option value="">Pilih vendor</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-modal-field">
              <label>Alamat</label>
              <input
                type="text"
                placeholder="Contoh: Sudirman Central Business District"
                value={locationForm.address}
                onChange={setLocationFormValue('address')}
              />
            </div>

            <div className="admin-modal-field">
              <label>Kota</label>
              <input
                type="text"
                placeholder="Contoh: Jakarta"
                value={locationForm.city}
                onChange={setLocationFormValue('city')}
              />
            </div>

            <div className="admin-modal-field">
              <label>Provinsi</label>
              <input
                type="text"
                placeholder="Contoh: DKI Jakarta"
                value={locationForm.province}
                onChange={setLocationFormValue('province')}
              />
            </div>

            <div className="admin-modal-field">
              <label>Kode Pos</label>
              <input
                type="text"
                placeholder="Contoh: 12345"
                value={locationForm.postalCode}
                onChange={setLocationFormValue('postalCode')}
              />
            </div>

            <div className="admin-modal-field">
              <label>Link Maps</label>
              <input
                type="url"
                placeholder="https://maps.google.com/?q=..."
                value={locationForm.mapsUrl}
                onChange={setLocationFormValue('mapsUrl')}
              />
            </div>

            <div className="admin-modal-field">
              <label>Biaya Service</label>
              <div className="admin-modal-input">
                <span>Rp</span>
                <input
                  type="text"
                  value={locationForm.serviceFee}
                  onChange={setLocationFormValue('serviceFee')}
                />
              </div>
            </div>

            <div className="admin-modal-field">
              <label>Biaya Cancel (opsional)</label>
              <div className="admin-modal-input">
                <span>Rp</span>
                <input
                  type="text"
                  value={locationForm.cancellationFee}
                  onChange={setLocationFormValue('cancellationFee')}
                />
              </div>
            </div>

            <div className="admin-modal-field">
              <label>Keterangan Biaya (opsional)</label>
              <textarea
                placeholder="Jelaskan detail biaya"
                value={locationForm.costNotes}
                onChange={setLocationFormValue('costNotes')}
              ></textarea>
            </div>
          </>
        )}

        <div className="admin-modal-actions">
          <button
            className="admin-modal-cancel"
            type="button"
            onClick={() => setLocationModalOpen(false)}
            disabled={isSaving}
          >
            Batal
          </button>
          <button
            className="admin-modal-save"
            type="button"
            onClick={handleSaveLocation}
            disabled={isSaving}
          >
            Simpan
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={isApprovalModalOpen}
        onClose={() => setApprovalModalOpen(false)}
        className="admin-modal"
      >
        <button
          className="admin-modal-close"
          type="button"
          onClick={() => setApprovalModalOpen(false)}
        >
          <i className="bi bi-x"></i>
        </button>
        <h2>Edit Approval</h2>
        <p>Pilih atasan yang akan approve</p>

        {approvalError && <div className="admin-modal-error">{approvalError}</div>}

        <div className="admin-modal-checklist">
          {approverOptions.map((person) => {
            const pid = person?.id ? String(person.id) : '';
            if (!pid) return null;
            return (
              <label key={pid} className="admin-modal-check">
                <input
                  type="checkbox"
                  checked={selectedApprovers.has(pid)}
                  onChange={() => toggleApprover(pid)}
                />
                {person.name}
              </label>
            );
          })}
        </div>

        <div className="admin-modal-actions">
          <button
            className="admin-modal-cancel"
            type="button"
            onClick={() => setApprovalModalOpen(false)}
            disabled={isSaving}
          >
            Batal
          </button>
          <button
            className="admin-modal-save"
            type="button"
            onClick={handleSaveApprovers}
            disabled={isSaving}
          >
            Simpan
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminInboxDetail;
