import React, { useMemo } from 'react';
import './Calendar.css';

const Calendar = () => {
  const daysInMonth = 31;
  const startDayIndex = 4;
  const selectedDay = 17;

  const days = useMemo(() => {
    const blanks = Array.from({ length: startDayIndex }, () => null);
    const dates = Array.from({ length: daysInMonth }, (_, index) => index + 1);
    return [...blanks, ...dates];
  }, []);

  return (
    <div className="calendar-page">
      <h1>Kalender</h1>

      <div className="calendar-grid">
        <section className="calendar-card">
          <div className="calendar-header">
            <button className="calendar-nav" type="button" aria-label="Prev">
              <i className="bi bi-chevron-left"></i>
            </button>
            <div className="calendar-month">Januari 2026</div>
            <button className="calendar-nav" type="button" aria-label="Next">
              <i className="bi bi-chevron-right"></i>
            </button>
          </div>

          <div className="calendar-weekdays">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          <div className="calendar-days">
            {days.map((day, index) => (
              <div
                key={`${day || 'empty'}-${index}`}
                className={`calendar-day ${
                  day === selectedDay ? 'selected' : ''
                } ${day ? '' : 'empty'}`}
              >
                {day || ''}
              </div>
            ))}
          </div>
        </section>

        <aside className="calendar-side">
          <div className="side-date">17 Januari 2026</div>
          <div className="side-card">
            <div className="side-title-row">
              <span>Laptop</span>
              <span className="side-status">Menunggu Approve</span>
            </div>
            <div className="side-sub">Lenovo V14</div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Calendar;
