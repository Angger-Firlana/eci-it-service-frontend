import React from 'react';
import './Inbox.css';
import eyeIcon from '../../../assets/icons/lihatdetail(eye).svg';

const INBOX_ROWS = [
  {
    id: 1,
    code: 'ABCD01',
    device: 'Laptop',
    model: 'Lenovo v14',
    service: 'Hardware',
    date: '6/1/2021',
    status: 'Menunggu approval',
    variant: 'approval',
  },
  {
    id: 2,
    code: 'ABCD02',
    device: 'Printer',
    model: 'Canon G2010',
    service: 'Hardware',
    date: '8/4/2026',
    status: 'Menunggu approval',
    variant: 'workshop',
  },
];

const Inbox = ({ onViewDetail }) => {
  return (
    <div className="admin-inbox-page">
      <div className="admin-inbox-header">
        <h1>Inbox Request</h1>
      </div>

      <div className="admin-inbox-controls">
        <div className="admin-search-box">
          <input type="text" placeholder="" aria-label="Search" />
          <i className="bi bi-search"></i>
        </div>

        <button className="admin-filter-btn" type="button">
          <i className="bi bi-funnel"></i>
          <span>Departemen</span>
          <i className="bi bi-chevron-down"></i>
        </button>
      </div>

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

        {INBOX_ROWS.map((row) => (
          <div className="admin-inbox-row" key={row.id}>
            <div className="admin-code">{row.code}</div>
            <div>{row.device}</div>
            <div>{row.model}</div>
            <div>{row.service}</div>
            <div>
              <input
                className="admin-date-input"
                type="text"
                value={row.date}
                readOnly
              />
            </div>
            <div className="admin-status">{row.status}</div>
            <div className="admin-actions">
              <button className="admin-ellipsis" type="button" aria-label="Menu">
                ...
              </button>
              <button
                className="admin-detail-btn"
                type="button"
                onClick={() => onViewDetail?.(row)}
              >
                <img src={eyeIcon} alt="Detail" />
                Detail
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Inbox;
