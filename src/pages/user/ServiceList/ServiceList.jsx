import React from 'react';
import './ServiceList.css';
import eyeIcon from '../../../assets/icons/lihatdetail(eye).svg';

const SERVICE_ROWS = [
  {
    id: 1,
    device: 'Laptop',
    model: 'Lenovo v14',
    service: 'Hardware',
    date: '06 / 01 / 2021',
    description: 'Keyboard nya rada rusak',
    status: 'Proses',
  },
  {
    id: 2,
    device: 'Printer',
    model: 'Canon G2010',
    service: 'Hardware',
    date: '08 / 04 / 2022',
    description: 'Bocor',
    status: 'Selesai',
  },
];

const ServiceList = ({ onViewDetail }) => {
  return (
    <div className="service-list-page">
      <div className="service-list-header">
        <h1>Service List</h1>
      </div>

      <div className="service-list-controls">
        <div className="search-box">
          <input type="text" placeholder="" aria-label="Search" />
          <i className="bi bi-search"></i>
        </div>

        <div className="filter-group">
          <button className="filter-btn" type="button">
            <i className="bi bi-calendar3"></i>
            <span>Date</span>
            <i className="bi bi-chevron-down"></i>
          </button>
          <button className="filter-btn" type="button">
            <i className="bi bi-funnel"></i>
            <span>Status</span>
            <i className="bi bi-chevron-down"></i>
          </button>
        </div>
      </div>

      <div className="service-table-card">
        <div className="service-table-row service-table-head">
          <div>Perangkat</div>
          <div>Model</div>
          <div>Service</div>
          <div>Tanggal</div>
          <div>Keterangan</div>
          <div>Status</div>
          <div></div>
        </div>

        {SERVICE_ROWS.map((row) => (
          <div className="service-table-row" key={row.id}>
            <div>{row.device}</div>
            <div>{row.model}</div>
            <div>{row.service}</div>
            <div>
              <div className="date-pill">
                <span>{row.date}</span>
                <i className="bi bi-calendar3"></i>
              </div>
            </div>
            <div className="service-desc">{row.description}</div>
            <div className={`status-pill status-${row.status.toLowerCase()}`}>
              {row.status}
            </div>
            <div className="service-actions">
              <button className="ellipsis-btn" type="button" aria-label="Menu">
                ...
              </button>
              <button
                className="detail-btn"
                type="button"
                onClick={() => onViewDetail?.()}
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

export default ServiceList;
