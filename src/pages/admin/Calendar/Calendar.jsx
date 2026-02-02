import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Calendar.css';
import { authenticatedRequest } from '../../../lib/api';
import { getStatusMapsCached } from '../../../lib/referenceCache';
import { getServiceRequestDetailCached } from '../../../lib/serviceRequestCache';
import globalCache from '../../../lib/globalCache';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const Calendar = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusByCode, setStatusByCode] = useState(new Map());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get action type and color for event
  const getEventAction = (event) => {
    const status = event?.status;
    const statusCode = status?.code || '';
    const statusName = status?.name || '';
    const statusId = event?.status_id;
    
    console.log('[Calendar] Event status DEBUG:', { 
      id: event?.id, 
      status, 
      statusCode, 
      statusName,
      statusId,
      fullEvent: event 
    });
    
    // Try status code first, then fall back to status name matching
    if (statusCode === 'PENDING' || statusCode === 'IN_REVIEW_ADMIN' || 
        statusName.includes('Pending') || statusName.includes('Review')) {
      return { text: 'Menunggu Approve', color: 'approve', type: 'approve' }; // Red
    }
    if (statusCode === 'APPROVED_BY_ADMIN' || statusName.includes('Approved by Admin')) {
      return { text: 'Set Lokasi', color: 'location', type: 'location' }; // Green
    }
    if (statusCode === 'IN_REVIEW_ABOVE' || statusName.includes('Review Above')) {
      return { text: 'Set Atasan', color: 'atasan', type: 'atasan' }; // Blue
    }
    if (statusCode === 'IN_PROGRESS' || statusCode === 'APPROVED_BY_ABOVE' || 
        statusName.includes('Progress') || statusName.includes('Approved by Above')) {
      return { text: 'Selesaikan', color: 'complete', type: 'complete' }; // Purple
    }
    if (statusCode === 'COMPLETED' || statusName.includes('Completed')) {
      return { text: 'Selesai', color: 'completed', type: 'completed' }; // Gray
    }
    
    // Fallback - show status name if available
    if (statusName) {
      return { text: statusName, color: 'default', type: 'default' };
    }
    
    return { text: 'Detail', color: 'default', type: 'default' };
  };

  const getDeviceInfo = (event) => {
    const firstDetail = event?.service_request_details?.[0];
    const device = firstDetail?.device;
    const deviceModel = device?.device_model;
    
    // Try multiple sources for device type
    const deviceType = 
      device?.device_type?.name || 
      deviceModel?.device_type?.name || 
      firstDetail?.device_type?.name ||
      'Perangkat';
    
    // Try multiple sources for brand/model
    const brand = deviceModel?.brand || firstDetail?.brand || '';
    const model = deviceModel?.model || firstDetail?.model || '';
    const modelLabel = [brand, model].filter(Boolean).join(' ');
    
    console.log('[Calendar] Device info:', {
      eventId: event?.id,
      deviceType,
      brand,
      model,
      modelLabel,
      firstDetail,
      device,
      deviceModel,
    });
    
    return {
      title: deviceType,
      subtitle: modelLabel || 'Model tidak tersedia',
    };
  };

  // Fetch events
  useEffect(() => {
    let mounted = true;

    const fetchStatuses = async () => {
      try {
        const statusMaps = await getStatusMapsCached({ entityTypeId: 1 });
        if (!mounted) return;
        setStatusByCode(statusMaps.byCode);
      } catch (err) {
        console.error('Failed to load statuses:', err);
      }
    };

    fetchStatuses();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      // Check cache first
      const cacheKey = `admin-calendar:${year}-${month}`;
      const cached = globalCache.get(cacheKey);
      
      if (cached) {
        setEvents(cached.events);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        // Fetch service requests for current month
        const response = await authenticatedRequest(
          `/service-requests?per_page=100`
        );

        if (!response.ok) {
          throw new Error(response.data?.message || 'Failed to fetch calendar events');
        }

        const data = response.data?.data || response.data;
        const items = Array.isArray(data) ? data : data?.data || [];
        
        // Enrich items with full details if needed
        const needsDetailFetch = (item) => {
          const firstDetail = item?.service_request_details?.[0];
          return !firstDetail || !firstDetail.device || !firstDetail.service_type;
        };

        const enrichedItems = await Promise.all(
          items.map(async (item) => {
            if (!needsDetailFetch(item)) return item;
            try {
              return await getServiceRequestDetailCached(item.id);
            } catch (err) {
              console.error('Calendar detail fetch error:', err);
              return item;
            }
          })
        );
        
        setEvents(enrichedItems);
        
        // Cache for 5 minutes
        globalCache.set(cacheKey, { events: enrichedItems }, 5 * 60 * 1000);
      } catch (err) {
        console.error('Calendar fetch error:', err);
        setError(err.message || 'Failed to load calendar');
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (statusByCode.size > 0) {
      fetchEvents();
    }
  }, [year, month, statusByCode]);

  // Calendar days calculation
  const { days, startDayIndex, daysInMonth } = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayIndex = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const blanks = Array.from({ length: startDayIndex }, () => null);
    const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    return {
      days: [...blanks, ...dates],
      startDayIndex,
      daysInMonth,
    };
  }, [year, month]);

  // Get events for a specific date
  const getEventsForDate = (day) => {
    if (!day) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    return events.filter(event => {
      const eventDate = event.request_date || event.created_at || event.estimated_date;
      if (!eventDate) return false;
      const eventDateStr = eventDate.split('T')[0];
      return eventDateStr === dateStr;
    });
  };

  // Events for selected date
  const selectedDateEvents = useMemo(() => {
    const day = selectedDate.getDate();
    const isCurrentMonth = 
      selectedDate.getFullYear() === year && 
      selectedDate.getMonth() === month;
    
    if (!isCurrentMonth) return [];
    return getEventsForDate(day);
  }, [selectedDate, events, year, month]);

  // Format selected date
  const selectedDateStr = useMemo(() => {
    const day = selectedDate.getDate();
    const monthName = MONTHS[selectedDate.getMonth()];
    const year = selectedDate.getFullYear();
    return `${day} ${monthName} ${year}`;
  }, [selectedDate]);

  // Navigate month
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Select date
  const handleDateClick = (day) => {
    if (!day) return;
    setSelectedDate(new Date(year, month, day));
  };

  // Navigate to detail
  const handleEventClick = (event) => {
    navigate(`/inbox/detail/${event.id}`);
  };

  return (
    <div className="admin-calendar-page">
      <h1>Kalender</h1>

      <div className="admin-calendar-grid">
        <section className="admin-calendar-card">
          <div className="admin-calendar-header">
            <button 
              className="admin-calendar-nav" 
              type="button" 
              onClick={handlePrevMonth}
              aria-label="Prev"
            >
              <i className="bi bi-chevron-left"></i>
            </button>
            <div className="admin-calendar-month">{MONTHS[month]} {year}</div>
            <button 
              className="admin-calendar-nav" 
              type="button" 
              onClick={handleNextMonth}
              aria-label="Next"
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          </div>

          <div className="admin-calendar-weekdays">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          <div className="admin-calendar-days">
            {days.map((day, index) => {
              const dayEvents = getEventsForDate(day);
              const hasEvent = dayEvents.length > 0;
              const isSelected = day && 
                selectedDate.getDate() === day &&
                selectedDate.getMonth() === month &&
                selectedDate.getFullYear() === year;
              
              return (
                <div
                  key={`${day || 'empty'}-${index}`}
                  className={`admin-calendar-day ${
                    isSelected ? 'selected' : ''
                  } ${day ? '' : 'empty'} ${hasEvent ? 'has-event' : ''}`}
                  onClick={() => handleDateClick(day)}
                  style={{ cursor: day ? 'pointer' : 'default' }}
                >
                  {day || ''}
                </div>
              );
            })}
          </div>
        </section>

        <aside className="admin-calendar-side">
          <div className="admin-side-date">{selectedDateStr}</div>
          
          {isLoading && (
            <div className="admin-side-loading">Loading...</div>
          )}
          
          {!isLoading && selectedDateEvents.length === 0 && (
            <div className="admin-side-empty">Tidak ada event</div>
          )}
          
          {!isLoading && selectedDateEvents.map((event) => {
            const deviceInfo = getDeviceInfo(event);
            const action = getEventAction(event);
            
            return (
              <div 
                key={event.id} 
                className="admin-side-card"
                onClick={() => handleEventClick(event)}
                style={{ cursor: 'pointer' }}
              >
                <div className="admin-side-title-row">
                  <span>{deviceInfo.title}</span>
                  <span className={`admin-side-status ${action.color}`}>
                    {action.text}
                  </span>
                </div>
                <div className="admin-side-sub">{deviceInfo.subtitle}</div>
              </div>
            );
          })}
        </aside>
      </div>
    </div>
  );
};

export default Calendar;
