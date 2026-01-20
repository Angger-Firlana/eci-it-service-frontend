import React from 'react';
import './ServiceDetail.css';
import backIcon from '../../../assets/icons/back.svg';

const DETAIL_DATA = {
  code: 'ABCD01',
  createdAt: 'Dibuat pada tanggal 15 jan 2026 12:00',
  department: 'Marketing',
  requester: 'Toni Apalah',
  device: 'Laptop',
  brand: 'Lenovo',
  model: 'Thinkpad Ideapad',
  service: 'Hardware',
  serialNumber: 'KMNT12390LOC',
  description: 'Keyboard nya rada rusak',
};

const TIMELINE_ITEMS = [
  {
    id: 1,
    label: 'Menunggu Approval',
    date: '15 Jan 2026 12:00',
    note: 'Request dibuat oleh Toni Apalah',
    state: 'active',
  },
  {
    id: 2,
    label: 'Disetujui',
    date: '17 Jan 2026 12:00',
    note: 'Disetujui oleh admin dan akan di service di workshop',
    state: 'active',
  },
  {
    id: 3,
    label: 'Selesai',
    date: '17 Jan 2026 12:00',
    note: 'Disetujui oleh admin dan akan di service di workshop',
    state: 'active',
  },
];

const ServiceDetail = ({ onBack }) => {
  return (
    <div className="service-detail-page">
      <div className="detail-header">
        <button
          className="detail-back"
          type="button"
          onClick={() => onBack?.()}
        >
          <img src={backIcon} alt="Back" />
        </button>
        <div className="detail-title">
          <h1>{DETAIL_DATA.code}</h1>
          <p>{DETAIL_DATA.createdAt}</p>
        </div>
      </div>

      <div className="detail-grid">
        <section className="detail-card">
          <div className="detail-card-head">
            <h2>Detail Request</h2>
            <span className="detail-dept">{DETAIL_DATA.department}</span>
          </div>

          <div className="detail-row">
            <span className="detail-key">Requester</span>
            <span className="detail-value">{DETAIL_DATA.requester}</span>
          </div>
          <div className="detail-row">
            <span className="detail-key">Perangkat</span>
            <span className="detail-value">{DETAIL_DATA.device}</span>
          </div>
          <div className="detail-row">
            <span className="detail-key">Merk</span>
            <span className="detail-value">{DETAIL_DATA.brand}</span>
          </div>
          <div className="detail-row">
            <span className="detail-key">Model</span>
            <span className="detail-value">{DETAIL_DATA.model}</span>
          </div>
          <div className="detail-row">
            <span className="detail-key">Jenis Service</span>
            <span className="detail-value">{DETAIL_DATA.service}</span>
          </div>
          <div className="detail-row">
            <span className="detail-key">Serial Number</span>
            <span className="detail-value">{DETAIL_DATA.serialNumber}</span>
          </div>

          <div className="detail-notes">
            <span className="detail-key">Keterangan</span>
            <div className="detail-text">{DETAIL_DATA.description}</div>
          </div>
        </section>

        <aside className="timeline-card">
          <h2>Timeline</h2>

          <div className="timeline-list">
            {TIMELINE_ITEMS.map((item, index) => (
              <div className="timeline-item" key={item.id}>
                <div className="timeline-marker">
                  <span className={`timeline-dot ${item.state}`}></span>
                  {index < TIMELINE_ITEMS.length - 1 && (
                    <span className={`timeline-line ${item.state}`}></span>
                  )}
                </div>
                <div className="timeline-content">
                  <span className={`timeline-tag ${item.state}`}>
                    {item.label}
                  </span>
                  <span className="timeline-date">{item.date}</span>
                  <span className="timeline-desc">{item.note}</span>
                </div>
              </div>
            ))}
          </div>

          <button className="invoice-btn" type="button">
            Cetak Invoice
            <i className="bi bi-printer"></i>
          </button>
        </aside>
      </div>
    </div>
  );
};

export default ServiceDetail;
