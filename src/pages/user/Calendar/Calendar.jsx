import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './Calendar.css';
import { authenticatedRequest } from '../../../lib/api';
import { useServiceCache } from '../../../contexts/ServiceCacheContext';

const Calendar = () => {
  const navigate = useNavigate();
  const { serviceListCache, updateCache, isCacheValid } = useServiceCache();
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    const fetchServices = async () => {
      if (serviceListCache && isCacheValid()) {
        setServices(serviceListCache);
        return;
      }

      setIsLoading(true);
      try {
        const response = await authenticatedRequest('/service-requests?per_page=100');
        if (response.ok && response.data) {
          const data = response.data.data || response.data;
          const servicesData = Array.isArray(data) ? data : data.data || [];
          setServices(servicesData);
          updateCache(servicesData);
        }
      } catch (err) {
        console.error('Calendar fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, [serviceListCache, updateCache, isCacheValid]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const eventsByDate = useMemo(() => {
    const events = {};

    services.forEach((service) => {
      if (service.created_at) {
        const date = new Date(service.created_at);
        if (date.getFullYear() === year && date.getMonth() === month) {
          const day = date.getDate();
          if (!events[day]) events[day] = [];
          events[day].push({
            type: 'created',
            service,
            date: service.created_at,
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
                      day === selectedDay ? 'selected' : ''
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
                    <div className="side-sub">
                      {event.service.service_type?.name || '-'}
                    </div>
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
