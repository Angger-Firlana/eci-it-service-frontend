import React, { useState } from 'react';
import './MasterData.css';
import { Modal } from '../../../components/common';

const DEVICE_ROWS = [
  { id: 1, name: 'Laptop' },
  { id: 2, name: 'Printer' },
];

const MODEL_ROWS = [
  { id: 1, device: 'Laptop', brand: 'Lenovo', model: 'Lenovo v14' },
  { id: 2, device: 'Printer', brand: 'Canon', model: 'G2010' },
];

const SERVICE_ROWS = [
  { id: 1, name: 'Perbaikan Hardware' },
  { id: 2, name: 'Instalasi Software' },
];

const MasterData = () => {
  const [activeTab, setActiveTab] = useState('device');
  const [modal, setModal] = useState(null);

  const openModal = () => setModal(activeTab);
  const closeModal = () => setModal(null);

  return (
    <div className="admin-master-page">
      <h1>Master Data</h1>

      <section className="admin-master-card">
        <div className="admin-master-tabs">
          <button
            type="button"
            className={`admin-master-tab ${
              activeTab === 'device' ? 'active' : ''
            }`}
            onClick={() => setActiveTab('device')}
          >
            Perangkat
          </button>
          <button
            type="button"
            className={`admin-master-tab ${
              activeTab === 'model' ? 'active' : ''
            }`}
            onClick={() => setActiveTab('model')}
          >
            Model
          </button>
          <button
            type="button"
            className={`admin-master-tab ${
              activeTab === 'service' ? 'active' : ''
            }`}
            onClick={() => setActiveTab('service')}
          >
            Service
          </button>
        </div>

        <div className="admin-master-toolbar">
          <div>
            <div className="admin-master-title">
              {activeTab === 'device' && 'Daftar Perangkat'}
              {activeTab === 'model' && 'Daftar Model'}
              {activeTab === 'service' && 'Daftar Jenis Service'}
            </div>
          </div>

          <div className="admin-master-actions">
            {activeTab === 'model' && (
              <>
                <button className="admin-filter-btn" type="button">
                  <i className="bi bi-funnel"></i>
                  <span>Perangkat</span>
                  <i className="bi bi-chevron-down"></i>
                </button>
                <button className="admin-filter-btn" type="button">
                  <i className="bi bi-funnel"></i>
                  <span>Merk</span>
                  <i className="bi bi-chevron-down"></i>
                </button>
              </>
            )}

            {(activeTab === 'model' || activeTab === 'service') && (
              <div className="admin-search-box">
                <input type="text" placeholder="" aria-label="Search" />
                <i className="bi bi-search"></i>
              </div>
            )}

            {activeTab === 'device' && (
              <div className="admin-search-box">
                <input type="text" placeholder="" aria-label="Search" />
                <i className="bi bi-search"></i>
              </div>
            )}

            <button className="admin-master-add" type="button" onClick={openModal}>
              <span>+ Tambah</span>
            </button>
          </div>
        </div>

        <div className="admin-master-table">
          {activeTab === 'device' && (
            <>
              <div className="admin-master-row admin-master-head">
                <div>Nama</div>
                <div className="admin-master-action-col">Aksi</div>
              </div>
              {DEVICE_ROWS.map((row) => (
                <div className="admin-master-row" key={row.id}>
                  <div>{row.name}</div>
                  <div className="admin-master-actions-cell">
                    <button type="button" className="admin-master-icon">
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button type="button" className="admin-master-icon">
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}

          {activeTab === 'model' && (
            <>
              <div className="admin-master-row admin-master-head admin-master-model-head">
                <div>Perangkat</div>
                <div>Merk</div>
                <div>Model</div>
                <div className="admin-master-action-col">Aksi</div>
              </div>
              {MODEL_ROWS.map((row) => (
                <div className="admin-master-row admin-master-model-row" key={row.id}>
                  <div>{row.device}</div>
                  <div>{row.brand}</div>
                  <div>{row.model}</div>
                  <div className="admin-master-actions-cell">
                    <button type="button" className="admin-master-icon">
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button type="button" className="admin-master-icon">
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}

          {activeTab === 'service' && (
            <>
              <div className="admin-master-row admin-master-head">
                <div>Jenis Service</div>
                <div className="admin-master-action-col">Aksi</div>
              </div>
              {SERVICE_ROWS.map((row) => (
                <div className="admin-master-row" key={row.id}>
                  <div>{row.name}</div>
                  <div className="admin-master-actions-cell">
                    <button type="button" className="admin-master-icon">
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button type="button" className="admin-master-icon">
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </section>

      <Modal isOpen={modal === 'device'} onClose={closeModal} className="admin-modal">
        <button className="admin-modal-close" type="button" onClick={closeModal}>
          <i className="bi bi-x"></i>
        </button>
        <h2>Tambah Perangkat</h2>
        <p>Tambahkan perangkat ...</p>
        <div className="admin-modal-field">
          <label>Nama</label>
          <input type="text" placeholder="Masukkan nama perangkat" />
        </div>
        <div className="admin-modal-actions">
          <button className="admin-modal-save" type="button">
            Simpan
          </button>
        </div>
      </Modal>

      <Modal isOpen={modal === 'model'} onClose={closeModal} className="admin-modal">
        <button className="admin-modal-close" type="button" onClick={closeModal}>
          <i className="bi bi-x"></i>
        </button>
        <h2>Tambah Model</h2>
        <p>Tambahkan model ...</p>
        <div className="admin-modal-field">
          <label>Perangkat</label>
          <select>
            <option value="">Pilih</option>
            <option value="Laptop">Laptop</option>
            <option value="Printer">Printer</option>
          </select>
        </div>
        <div className="admin-modal-field">
          <label>Brand/ merk</label>
          <input type="text" placeholder="Masukkan nama Merk" />
        </div>
        <div className="admin-modal-field">
          <label>Nama Model</label>
          <input type="text" placeholder="Masukkan nama model" />
        </div>
        <div className="admin-modal-actions">
          <button className="admin-modal-save" type="button">
            Simpan
          </button>
        </div>
      </Modal>

      <Modal isOpen={modal === 'service'} onClose={closeModal} className="admin-modal">
        <button className="admin-modal-close" type="button" onClick={closeModal}>
          <i className="bi bi-x"></i>
        </button>
        <h2>Tambah Jenis Service</h2>
        <p>Tambahkan jenis ...</p>
        <div className="admin-modal-field">
          <label>Jenis</label>
          <input type="text" placeholder="Masukkan nama jenis servicenya" />
        </div>
        <div className="admin-modal-actions">
          <button className="admin-modal-save" type="button">
            Simpan
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default MasterData;
