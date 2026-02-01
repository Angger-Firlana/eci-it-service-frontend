import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Calendar.css';
import { apiRequest, unwrapApiData, parseApiError } from '../../../lib/api';
import { formatDate, toISODate } from '../../../lib/formatters';
import { fetchDeviceModels, fetchDeviceTypes } from '../../../lib/referenceApi';
import { getDeviceSummary, getPrimaryDetail } from '../../../lib/serviceRequestUtils';

const Calendar = () => {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [requests, setRequests] = useState([]);
  const [deviceModels, setDeviceModels] = useState([]);
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadReferences = async () => {
      try {
        const [models, types] = await Promise.all([
          fetchDeviceModels(),
          fetchDeviceTypes(),
        ]);
        setDeviceModels(models);
        setDeviceTypes(types);
      } catch (err) {
        setError(err.message || 'Gagal memuat referensi perangkat.');
      }
    };
    loadReferences();
  }, []);

  useEffect(() => {
    const fetchRequests = async () => {
      setError('');
      try {
        const dateParam = toISODate(selectedDate);
        const res = await apiRequest(`/service-requests?request_date=${dateParam}`);
        if (!res.ok || res.data?.success === false) {
          throw new Error(parseApiError(res.data, 'Gagal mengambil data kalender.'));
        }
        const payload = unwrapApiData(res.data);
        setRequests(Array.isArray(payload) ? payload : []);
      } catch (err) {
        setError(err.message || 'Gagal mengambil data kalender.');
      }
    };
    fetchRequests();
  }, [selectedDate]);

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    return new Date(year, month + 1, 0).getDate();
  }, [currentMonth]);

  const startDayIndex = useMemo(() => {
    const day = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    ).getDay();
    return day;
  }, [currentMonth]);

  const days = useMemo(() => {
    const blanks = Array.from({ length: startDayIndex }, () => null);
    const dates = Array.from({ length: daysInMonth }, (_, index) => index + 1);
    return [...blanks, ...dates];
  }, [daysInMonth, startDayIndex]);

  const selectedLabel = formatDate(selectedDate);

  const mappedRequests = useMemo(() => {
    return requests.map((item) => {
      const detail = getPrimaryDetail(item);
      const deviceSummary = getDeviceSummary({
        detail,
        deviceModels,
        deviceTypes,
      });
      return {
        id: item.id,
        device: deviceSummary.deviceTypeName,
        model: deviceSummary.model,
        status: item.status?.name || '-',
      };
    });
  }, [deviceModels, deviceTypes, requests]);

  const handleMonthChange = (direction) => {
    setCurrentMonth((prev) => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + direction);
      return new Date(next.getFullYear(), next.getMonth(), 1);
    });
  };

  return (
    <div className="admin-calendar-page">
      <h1>Kalender</h1>

      {error && <div className="admin-calendar-error">{error}</div>}

      <div className="admin-calendar-grid">
        <section className="admin-calendar-card">
          <div className="admin-calendar-header">
            <button
              className="admin-calendar-nav"
              type="button"
              aria-label="Prev"
              onClick={() => handleMonthChange(-1)}
            >
              <i className="bi bi-chevron-left"></i>
            </button>
            <div className="admin-calendar-month">
              {currentMonth.toLocaleDateString('id-ID', {
                month: 'long',
                year: 'numeric',
              })}
            </div>
            <button
              className="admin-calendar-nav"
              type="button"
              aria-label="Next"
              onClick={() => handleMonthChange(1)}
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
              const isSelected =
                day &&
                selectedDate.getDate() === day &&
                selectedDate.getMonth() === currentMonth.getMonth() &&
                selectedDate.getFullYear() === currentMonth.getFullYear();
              return (
                <button
                  type="button"
                  key={`${day || 'empty'}-${index}`}
                  className={`admin-calendar-day ${
                    isSelected ? 'selected' : ''
                  } ${day ? '' : 'empty'}`}
                  onClick={() => {
                    if (!day) return;
                    setSelectedDate(
                      new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth(),
                        day
                      )
                    );
                  }}
                  disabled={!day}
                >
                  {day || ''}
                </button>
              );
            })}
          </div>
        </section>

        <aside className="admin-calendar-side">
          <div className="admin-side-date">{selectedLabel}</div>
          {mappedRequests.length === 0 && (
            <div className="admin-side-empty">Tidak ada request.</div>
          )}
          {mappedRequests.map((item) => (
            <button
              className="admin-side-card"
              key={item.id}
              type="button"
              onClick={() => navigate(`/service-requests/${item.id}?from=calendar`)}
            >
              <div className="admin-side-title-row">
                <span>{item.device}</span>
                <span className="admin-side-status">{item.status}</span>
              </div>
              <div className="admin-side-sub">{item.model}</div>
            </button>
          ))}
        </aside>
      </div>
    </div>
  );
};

export default Calendar;
