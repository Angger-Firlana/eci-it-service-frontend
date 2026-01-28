import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ServiceList.css';
import eyeIcon from '../../../assets/icons/lihatdetail(eye).svg';

const SERVICE_ROWS = [
  {
    id: 1,
    code: 'ABCD02',
    device: 'Laptop',
    model: 'Lenovo v14',
    service: 'Hardware',
    location: 'Workshop',
    date: '6/1/2021',
    cost: '',
    status: 'Selesai',
    detailVariant: 'approval',
  },
  {
    id: 2,
    code: 'ABCD01',
    device: 'Printer',
    model: 'Canon G2010',
    service: 'Hardware',
    location: 'Vendor',
    date: '8/4/2026',
    cost: 'Rp 200.000',
    status: 'Selesai',
    detailVariant: 'vendorApproval',
  },
  {
    id: 3,
    code: 'ABCD03',
    device: 'Laptop',
    model: 'Asus Vivobook',
    service: 'Hardware',
    location: 'Vendor',
    date: '10/4/2026',
    cost: 'Rp 450.000',
    status: 'Proses',
    detailVariant: 'vendorProgress',
  },
  {
    id: 4,
    code: 'ABCD04',
    device: 'Monitor',
    model: 'LG 27UL500',
    service: 'Hardware',
    location: 'Workshop',
    date: '11/4/2026',
    cost: '',
    status: 'Proses',
    detailVariant: 'workshop',
  },
  {
    id: 5,
    code: 'ABCD05',
    device: 'Laptop',
    model: 'Dell Latitude',
    service: 'Hardware',
    location: 'Vendor',
    date: '12/4/2026',
    cost: 'Rp 500.000',
    status: 'Revisi',
    detailVariant: 'vendorReassign',
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
    <div className="admin-service-list">
      <div className="admin-service-header">
        <h1>Service List</h1>
      </div>

      <div className="admin-service-controls">
        <div className="admin-search-box">
          <input type="text" placeholder="" aria-label="Search" />
          <i className="bi bi-search"></i>
        </div>

        <div className="admin-filter-group">
          <button className="admin-filter-btn" type="button">
            <i className="bi bi-calendar3"></i>
            <span>Date</span>
            <i className="bi bi-chevron-down"></i>
          </button>
          <button className="admin-filter-btn" type="button">
            <i className="bi bi-funnel"></i>
            <span>Service</span>
            <i className="bi bi-chevron-down"></i>
          </button>
          <button className="admin-filter-btn" type="button">
            <i className="bi bi-funnel"></i>
            <span>Status</span>
            <i className="bi bi-chevron-down"></i>
          </button>
        </div>
      </div>

      <div className="admin-service-table">
        <div className="admin-service-row admin-service-head">
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
          <div className="admin-service-row" key={row.id}>
            <div className="admin-code">{row.code}</div>
            <div>{row.device}</div>
            <div>{row.model}</div>
            <div>{row.service}</div>
            <div>{row.location}</div>
            <div>
              <input
                className="admin-date-input"
                type="text"
                value={row.date}
                readOnly
              />
            </div>
            <div className="admin-cost">{row.cost}</div>
            <div className="admin-status">{row.status}</div>
            <div className="admin-actions">
              <button className="admin-ellipsis" type="button" aria-label="Menu">
                ...
              </button>
              <button
                className="admin-detail-btn"
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
