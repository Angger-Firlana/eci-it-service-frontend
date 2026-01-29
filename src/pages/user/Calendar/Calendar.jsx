import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './Calendar.css';
import { authenticatedRequest } from '../../../lib/api';
import { useServiceCache } from '../../../contexts/ServiceCacheContext';
import { useAuth } from '../../../contexts/AuthContext';
import { getServiceRequestDetailCached } from '../../../lib/serviceRequestCache';

const Calendar = () => {
  const navigate = useNavigate();
  const { calendarCache, updateCalendarCache, isCalendarCacheValid } = useServiceCache();
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    const needsDetailFetch = (item) => {
      const firstDetail = item.service_request_details?.[0];
      return !firstDetail || !firstDetail.service_type || !firstDetail.device;
    };

    const enrichServices = async (items) => {
      const enriched = await Promise.all(
        items.map(async (item) => {
          if (!needsDetailFetch(item)) {
            return item;
          }

          try {
            return await getServiceRequestDetailCached(item.id);
          } catch (err) {
            console.error('Calendar detail fetch error:', err);
          }

          return item;
        })
      );

      return enriched;
    };

    const fetchServices = async () => {
      if (calendarCache && isCalendarCacheValid()) {
        setServices(calendarCache);
        if (calendarCache.some(needsDetailFetch)) {
          enrichServices(calendarCache).then((enriched) => {
            setServices(enriched);
            updateCalendarCache(enriched);
          });
        }
        return;
      }

      setIsLoading(true);
      try {
        const userId = user?.id;
        const userFilter = userId ? `&user_id=${userId}` : '';
        const response = await authenticatedRequest(`/service-requests?per_page=100${userFilter}`);
        if (response.ok && response.data) {
          const data = response.data.data || response.data;
          const servicesData = Array.isArray(data) ? data : data.data || [];
          const enrichedServices = await enrichServices(servicesData);
          setServices(enrichedServices);
          updateCalendarCache(enrichedServices);
        }
      } catch (err) {
        console.error('Calendar fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, [calendarCache, updateCalendarCache, isCalendarCacheValid, user?.id]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const eventsByDate = useMemo(() => {
    const events = {};

    services.forEach((service) => {
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

      // Check for approval dates from service_request_approvals
      if (service.service_request_approvals && service.service_request_approvals.length > 0) {
        service.service_request_approvals.forEach(approval => {
          if (approval.created_at) {
            const date = new Date(approval.created_at);
            if (date.getFullYear() === year && date.getMonth() === month) {
              const day = date.getDate();
              if (!events[day]) events[day] = [];
              events[day].push({
                type: 'approved',
                service,
                date: approval.created_at,
              });
            }
          }
        });
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
    const serviceName = detail?.service_type?.name || service.service_type?.name || '';

    if (modelName && serviceName) {
      return `${deviceTypeName ? `${deviceTypeName} ` : ''}${modelName} - ${serviceName}`;
    }
    return (
      `${deviceTypeName ? `${deviceTypeName} ` : ''}${modelName || serviceName || ''}`
    ).trim();
  };

  return (
    <div className="calendar-page">
      <h1>Kalender</h1>

      {isLoading && (
        <div className="calendar-loading">Loading calendar data...</div>
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

                return (
                  <div
                    key={`${day || 'empty'}-${index}`}
                    className={`calendar-day ${
                      day && day === selectedDay ? 'selected' : ''
                    } ${day ? '' : 'empty'} ${hasEvent ? 'has-event' : ''} ${
                      hasCreated ? 'event-created' : ''
                    } ${hasApproved ? 'event-approved' : ''}`}
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
                <span>Request Created</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot event-approved"></span>
                <span>Request Approved</span>
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
                    key={index}
                    className="side-card"
                    onClick={() => navigate(`/services/${event.service.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="side-title-row">
                      <span>
                        {event.service.service_number || `SR-${event.service.id}`}
                      </span>
                      <span className={`side-status event-${event.type}`}>
                        {event.type === 'created' ? 'Created' : 'Approved'}
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
                  ? 'No events on this date'
                  : 'Click a date with events to view details'}
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
};

export default Calendar;
