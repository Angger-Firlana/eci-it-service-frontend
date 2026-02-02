import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../user/Calendar/Calendar.css';
import { authenticatedRequest, unwrapApiData } from '../../../lib/api';
import { getServiceRequestDetailCached } from '../../../lib/serviceRequestCache';
import { PageHeader } from '../../../components/ui';
import globalCache from '../../../lib/globalCache';

// Vendor approval status IDs (entity_type_id = 2)
const APPROVAL_STATUS = {
  PENDING: 15,
  APPROVED: 16,
  REJECTED: 17,
};

const normalizeApprovalList = (payload) => {
  const data = unwrapApiData(payload);
  if (Array.isArray(data)) return data;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const Calendar = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const fetchApprovalServices = async () => {
      const cacheKey = 'atasan-calendar:services';
      const cached = globalCache.get(cacheKey);

      if (cached) {
        setServices(cached.services || cached);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      console.log('[Atasan/Calendar] Fetching approval services...');

      try {
        // Fetch all approval statuses
        const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
          authenticatedRequest(`/inbox-approvals/${APPROVAL_STATUS.PENDING}`, {
            signal: controller.signal,
          }),
          authenticatedRequest(`/inbox-approvals/${APPROVAL_STATUS.APPROVED}`, {
            signal: controller.signal,
          }),
          authenticatedRequest(`/inbox-approvals/${APPROVAL_STATUS.REJECTED}`, {
            signal: controller.signal,
          }),
        ]);

        if (cancelled) return;

        // Merge all approvals
        const allApprovals = [
          ...(pendingRes.ok ? normalizeApprovalList(pendingRes.data) : []),
          ...(approvedRes.ok ? normalizeApprovalList(approvedRes.data) : []),
          ...(rejectedRes.ok ? normalizeApprovalList(rejectedRes.data) : []),
        ];

        // Get unique service request IDs
        const serviceIds = new Set();
        for (const approval of allApprovals) {
          if (approval?.service_request_id) {
            serviceIds.add(approval.service_request_id);
          }
        }

        console.log('[Atasan/Calendar] Found', serviceIds.size, 'unique services');

        // Fetch service details
        const serviceDetails = await Promise.all(
          Array.from(serviceIds).map(async (id) => {
            try {
              return await getServiceRequestDetailCached(id, {
                signal: controller.signal,
              });
            } catch (err) {
              if (err?.name === 'AbortError') throw err;
              console.error('[Atasan/Calendar] Failed to fetch service:', id, err);
              return null;
            }
          })
        );

        if (cancelled) return;

        // Filter out nulls and add approval info
        const enrichedServices = serviceDetails
          .filter(Boolean)
          .map((service) => {
            // Find the approval for this service
            const approval = allApprovals.find(
              (a) => a.service_request_id === service.id
            );
            return {
              ...service,
              _approvalStatus: approval?.status_id,
              _approvalDate: approval?.created_at,
              _approvedAt: approval?.approved_at,
            };
          });

        setServices(enrichedServices);
        globalCache.set(cacheKey, { services: enrichedServices }, 2 * 60 * 1000);
        console.log('[Atasan/Calendar] Loaded', enrichedServices.length, 'services');
      } catch (err) {
        if (err?.name === 'AbortError') return;
        if (cancelled) return;
        console.error('[Atasan/Calendar] Fetch error:', err);
        setServices([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchApprovalServices();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const eventsByDate = useMemo(() => {
    const events = {};

    services.forEach((service) => {
      // Event: Request created
      const createdDate = service.request_date || service.created_at;
      if (createdDate) {
        const date = new Date(createdDate);
        if (date.getFullYear() === year && date.getMonth() === month) {
          const day = date.getDate();
          if (!events[day]) events[day] = [];
          events[day].push({
            type: 'created',
            service,
            date: createdDate,
          });
        }
      }

      // Event: Approval date (when assigned to atasan)
      if (service._approvalDate) {
        const date = new Date(service._approvalDate);
        if (date.getFullYear() === year && date.getMonth() === month) {
          const day = date.getDate();
          if (!events[day]) events[day] = [];
          // Avoid duplicate entries for same service on same day
          const existing = events[day].find(
            (e) => e.service.id === service.id && e.type === 'assigned'
          );
          if (!existing) {
            events[day].push({
              type: 'assigned',
              service,
              date: service._approvalDate,
            });
          }
        }
      }

      // Event: Approved date
      if (service._approvedAt && service._approvalStatus === APPROVAL_STATUS.APPROVED) {
        const date = new Date(service._approvedAt);
        if (date.getFullYear() === year && date.getMonth() === month) {
          const day = date.getDate();
          if (!events[day]) events[day] = [];
          events[day].push({
            type: 'approved',
            service,
            date: service._approvedAt,
          });
        }
      }
    });

    return events;
  }, [services, year, month]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const blanks = Array.from({ length: firstDay }, () => null);
    const dates = Array.from({ length: daysInMonth }, (_, index) => index + 1);
    return [...blanks, ...dates];
  }, [year, month]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1));
    setSelectedDay(null);
  };

  const handleDayClick = (day) => {
    if (day && eventsByDate[day]) {
      setSelectedDay(day);
    }
  };

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const selectedEvents = selectedDay ? eventsByDate[selectedDay] || [] : [];

  const getServiceLabel = (service) => {
    const detail = service.service_request_details?.[0];
    const deviceModel = detail?.device?.device_model;
    const deviceTypeName =
      detail?.device?.device_type?.name ||
      deviceModel?.device_type?.name ||
      '';
    const modelName = deviceModel
      ? `${deviceModel.brand} ${deviceModel.model}`
      : '';
    const serviceName = detail?.service_type?.name || '';

    if (modelName && serviceName) {
      return `${deviceTypeName ? `${deviceTypeName} ` : ''}${modelName} - ${serviceName}`;
    }
    return (
      `${deviceTypeName ? `${deviceTypeName} ` : ''}${modelName || serviceName || ''}`
    ).trim() || 'Service Request';
  };

  const getEventTypeLabel = (type) => {
    switch (type) {
      case 'created':
        return 'Created';
      case 'assigned':
        return 'Assigned';
      case 'approved':
        return 'Approved';
      default:
        return type;
    }
  };

  return (
    <div className="calendar-page">
      <PageHeader title="Kalender" />

      {isLoading && (
        <div className="calendar-loading">Memuat kalender...</div>
      )}

      {!isLoading && (
        <div className="calendar-grid">
          <section className="calendar-card">
            <div className="calendar-header">
              <button className="calendar-nav" type="button" onClick={handlePrevMonth}>
                <i className="bi bi-chevron-left"></i>
              </button>
              <div className="calendar-month">
                {monthNames[month]} {year}
              </div>
              <button className="calendar-nav" type="button" onClick={handleNextMonth}>
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>

            <div className="calendar-weekdays">
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            <div className="calendar-days">
              {calendarDays.map((day, index) => {
                const hasEvent = day && eventsByDate[day];
                const hasCreated = hasEvent && eventsByDate[day].some(e => e.type === 'created');
                const hasApproved = hasEvent && eventsByDate[day].some(e => e.type === 'approved');
                const hasAssigned = hasEvent && eventsByDate[day].some(e => e.type === 'assigned');

                return (
                  <div
                    key={`${day || 'empty'}-${index}`}
                    className={`calendar-day ${
                      day && day === selectedDay ? 'selected' : ''
                    } ${day ? '' : 'empty'} ${hasEvent ? 'has-event' : ''} ${
                      hasCreated ? 'event-created' : ''
                    } ${hasApproved ? 'event-approved' : ''} ${
                      hasAssigned && !hasCreated ? 'event-created' : ''
                    }`}
                    onClick={() => handleDayClick(day)}
                  >
                    {day || ''}
                  </div>
                );
              })}
            </div>

            <div className="calendar-legend">
              <div className="legend-item">
                <span className="legend-dot event-created"></span>
                <span>Request / Assigned</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot event-approved"></span>
                <span>Approved</span>
              </div>
            </div>
          </section>

          <aside className="calendar-side">
            {selectedDay && selectedEvents.length > 0 ? (
              <>
                <div className="side-date">
                  {selectedDay} {monthNames[month]} {year}
                </div>
                {selectedEvents.map((event, index) => (
                  <div
                    key={`${event.service.id}-${event.type}-${index}`}
                    className="side-card"
                    onClick={() => navigate(`/inbox/${event.service.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="side-title-row">
                      <span>
                        {event.service.service_number || `SR-${event.service.id}`}
                      </span>
                      <span className={`side-status event-${event.type === 'approved' ? 'approved' : 'created'}`}>
                        {getEventTypeLabel(event.type)}
                      </span>
                    </div>
                    <div className="side-sub">{getServiceLabel(event.service)}</div>
                    <div className="side-desc">
                      {event.service.service_request_details?.[0]?.complaint || ''}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="side-empty">
                {selectedDay
                  ? 'Tidak ada event pada tanggal ini'
                  : 'Klik tanggal dengan event untuk melihat detail'}
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
};

export default Calendar;
