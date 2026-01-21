import React, { useMemo } from 'react';
import './Calendar.css';

const Calendar = () => {
  const daysInMonth = 31;
  const startDayIndex = 4;
  const selectedDay = 17;
  const eventDates = [17];

  const days = useMemo(() => {
    const blanks = Array.from({ length: startDayIndex }, () => null);
    const dates = Array.from({ length: daysInMonth }, (_, index) => index + 1);
    return [...blanks, ...dates];
  }, []);

  return (
    <div className="admin-calendar-page">
      <h1>Kalender</h1>

      <div className="admin-calendar-grid">
        <section className="admin-calendar-card">
          <div className="admin-calendar-header">
            <button className="admin-calendar-nav" type="button" aria-label="Prev">
              <i className="bi bi-chevron-left"></i>
            </button>
            <div className="admin-calendar-month">Januari 2026</div>
            <button className="admin-calendar-nav" type="button" aria-label="Next">
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
              const hasEvent = day && eventDates.includes(day);
              return (
                <div
                  key={`${day || 'empty'}-${index}`}
                  className={`admin-calendar-day ${
                    day === selectedDay ? 'selected' : ''
                  } ${day ? '' : 'empty'} ${hasEvent ? 'has-event' : ''}`}
                >
                  {day || ''}
                </div>
              );
            })}
          </div>
        </section>

        <aside className="admin-calendar-side">
          <div className="admin-side-date">17 Januari 2026</div>
          <div className="admin-side-card">
            <div className="admin-side-title-row">
              <span>Laptop</span>
              <span className="admin-side-status">Menunggu Approve</span>
            </div>
            <div className="admin-side-sub">Lenovo V14</div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Calendar;
