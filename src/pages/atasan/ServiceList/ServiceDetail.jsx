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
  servicePlace: 'Bangkit Cell',
  serviceLocation:
    'Jl. H. Hasan No.15, RT.3/RW.9, Baru, Kec. Ps. Rebo, Kota Jakarta Timur, Daerah Khusus Ibukota Jakarta 13780',
};

const ESTIMATE_DATA = {
  cost: 'Rp 300.000',
  cancelCost: 'Rp 50.000',
  notes:
    'Benerin keyboard nya sma abel keyboard baru gara gara yang lama dah babak belur',
};

const TIMELINE_VARIANTS = {
  approval: [
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
      note: 'Disetujui oleh admin dan akan di service di vendor',
      meta: 'Bangkit Cell, Kelurahan Baru',
      state: 'active',
    },
    {
      id: 3,
      label: 'Menunggu Approve',
      date: '17 Jan 2026 12:00',
      note: 'Menunggu approve biaya oleh atasan',
      meta: 'Rp 300.000    Rp 50.000',
      state: 'pending',
    },
  ],
  progress: [
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
      note: 'Disetujui oleh admin dan akan di service di vendor',
      meta: 'Bangkit Cell, Kelurahan Baru',
      state: 'active',
    },
    {
      id: 3,
      label: 'Menunggu Approve',
      date: '18 Jan 2026 12:00',
      note: 'Menunggu approve biaya oleh atasan',
      meta: 'Rp 300.000    Rp 50.000',
      state: 'active',
    },
    {
      id: 4,
      label: 'Disetujui',
      date: '18 Jan 2026 17:00',
      note: 'Biaya service di setujui oleh atasan',
      meta: 'Oleh: Atasan 1, atasan 2, atasan 3',
      state: 'active',
    },
    {
      id: 5,
      label: 'Service',
      date: '18 Jan 2026 17:00',
      note: 'Barang sedang di service di vendor',
      meta: 'Diantar oleh: Angger',
      state: 'active',
    },
    {
      id: 6,
      label: 'Selesai',
      date: '31 Jan 2026 12:00',
      note: 'Barang selesai di service',
      state: 'active',
    },
  ],
};

const ServiceDetail = ({ onBack, variant = 'progress' }) => {
  const timelineItems = TIMELINE_VARIANTS[variant] || TIMELINE_VARIANTS.progress;
  const showActions = variant === 'approval';

  return (
    <div className="atasan-detail-page">
      <div className="atasan-detail-header">
        <button
          className="atasan-detail-back"
          type="button"
          onClick={() => onBack?.()}
        >
          <img src={backIcon} alt="Back" />
        </button>
        <div className="atasan-detail-title">
          <h1>{DETAIL_DATA.code}</h1>
          <p>{DETAIL_DATA.createdAt}</p>
        </div>
      </div>

      <div className="atasan-detail-grid">
        <div className="atasan-detail-left">
          <section className="atasan-detail-card">
            <div className="atasan-detail-card-head">
              <h2>Detail Request</h2>
              <span className="atasan-detail-dept">
                {DETAIL_DATA.department}
              </span>
            </div>

            <div className="atasan-detail-row">
              <span className="atasan-detail-key">Requester</span>
              <span className="atasan-detail-value">
                {DETAIL_DATA.requester}
              </span>
            </div>
            <div className="atasan-detail-row">
              <span className="atasan-detail-key">Perangkat</span>
              <span className="atasan-detail-value">{DETAIL_DATA.device}</span>
            </div>
            <div className="atasan-detail-row">
              <span className="atasan-detail-key">Merk</span>
              <span className="atasan-detail-value">{DETAIL_DATA.brand}</span>
            </div>
            <div className="atasan-detail-row">
              <span className="atasan-detail-key">Model</span>
              <span className="atasan-detail-value">{DETAIL_DATA.model}</span>
            </div>
            <div className="atasan-detail-row">
              <span className="atasan-detail-key">Jenis Service</span>
              <span className="atasan-detail-value">{DETAIL_DATA.service}</span>
            </div>
            <div className="atasan-detail-row">
              <span className="atasan-detail-key">Serial Number</span>
              <span className="atasan-detail-value">
                {DETAIL_DATA.serialNumber}
              </span>
            </div>

            <div className="atasan-detail-notes">
              <span className="atasan-detail-key">Keterangan</span>
              <div className="atasan-detail-text">
                {DETAIL_DATA.description}
              </div>
            </div>

            <div className="atasan-detail-row">
              <span className="atasan-detail-key">Tempat service</span>
              <span className="atasan-detail-value">
                {DETAIL_DATA.servicePlace}
              </span>
            </div>

            <div className="atasan-detail-location">
              <span className="atasan-detail-key">Lokasi Service</span>
              <div className="atasan-detail-address">
                {DETAIL_DATA.serviceLocation}
              </div>
            </div>
          </section>

          <section className="atasan-estimate-card">
            <h2>Estimasi Biaya</h2>
            <div className="atasan-estimate-row">
              <span>Biaya</span>
              <span>{ESTIMATE_DATA.cost}</span>
            </div>
            <div className="atasan-estimate-row">
              <span>Biaya Cancel</span>
              <span>{ESTIMATE_DATA.cancelCost}</span>
            </div>
            <div className="atasan-estimate-notes">
              <span className="atasan-detail-key">Keterangan Service</span>
              <div className="atasan-detail-text">{ESTIMATE_DATA.notes}</div>
            </div>
          </section>
        </div>

        <div className="atasan-detail-right">
          {showActions && (
            <section className="atasan-action-card">
              <h2>Aksi</h2>
              <label className="atasan-action-label" htmlFor="atasan-action-note">
                Keterangan
              </label>
              <textarea
                id="atasan-action-note"
                className="atasan-action-textarea"
                rows={4}
              />
              <div className="atasan-action-buttons">
                <button className="atasan-action-reject" type="button">
                  Reject
                </button>
                <button className="atasan-action-approve" type="button">
                  Approve
                </button>
              </div>
            </section>
          )}

          <section className="atasan-timeline-card">
            <h2>Timeline</h2>

            <div className="atasan-timeline-list">
              {timelineItems.map((item, index) => (
                <div className="atasan-timeline-item" key={item.id}>
                  <div className="atasan-timeline-marker">
                    <span className={`atasan-timeline-dot ${item.state}`}></span>
                    {index < timelineItems.length - 1 && (
                      <span
                        className={`atasan-timeline-line ${item.state}`}
                      ></span>
                    )}
                  </div>
                  <div className="atasan-timeline-content">
                    <span
                      className={`atasan-timeline-tag ${
                        item.state === 'active' ? 'active' : ''
                      }`}
                    >
                      {item.label}
                    </span>
                    <span className="atasan-timeline-date">{item.date}</span>
                    <span className="atasan-timeline-desc">{item.note}</span>
                    {item.meta && (
                      <span className="atasan-timeline-meta">{item.meta}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button className="atasan-invoice-btn" type="button">
              Cetak Invoice
              <i className="bi bi-printer"></i>
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetail;
