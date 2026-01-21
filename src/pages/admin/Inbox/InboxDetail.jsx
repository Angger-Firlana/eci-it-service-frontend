import React, { useMemo, useState } from 'react';
import './InboxDetail.css';
import backIcon from '../../../assets/icons/back.svg';
import { Modal } from '../../../components/common';

const DETAIL_DATA = {
  code: 'ABCD02',
  createdAt: 'Dibuat pada tanggal 15 Jan 2026 12:00',
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
  estimateDate: '31/01/2026',
  moveNote:
    'Stok barang di workshop dah habis jadi gak bisa lanjut service di sini harus dari luar',
};

const SERVICE_INFO = {
  vendor: {
    place: DETAIL_DATA.servicePlace,
    location: DETAIL_DATA.serviceLocation,
  },
  workshop: {
    place: 'Workshop',
    location: 'Workshop IT',
  },
};

const ESTIMATE_DATA = {
  cost: 'Rp 300.000',
  cancelCost: 'Rp 50.000',
  notes:
    'Benerin keyboard nya sma abel keyboard baru gara gara yang lama dah babak belur',
};

const APPROVAL_VARIANTS = {
  pending: {
    title: 'Menunggu approval dari atasan',
    progress: 50,
    summary: '1/2 Approved',
    items: [
      { id: 1, name: 'Pak Ahmad', role: 'IT', status: 'waiting' },
      { id: 2, name: 'Pak Ahmad', role: 'IT', status: 'approved' },
    ],
  },
  approved: {
    title: 'Menunggu approval dari atasan',
    progress: 100,
    summary: '2/2 Approved',
    items: [
      { id: 1, name: 'Pak Ahmad', role: 'IT', status: 'approved' },
      { id: 2, name: 'Pak Ahmad', role: 'IT', status: 'approved' },
    ],
  },
  rejected: {
    title: 'Menunggu approval dari atasan',
    progress: 100,
    summary: '2/2 Approved',
    items: [
      { id: 1, name: 'Pak Ahmad', role: 'IT', status: 'approved' },
      {
        id: 2,
        name: 'Pak Ahmad',
        role: 'IT',
        status: 'rejected',
        note: 'Gaji jelas keterangannya',
      },
    ],
  },
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
  ],
  workshop: [
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
      note: 'Disetujui oleh admin dan akan di service di workshop IT',
      state: 'active',
    },
    {
      id: 3,
      label: 'Proses',
      date: '17 Jan 2026 12:00',
      note: 'Perangkat sedang di service',
      state: 'active',
    },
  ],
  vendorApproval: [
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
      date: '20 Jan 2026 12:00',
      note: 'Menunggu approval biaya Rp 300.000 (biaya cancel Rp 50.000)',
      meta: '1/2 Approved',
      state: 'pending',
    },
  ],
  vendorApprovalRejected: [
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
      date: '20 Jan 2026 12:00',
      note: 'Menunggu approval biaya Rp 300.000 (biaya cancel Rp 50.000)',
      meta: '1/2 Approved',
      state: 'active',
    },
    {
      id: 4,
      label: 'Ditolak',
      date: '30 Jan 2026 17:00',
      note: 'Biaya service ditolak oleh atasan',
      meta: '2/2 Approved',
      state: 'rejected',
    },
    {
      id: 5,
      label: 'Revisi',
      date: '31 Jan 2026 17:00',
      note: 'Revisi vendor dikarenakan adanya penolakan dari atasan',
      state: 'revision',
    },
    {
      id: 6,
      label: 'Menunggu Approve',
      date: '1 Feb 2026 12:00',
      note: 'Menunggu approval biaya Rp 300.000 (biaya cancel Rp 50.000)',
      meta: '1/2 Approved',
      state: 'pending',
    },
  ],
  vendorMove: [
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
      note: 'Disetujui oleh admin dan akan di service di workshop IT',
      state: 'active',
    },
    {
      id: 3,
      label: 'Proses',
      date: '17 Jan 2026 12:00',
      note: 'Perangkat sedang di service',
      state: 'active',
    },
    {
      id: 4,
      label: 'Proses',
      date: '17 Jan 2026 12:00',
      note: 'Perangkat dipindahkan ke vendor untuk diservice',
      state: 'active',
    },
    {
      id: 5,
      label: 'Menunggu Approve',
      date: '20 Jan 2026 12:00',
      note: 'Menunggu approval biaya Rp 300.000 (biaya cancel Rp 50.000)',
      meta: '1/2 Approved',
      state: 'pending',
    },
  ],
  vendorProgress: [
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
      note: 'Menunggu approval biaya Rp 300.000 (biaya cancel Rp 50.000)',
      meta: '1/2 Approved',
      state: 'active',
    },
    {
      id: 4,
      label: 'Disetujui',
      date: '18 Jan 2026 17:00',
      note: 'Biaya service di setujui oleh atasan',
      meta: '2/2 Approved',
      state: 'active',
    },
    {
      id: 5,
      label: 'Service',
      date: '18 Jan 2026 17:00',
      note: 'Barang sedang di service di vendor',
      state: 'active',
    },
  ],
  completed: [
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
      note: 'Menunggu approval biaya Rp 300.000 (biaya cancel Rp 50.000)',
      meta: '1/2 Approved',
      state: 'active',
    },
    {
      id: 4,
      label: 'Disetujui',
      date: '18 Jan 2026 17:00',
      note: 'Biaya service di setujui oleh atasan',
      meta: '2/2 Approved',
      state: 'active',
    },
    {
      id: 5,
      label: 'Service',
      date: '18 Jan 2026 17:00',
      note: 'Barang sedang di service di vendor',
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

const VARIANT_CONFIG = {
  approval: {
    actions: ['approval'],
    showApproval: false,
    approvalKey: 'pending',
    showEstimate: false,
    showServiceFields: false,
    showNotesReason: false,
    showInvoice: false,
    timeline: 'approval',
  },
  workshop: {
    actions: ['move-vendor', 'complete-service'],
    showApproval: false,
    approvalKey: 'pending',
    showEstimate: false,
    showServiceFields: true,
    serviceType: 'workshop',
    showNotesReason: false,
    showInvoice: false,
    timeline: 'workshop',
  },
  vendorApproval: {
    actions: ['move-workshop', 'input-cost'],
    showApproval: true,
    approvalKey: 'pending',
    showEstimate: false,
    showServiceFields: true,
    showNotesReason: false,
    showInvoice: false,
    timeline: 'vendorApproval',
  },
  vendorApprovalRejected: {
    actions: ['move-workshop', 'input-cost'],
    showApproval: true,
    approvalKey: 'rejected',
    showEstimate: false,
    showServiceFields: true,
    showNotesReason: false,
    showInvoice: false,
    timeline: 'vendorApprovalRejected',
  },
  vendorMove: {
    actions: ['move-workshop', 'input-cost'],
    showApproval: true,
    approvalKey: 'pending',
    showEstimate: false,
    showServiceFields: true,
    showNotesReason: true,
    showInvoice: true,
    timeline: 'vendorMove',
  },
  vendorProgress: {
    actions: ['complete-service'],
    showApproval: true,
    approvalKey: 'approved',
    showEstimate: true,
    showServiceFields: true,
    showNotesReason: false,
    showInvoice: true,
    timeline: 'vendorProgress',
  },
  vendorReassign: {
    actions: ['complete-service', 'reschedule-vendor'],
    showApproval: true,
    approvalKey: 'rejected',
    showEstimate: true,
    showServiceFields: true,
    showNotesReason: false,
    showInvoice: true,
    timeline: 'vendorProgress',
  },
  completed: {
    actions: ['complete-service'],
    showApproval: true,
    approvalKey: 'approved',
    showEstimate: true,
    showServiceFields: true,
    showNotesReason: false,
    showInvoice: true,
    timeline: 'completed',
  },
};

const AdminInboxDetail = ({ onBack, variant = 'approval' }) => {
  const [locationType, setLocationType] = useState('workshop');
  const [isLocationModalOpen, setLocationModalOpen] = useState(false);
  const [isMoveModalOpen, setMoveModalOpen] = useState(false);
  const [isCostModalOpen, setCostModalOpen] = useState(false);
  const [isApprovalModalOpen, setApprovalModalOpen] = useState(false);

  const config = VARIANT_CONFIG[variant] || VARIANT_CONFIG.approval;
  const serviceInfo = SERVICE_INFO[config.serviceType || 'vendor'];
  const timelineItems = TIMELINE_VARIANTS[config.timeline] || [];
  const approvalData = APPROVAL_VARIANTS[config.approvalKey] || APPROVAL_VARIANTS.pending;

  const actions = useMemo(() => config.actions || [], [config.actions]);

  const renderAction = (action) => {
    switch (action) {
      case 'approval':
        return (
          <section className="admin-action-card" key={action}>
            <h2>Aksi</h2>
            <label className="admin-action-label">Estimasi tanggal selesai</label>
            <div className="admin-action-input">
              <input type="text" placeholder="mm/dd/yyyy" />
              <i className="bi bi-calendar3"></i>
            </div>
            <div className="admin-action-buttons">
              <button className="admin-action-reject" type="button">
                Reject
              </button>
              <button
                className="admin-action-approve"
                type="button"
                onClick={() => setLocationModalOpen(true)}
              >
                Approve
              </button>
            </div>
          </section>
        );
      case 'move-vendor':
        return (
          <section className="admin-action-card" key={action}>
            <h2>Pindah Ke Vendor</h2>
            <button
              className="admin-action-primary"
              type="button"
              onClick={() => setMoveModalOpen(true)}
            >
              <i className="bi bi-geo-alt"></i>
              Pindah Vendor
            </button>
          </section>
        );
      case 'move-workshop':
        return (
          <section className="admin-action-card" key={action}>
            <h2>Pindah Ke Workshop</h2>
            <button
              className="admin-action-primary"
              type="button"
              onClick={() => setMoveModalOpen(true)}
            >
              <i className="bi bi-geo-alt"></i>
              Pindah Workshop
            </button>
          </section>
        );
      case 'input-cost':
        return (
          <section className="admin-action-card" key={action}>
            <h2>Input Biaya Service</h2>
            <p>Masukkan estimasi biaya service di vendor</p>
            <button
              className="admin-action-primary"
              type="button"
              onClick={() => setCostModalOpen(true)}
            >
              <i className="bi bi-cash-stack"></i>
              Input biaya
            </button>
          </section>
        );
      case 'complete-service':
        return (
          <section className="admin-action-card" key={action}>
            <h2>Selesaikan Service</h2>
            <button className="admin-action-primary" type="button">
              <i className="bi bi-check-circle"></i>
              Tandai Selesai
            </button>
          </section>
        );
      case 'reschedule-vendor':
        return (
          <section className="admin-action-card" key={action}>
            <h2>Atur Ulang Vendor</h2>
            <button
              className="admin-action-primary"
              type="button"
              onClick={() => setMoveModalOpen(true)}
            >
              <i className="bi bi-geo-alt"></i>
              Atur Ulang
            </button>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <div className="admin-inbox-detail">
      <div className="admin-detail-header">
        <button
          className="admin-detail-back"
          type="button"
          onClick={() => onBack?.()}
        >
          <img src={backIcon} alt="Back" />
        </button>
        <div className="admin-detail-title">
          <h1>{DETAIL_DATA.code}</h1>
          <p>{DETAIL_DATA.createdAt}</p>
        </div>
        <button className="admin-cancel-btn" type="button">
          Batalkan Service
        </button>
      </div>

      <div className="admin-inbox-grid">
        <div className="admin-inbox-left">
          <section className="admin-detail-card">
            <div className="admin-detail-card-head">
              <h2>Detail Request</h2>
              <span className="admin-detail-dept">{DETAIL_DATA.department}</span>
            </div>

            <div className="admin-detail-row">
              <span className="admin-detail-key">Requester</span>
              <span className="admin-detail-value">{DETAIL_DATA.requester}</span>
            </div>
            <div className="admin-detail-row">
              <span className="admin-detail-key">Perangkat</span>
              <span className="admin-detail-value">{DETAIL_DATA.device}</span>
            </div>
            <div className="admin-detail-row">
              <span className="admin-detail-key">Merk</span>
              <span className="admin-detail-value">{DETAIL_DATA.brand}</span>
            </div>
            <div className="admin-detail-row">
              <span className="admin-detail-key">Model</span>
              <span className="admin-detail-value">{DETAIL_DATA.model}</span>
            </div>
            <div className="admin-detail-row">
              <span className="admin-detail-key">Jenis Service</span>
              <span className="admin-detail-value">{DETAIL_DATA.service}</span>
            </div>
            <div className="admin-detail-row">
              <span className="admin-detail-key">Serial Number</span>
              <span className="admin-detail-value">{DETAIL_DATA.serialNumber}</span>
            </div>

            <div className="admin-detail-notes">
              <span className="admin-detail-key">Keterangan</span>
              <div className="admin-detail-text">{DETAIL_DATA.description}</div>
            </div>

            {config.showServiceFields && (
              <>
                <div className="admin-detail-row">
                  <span className="admin-detail-key">Tempat service</span>
                  <span className="admin-detail-value">
                    {serviceInfo.place}
                  </span>
                  <button className="admin-detail-edit" type="button">
                    <i className="bi bi-pencil"></i>
                  </button>
                </div>

                <div className="admin-detail-location">
                  <div className="admin-detail-location-head">
                    <span className="admin-detail-key">Lokasi Service</span>
                    <button className="admin-detail-edit" type="button">
                      <i className="bi bi-pencil"></i>
                    </button>
                  </div>
                  <div className="admin-detail-address">
                    {serviceInfo.location}
                  </div>
                </div>

                <div className="admin-detail-row">
                  <span className="admin-detail-key">Estimasi Selesai</span>
                  <span className="admin-detail-value">
                    {DETAIL_DATA.estimateDate}
                  </span>
                  <button className="admin-detail-edit" type="button">
                    <i className="bi bi-pencil"></i>
                  </button>
                </div>
              </>
            )}

            {config.showNotesReason && (
              <div className="admin-detail-notes">
                <span className="admin-detail-key">Keterangan</span>
                <div className="admin-detail-text">{DETAIL_DATA.moveNote}</div>
              </div>
            )}
          </section>

          {config.showEstimate && (
            <section className="admin-estimate-card">
              <h2>Estimasi Biaya</h2>
              <div className="admin-estimate-row">
                <span>Biaya</span>
                <span>{ESTIMATE_DATA.cost}</span>
              </div>
              <div className="admin-estimate-row">
                <span>Biaya Cancel</span>
                <span>{ESTIMATE_DATA.cancelCost}</span>
              </div>
              <div className="admin-estimate-notes">
                <span className="admin-detail-key">Keterangan Service</span>
                <div className="admin-detail-text">{ESTIMATE_DATA.notes}</div>
              </div>
            </section>
          )}
        </div>

        <div className="admin-inbox-right">
          {actions.map((action) => renderAction(action))}

          {config.showApproval && (
            <section className="admin-approval-card">
              <div className="admin-approval-head">
                <div>
                  <h2>Status Approval</h2>
                  <p>{approvalData.title}</p>
                </div>
                <button
                  className="admin-detail-edit"
                  type="button"
                  onClick={() => setApprovalModalOpen(true)}
                >
                  <i className="bi bi-pencil"></i>
                </button>
              </div>

              <div className="admin-approval-progress">
                <div className="admin-approval-bar">
                  <span
                    className="admin-approval-bar-fill"
                    style={{ width: `${approvalData.progress}%` }}
                  ></span>
                </div>
                <span className="admin-approval-count">{approvalData.summary}</span>
              </div>

              <div className="admin-approval-list">
                {approvalData.items.map((item) => (
                  <div
                    className={`admin-approval-item admin-approval-${item.status}`}
                    key={item.id}
                  >
                    <div>
                      <div className="admin-approval-name">{item.name}</div>
                      {item.role && (
                        <div className="admin-approval-role">{item.role}</div>
                      )}
                      {item.note && (
                        <div className="admin-approval-note">{item.note}</div>
                      )}
                    </div>
                    <span className="admin-approval-status">
                      {item.status === 'waiting'
                        ? 'Waiting'
                        : item.status === 'rejected'
                        ? 'Unapprove'
                        : 'Approved'}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="admin-timeline-card">
            <h2>Timeline</h2>
            <div className="admin-timeline-list">
              {timelineItems.map((item, index) => (
                <div className="admin-timeline-item" key={item.id}>
                  <div className="admin-timeline-marker">
                    <span className={`admin-timeline-dot ${item.state}`}></span>
                    {index < timelineItems.length - 1 && (
                      <span
                        className={`admin-timeline-line ${item.state}`}
                      ></span>
                    )}
                  </div>
                  <div className="admin-timeline-content">
                    <span
                      className={`admin-timeline-tag ${item.state || 'active'}`}
                    >
                      {item.label}
                    </span>
                    <span className="admin-timeline-date">{item.date}</span>
                    <span className="admin-timeline-desc">{item.note}</span>
                    {item.meta && (
                      <span className="admin-timeline-meta">{item.meta}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {config.showInvoice && (
              <button className="admin-invoice-btn" type="button">
                Cetak Invoice
                <i className="bi bi-printer"></i>
              </button>
            )}
          </section>
        </div>
      </div>

      <Modal
        isOpen={isLocationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        className="admin-modal"
      >
        <button
          className="admin-modal-close"
          type="button"
          onClick={() => setLocationModalOpen(false)}
        >
          <i className="bi bi-x"></i>
        </button>
        <h2>Pilih Lokasi Service</h2>
        <p>Tambahkan lokasi service ...</p>

        <div className="admin-modal-options">
          <label className="admin-modal-option">
            <input
              type="radio"
              checked={locationType === 'workshop'}
              onChange={() => setLocationType('workshop')}
            />
            Workshop IT (Internal)
          </label>
          <label className="admin-modal-option">
            <input
              type="radio"
              checked={locationType === 'vendor'}
              onChange={() => setLocationType('vendor')}
            />
            Vendor (Eksternal)
          </label>
        </div>

        <div className="admin-modal-field">
          <label>Estimasi Tanggal Selesai</label>
          <div className="admin-modal-input">
            <input type="text" placeholder="mm/dd/yyyy" />
            <i className="bi bi-calendar3"></i>
          </div>
        </div>

        {locationType === 'vendor' && (
          <>
            <div className="admin-modal-field">
              <label>Nama Toko/ Vendor</label>
              <input
                type="text"
                placeholder="Contoh: iBox, Bangkit cell"
              />
            </div>
            <div className="admin-modal-field">
              <label>Alamat</label>
              <input
                type="text"
                placeholder="Contoh: Sudirman Central Business District"
              />
            </div>
          </>
        )}

        <div className="admin-modal-actions">
          <button
            className="admin-modal-cancel"
            type="button"
            onClick={() => setLocationModalOpen(false)}
          >
            Batal
          </button>
          <button className="admin-modal-save" type="button">
            Simpan
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={isMoveModalOpen}
        onClose={() => setMoveModalOpen(false)}
        className="admin-modal"
      >
        <button
          className="admin-modal-close"
          type="button"
          onClick={() => setMoveModalOpen(false)}
        >
          <i className="bi bi-x"></i>
        </button>
        <h2>Pindah Lokasi Service</h2>
        <p>Berikan alasan mengapa pindah lokasi service</p>

        <div className="admin-modal-field">
          <label>Alasan</label>
          <textarea placeholder="Berikan alasan mengapa pindah lokasi service"></textarea>
        </div>
        <div className="admin-modal-field">
          <label>Nama Toko/ Vendor</label>
          <input type="text" placeholder="Contoh: iBox, Bangkit cell" />
        </div>
        <div className="admin-modal-field">
          <label>Alamat</label>
          <input
            type="text"
            placeholder="Contoh: Sudirman Central Business District"
          />
        </div>

        <div className="admin-modal-actions">
          <button
            className="admin-modal-cancel"
            type="button"
            onClick={() => setMoveModalOpen(false)}
          >
            Batal
          </button>
          <button className="admin-modal-save" type="button">
            Simpan
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={isCostModalOpen}
        onClose={() => setCostModalOpen(false)}
        className="admin-modal"
      >
        <button
          className="admin-modal-close"
          type="button"
          onClick={() => setCostModalOpen(false)}
        >
          <i className="bi bi-x"></i>
        </button>
        <h2>Input Estimasi Biaya</h2>
        <p>Masukkan estimasi biaya service</p>

        <div className="admin-modal-field">
          <label>Estimasi Biaya</label>
          <div className="admin-modal-input">
            <span>Rp</span>
            <input type="text" placeholder="" />
          </div>
        </div>
        <div className="admin-modal-field">
          <label>Biaya Cancel</label>
          <input type="text" placeholder="Contoh: iBox, Bangkit cell" />
        </div>
        <div className="admin-modal-field">
          <label>Keterangan</label>
          <textarea placeholder="Jelaskan Detail Biaya"></textarea>
        </div>

        <div className="admin-modal-actions">
          <button
            className="admin-modal-cancel"
            type="button"
            onClick={() => setCostModalOpen(false)}
          >
            Batal
          </button>
          <button className="admin-modal-save" type="button">
            Simpan
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={isApprovalModalOpen}
        onClose={() => setApprovalModalOpen(false)}
        className="admin-modal"
      >
        <button
          className="admin-modal-close"
          type="button"
          onClick={() => setApprovalModalOpen(false)}
        >
          <i className="bi bi-x"></i>
        </button>
        <h2>Edit Approval</h2>
        <p>Pilih atasan</p>

        <div className="admin-modal-checklist">
          {[
            'Alva Simatupang',
            'Alva Simalang',
            'Alva Siapa',
            'Alva Singa',
            'Alva Silang',
          ].map((name, index) => (
            <label key={name} className="admin-modal-check">
              <input type="checkbox" defaultChecked={index < 2} />
              {name}
            </label>
          ))}
        </div>

        <div className="admin-modal-actions">
          <button
            className="admin-modal-cancel"
            type="button"
            onClick={() => setApprovalModalOpen(false)}
          >
            Batal
          </button>
          <button className="admin-modal-save" type="button">
            Simpan
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminInboxDetail;
