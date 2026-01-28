import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ServiceList.css';
import eyeIcon from '../../../assets/icons/lihatdetail(eye).svg';

const SERVICE_ROWS = [
  {
    id: 1,
    code: 'ABCD01',
    device: 'Laptop',
    model: 'Lenovo v14',
    service: 'Hardware',
    location: 'Workshop',
    date: '6/1/2021',
    cost: '',
    status: 'Proses',
    detailVariant: 'approval',
  },
  {
    id: 2,
    code: 'ABCD02',
    device: 'Printer',
    model: 'Canon G2010',
    service: 'Hardware',
    location: 'Vendor',
    date: '8/4/2026',
    cost: 'Rp 200.000',
    status: 'Selesai',
    detailVariant: 'progress',
  },
];

const ServiceList = ({ onViewDetail } = {}) => {
  const navigate = useNavigate();

  const handleViewDetail = (row) => {
    if (onViewDetail) {
      onViewDetail(row);
      return;
    }
    const variantParam = row.detailVariant ? `?variant=${row.detailVariant}` : '';
    navigate(`/services/${row.id}${variantParam}`);
  };
  return (
    <div className="atasan-service-list">
      <div className="atasan-service-header">
        <h1>Service List</h1>
      </div>

      <div className="atasan-service-controls">
        <div className="atasan-search-box">
          <input type="text" placeholder="" aria-label="Search" />
          <i className="bi bi-search"></i>
        </div>

        <div className="atasan-filter-group">
          <button className="atasan-filter-btn" type="button">
            <i className="bi bi-calendar3"></i>
            <span>Date</span>
            <i className="bi bi-chevron-down"></i>
          </button>
          <button className="atasan-filter-btn" type="button">
            <i className="bi bi-geo-alt"></i>
            <span>Lokasi</span>
            <i className="bi bi-chevron-down"></i>
          </button>
          <button className="atasan-filter-btn" type="button">
            <i className="bi bi-funnel"></i>
            <span>Status</span>
            <i className="bi bi-chevron-down"></i>
          </button>
        </div>
      </div>

      <div className="atasan-service-table">
        <div className="atasan-service-row atasan-service-head">
          <div>Kode</div>
          <div>Perangkat</div>
          <div>Model</div>
          <div>Service</div>
          <div>Lokasi</div>
          <div>Tanggal</div>
          <div>Biaya</div>
          <div>Status</div>
          <div></div>
        </div>

        {SERVICE_ROWS.map((row) => (
          <div className="atasan-service-row" key={row.id}>
            <div className="atasan-code">{row.code}</div>
            <div>{row.device}</div>
            <div>{row.model}</div>
            <div>{row.service}</div>
            <div>{row.location}</div>
            <div>
              <input
                className="atasan-date-input"
                type="text"
                value={row.date}
                readOnly
              />
            </div>
            <div className="atasan-cost">{row.cost}</div>
            <div className="atasan-status">{row.status}</div>
            <div className="atasan-actions">
              <button className="atasan-ellipsis" type="button" aria-label="Menu">
                ...
              </button>
              <button
                className="atasan-detail-btn"
                type="button"
                onClick={() => handleViewDetail(row)}
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
