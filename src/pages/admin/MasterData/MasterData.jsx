import React, { useEffect, useMemo, useState } from 'react';
import './MasterData.css';
import { Modal } from '../../../components/common';
import { apiRequest, unwrapApiData, API_BASE_URL } from '../../../lib/api';

const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_KEYS = {
  deviceTypes: 'eci-masterdata-device-types',
  deviceModels: 'eci-masterdata-device-models',
  serviceTypes: 'eci-masterdata-service-types',
};

const readCache = (key) => {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.data) || !parsed.ts) return null;
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed.data;
  } catch (error) {
    return null;
  }
};

const writeCache = (key, data) => {
  if (typeof window === 'undefined') return;
  const safeData = Array.isArray(data)
    ? data.filter((item) => !item?.__optimistic)
    : [];
  window.localStorage.setItem(
    key,
    JSON.stringify({
      ts: Date.now(),
      data: safeData,
    })
  );
};

const MasterData = () => {
  const [activeTab, setActiveTab] = useState('device');
  const [modal, setModal] = useState(null);
  const [modalMode, setModalMode] = useState('create');
  const [modalError, setModalError] = useState('');

  const [deviceTypes, setDeviceTypes] = useState([]);
  const [deviceModels, setDeviceModels] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);

  const [deviceSearch, setDeviceSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');

  const [loading, setLoading] = useState({
    device: false,
    model: false,
    service: false,
  });

  const [errors, setErrors] = useState({
    device: '',
    model: '',
    service: '',
  });

  const [editingItem, setEditingItem] = useState(null);
  const [deviceForm, setDeviceForm] = useState({ name: '' });
  const [modelForm, setModelForm] = useState({
    device_type_id: '',
    brand: '',
    model: '',
  });
  const [serviceForm, setServiceForm] = useState({ name: '' });

  const deviceTypeMap = useMemo(() => {
    return deviceTypes.reduce((acc, item) => {
      acc[item.id] = item.name;
      return acc;
    }, {});
  }, [deviceTypes]);

  const filteredDeviceTypes = useMemo(() => {
    const keyword = deviceSearch.trim().toLowerCase();
    if (!keyword) return deviceTypes;
    return deviceTypes.filter((item) =>
      String(item.name || '').toLowerCase().includes(keyword)
    );
  }, [deviceSearch, deviceTypes]);

  const filteredDeviceModels = useMemo(() => {
    const keyword = modelSearch.trim().toLowerCase();
    if (!keyword) return deviceModels;
    return deviceModels.filter((item) => {
      const brand = String(item.brand || '').toLowerCase();
      const model = String(item.model || '').toLowerCase();
      return brand.includes(keyword) || model.includes(keyword);
    });
  }, [deviceModels, modelSearch]);

  const filteredServiceTypes = useMemo(() => {
    const keyword = serviceSearch.trim().toLowerCase();
    if (!keyword) return serviceTypes;
    return serviceTypes.filter((item) =>
      String(item.name || '').toLowerCase().includes(keyword)
    );
  }, [serviceSearch, serviceTypes]);

  const getErrorMessage = (payload) => {
    if (!payload) return 'Request gagal.';
    if (typeof payload === 'string') return payload;
    if (payload.message) return payload.message;
    if (payload.errors) {
      try {
        return JSON.stringify(payload.errors);
      } catch (error) {
        return 'Request gagal.';
      }
    }
    return 'Request gagal.';
  };

  const setTabError = (tab, message) => {
    setErrors((prev) => ({
      ...prev,
      [tab]: message,
    }));
  };

  const setTabLoading = (tab, value) => {
    setLoading((prev) => ({
      ...prev,
      [tab]: value,
    }));
  };

  const fetchDeviceTypes = async () => {
    const cached = readCache(CACHE_KEYS.deviceTypes);
    if (cached?.length) {
      setDeviceTypes(cached);
      setTabError('device', '');
      setTabLoading('device', false);
      return;
    }

    setTabLoading('device', true);
    setTabError('device', '');
    try {
      const res = await apiRequest('/device-type');
      if (!res.ok || res.data?.success === false) {
        throw new Error(getErrorMessage(res.data));
      }
      const payload = unwrapApiData(res.data);
      const list = Array.isArray(payload) ? payload : [];
      setDeviceTypes(list);
      writeCache(CACHE_KEYS.deviceTypes, list);
    } catch (error) {
      setTabError('device', error.message || 'Gagal mengambil data.');
    } finally {
      setTabLoading('device', false);
    }
  };

  const fetchDeviceModels = async () => {
    const cached = readCache(CACHE_KEYS.deviceModels);
    if (cached?.length) {
      setDeviceModels(cached);
      setTabError('model', '');
      setTabLoading('model', false);
      return;
    }

    setTabLoading('model', true);
    setTabError('model', '');
    try {
      const res = await apiRequest('/device-model');
      if (!res.ok || res.data?.success === false) {
        throw new Error(getErrorMessage(res.data));
      }
      const payload = unwrapApiData(res.data);
      const list = Array.isArray(payload) ? payload : [];
      setDeviceModels(list);
      writeCache(CACHE_KEYS.deviceModels, list);
    } catch (error) {
      setTabError('model', error.message || 'Gagal mengambil data.');
    } finally {
      setTabLoading('model', false);
    }
  };

  const fetchServiceTypes = async () => {
    const cached = readCache(CACHE_KEYS.serviceTypes);
    if (cached?.length) {
      setServiceTypes(cached);
      setTabError('service', '');
      setTabLoading('service', false);
      return;
    }

    setTabLoading('service', true);
    setTabError('service', '');
    try {
      const res = await apiRequest('/references/service-types');
      if (!res.ok || res.data?.success === false) {
        throw new Error(getErrorMessage(res.data));
      }
      const payload = unwrapApiData(res.data);
      const list = Array.isArray(payload) ? payload : [];
      setServiceTypes(list);
      writeCache(CACHE_KEYS.serviceTypes, list);
    } catch (error) {
      setTabError('service', error.message || 'Gagal mengambil data.');
    } finally {
      setTabLoading('service', false);
    }
  };

  useEffect(() => {
    if (activeTab === 'device') {
      if (deviceTypes.length === 0) {
        fetchDeviceTypes();
      }
    }
    if (activeTab === 'model') {
      if (deviceModels.length === 0) {
        fetchDeviceModels();
      }
      if (deviceTypes.length === 0) {
        fetchDeviceTypes();
      }
    }
    if (activeTab === 'service') {
      if (serviceTypes.length === 0) {
        fetchServiceTypes();
      }
    }
  }, [activeTab, deviceModels.length, deviceTypes.length, serviceTypes.length]);

  const openModal = (mode = 'create', item = null) => {
    setModalError('');
    setModal(activeTab);
    setModalMode(mode);
    setEditingItem(item);

    if (activeTab === 'device') {
      setDeviceForm({ name: item?.name || '' });
    }

    if (activeTab === 'model') {
      setModelForm({
        device_type_id: item?.device_type_id || '',
        brand: item?.brand || '',
        model: item?.model || '',
      });
    }

    if (activeTab === 'service') {
      setServiceForm({ name: item?.name || '' });
    }
  };

  const closeModal = () => {
    setModal(null);
    setEditingItem(null);
    setModalError('');
  };

  const handleCreateDeviceType = async () => {
    const payload = { name: deviceForm.name.trim() };
    if (!payload.name) {
      setModalError('Nama perangkat wajib diisi.');
      return;
    }

    const tempId = `temp-${Date.now()}`;
    try {
      const optimisticItem = { id: tempId, name: payload.name, __optimistic: true };
      setDeviceTypes((prev) => [optimisticItem, ...prev]);
      closeModal();

      const res = await apiRequest('/device-type', {
        method: 'POST',
        body: payload,
      });
      if (!res.ok || res.data?.success === false) {
        throw new Error(getErrorMessage(res.data));
      }
      const created = unwrapApiData(res.data);
      if (created?.id) {
        setDeviceTypes((prev) => {
          const next = prev.map((item) => (item.id === tempId ? created : item));
          writeCache(CACHE_KEYS.deviceTypes, next);
          return next;
        });
      } else {
        await fetchDeviceTypes();
      }
    } catch (error) {
      setDeviceTypes((prev) => {
        const next = prev.filter((item) => item.id !== tempId);
        writeCache(CACHE_KEYS.deviceTypes, next);
        return next;
      });
      setTabError('device', error.message || 'Gagal menyimpan perangkat.');
    }
  };

  const handleUpdateDeviceType = async () => {
    if (!editingItem) return;
    const payload = { name: deviceForm.name.trim() };
    if (!payload.name) {
      setModalError('Nama perangkat wajib diisi.');
      return;
    }
    try {
      const res = await apiRequest(`/device-type/${editingItem.id}`, {
        method: 'PUT',
        body: payload,
      });
      if (!res.ok || res.data?.success === false) {
        throw new Error(getErrorMessage(res.data));
      }
      const updated = unwrapApiData(res.data) || payload;
      setDeviceTypes((prev) => {
        const next = prev.map((item) =>
          item.id === editingItem.id ? { ...item, ...updated } : item
        );
        writeCache(CACHE_KEYS.deviceTypes, next);
        return next;
      });
      closeModal();
    } catch (error) {
      setModalError(error.message || 'Gagal memperbarui perangkat.');
    }
  };

  const handleDeleteDeviceType = async (item) => {
    const confirmed = window.confirm(`Hapus perangkat "${item.name}"?`);
    if (!confirmed) return;
    const prevItems = deviceTypes;
    setDeviceTypes((prev) => {
      const next = prev.filter((entry) => entry.id !== item.id);
      writeCache(CACHE_KEYS.deviceTypes, next);
      return next;
    });
    try {
      const res = await apiRequest(`/device-type/${item.id}`, { method: 'DELETE' });
      if (!res.ok || res.data?.success === false) {
        throw new Error(getErrorMessage(res.data));
      }
    } catch (error) {
      setDeviceTypes(prevItems);
      writeCache(CACHE_KEYS.deviceTypes, prevItems);
      setTabError('device', error.message || 'Gagal menghapus perangkat.');
    }
  };

  const handleCreateDeviceModel = async () => {
    const payload = {
      device_type_id: Number(modelForm.device_type_id),
      brand: modelForm.brand.trim(),
      model: modelForm.model.trim(),
    };

    if (!payload.device_type_id || !payload.brand || !payload.model) {
      setModalError('Perangkat, brand, dan model wajib diisi.');
      return;
    }

    const tempId = `temp-${Date.now()}`;
    try {
      const optimisticItem = { ...payload, id: tempId, __optimistic: true };
      setDeviceModels((prev) => [optimisticItem, ...prev]);
      closeModal();

      const res = await apiRequest('/device-model', {
        method: 'POST',
        body: payload,
      });
      if (!res.ok || res.data?.success === false) {
        throw new Error(getErrorMessage(res.data));
      }
      const created = unwrapApiData(res.data);
      if (created?.id) {
        setDeviceModels((prev) => {
          const next = prev.map((item) => (item.id === tempId ? created : item));
          writeCache(CACHE_KEYS.deviceModels, next);
          return next;
        });
      } else {
        await fetchDeviceModels();
      }
    } catch (error) {
      setDeviceModels((prev) => {
        const next = prev.filter((item) => item.id !== tempId);
        writeCache(CACHE_KEYS.deviceModels, next);
        return next;
      });
      setTabError('model', error.message || 'Gagal menyimpan model.');
    }
  };

  const handleUpdateDeviceModel = async () => {
    if (!editingItem) return;
    const payload = {
      device_type_id: Number(modelForm.device_type_id),
      brand: modelForm.brand.trim(),
      model: modelForm.model.trim(),
    };

    if (!payload.device_type_id || !payload.brand || !payload.model) {
      setModalError('Perangkat, brand, dan model wajib diisi.');
      return;
    }

    try {
      const res = await apiRequest(`/device-model/${editingItem.id}`, {
        method: 'PUT',
        body: payload,
      });
      if (!res.ok || res.data?.success === false) {
        throw new Error(getErrorMessage(res.data));
      }
      const updated = unwrapApiData(res.data) || payload;
      setDeviceModels((prev) => {
        const next = prev.map((item) =>
          item.id === editingItem.id ? { ...item, ...updated } : item
        );
        writeCache(CACHE_KEYS.deviceModels, next);
        return next;
      });
      closeModal();
    } catch (error) {
      setModalError(error.message || 'Gagal memperbarui model.');
    }
  };

  const handleDeleteDeviceModel = async (item) => {
    const confirmed = window.confirm(`Hapus model "${item.brand} ${item.model}"?`);
    if (!confirmed) return;
    const prevItems = deviceModels;
    setDeviceModels((prev) => {
      const next = prev.filter((entry) => entry.id !== item.id);
      writeCache(CACHE_KEYS.deviceModels, next);
      return next;
    });
    try {
      const res = await apiRequest(`/device-model/${item.id}`, { method: 'DELETE' });
      if (!res.ok || res.data?.success === false) {
        throw new Error(getErrorMessage(res.data));
      }
    } catch (error) {
      setDeviceModels(prevItems);
      writeCache(CACHE_KEYS.deviceModels, prevItems);
      setTabError('model', error.message || 'Gagal menghapus model.');
    }
  };

  const handleServiceReadOnly = () => {
    setModalError('Endpoint untuk tambah/edit service type belum tersedia di API.');
  };

  const renderStatusRow = (message) => (
    <div className="admin-master-row">
      <div className="admin-master-empty">{message}</div>
    </div>
  );

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
            <div className="admin-master-subtitle">
              API: {API_BASE_URL}
            </div>
            {errors[activeTab] && (
              <div className="admin-master-error">{errors[activeTab]}</div>
            )}
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
                <input
                  type="text"
                  placeholder="Cari"
                  aria-label="Search"
                  value={activeTab === 'model' ? modelSearch : serviceSearch}
                  onChange={(event) =>
                    activeTab === 'model'
                      ? setModelSearch(event.target.value)
                      : setServiceSearch(event.target.value)
                  }
                />
                <i className="bi bi-search"></i>
              </div>
            )}

            {activeTab === 'device' && (
              <div className="admin-search-box">
                <input
                  type="text"
                  placeholder="Cari"
                  aria-label="Search"
                  value={deviceSearch}
                  onChange={(event) => setDeviceSearch(event.target.value)}
                />
                <i className="bi bi-search"></i>
              </div>
            )}

            <button
              className="admin-master-add"
              type="button"
              onClick={() => openModal('create')}
              disabled={activeTab === 'service'}
              title={
                activeTab === 'service'
                  ? 'Service type belum punya endpoint tambah/edit'
                  : 'Tambah data'
              }
            >
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
              {loading.device && filteredDeviceTypes.length === 0 &&
                renderStatusRow('Memuat data...')}
              {!loading.device && !errors.device && filteredDeviceTypes.length === 0
                ? renderStatusRow('Data kosong.')
                : filteredDeviceTypes.map((row) => (
                    <div className="admin-master-row" key={row.id}>
                      <div>{row.name}</div>
                      <div className="admin-master-actions-cell">
                        <button
                          type="button"
                          className="admin-master-icon"
                          onClick={() => openModal('edit', row)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          type="button"
                          className="admin-master-icon"
                          onClick={() => handleDeleteDeviceType(row)}
                        >
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
              {loading.model && filteredDeviceModels.length === 0 &&
                renderStatusRow('Memuat data...')}
              {!loading.model && !errors.model && filteredDeviceModels.length === 0
                ? renderStatusRow('Data kosong.')
                : filteredDeviceModels.map((row) => (
                    <div className="admin-master-row admin-master-model-row" key={row.id}>
                      <div>{deviceTypeMap[row.device_type_id] || '-'}</div>
                      <div>{row.brand}</div>
                      <div>{row.model}</div>
                      <div className="admin-master-actions-cell">
                        <button
                          type="button"
                          className="admin-master-icon"
                          onClick={() => openModal('edit', row)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          type="button"
                          className="admin-master-icon"
                          onClick={() => handleDeleteDeviceModel(row)}
                        >
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
              {loading.service && filteredServiceTypes.length === 0 && renderStatusRow('Memuat data...')}
              {!loading.service && !errors.service && filteredServiceTypes.length === 0
                ? renderStatusRow('Data kosong.')
                : filteredServiceTypes.map((row) => (
                    <div className="admin-master-row" key={row.id}>
                      <div>{row.name}</div>
                      <div className="admin-master-actions-cell">
                        <button
                          type="button"
                          className="admin-master-icon is-disabled"
                          disabled
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          type="button"
                          className="admin-master-icon is-disabled"
                          disabled
                        >
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
        <h2>{modalMode === 'edit' ? 'Edit Perangkat' : 'Tambah Perangkat'}</h2>
        <p>Tambahkan perangkat ...</p>
        {modalError && <div className="admin-modal-error">{modalError}</div>}
        <div className="admin-modal-field">
          <label>Nama</label>
          <input
            type="text"
            placeholder="Masukkan nama perangkat"
            value={deviceForm.name}
            onChange={(event) => setDeviceForm({ name: event.target.value })}
          />
        </div>
        <div className="admin-modal-actions">
          <button
            className="admin-modal-save"
            type="button"
            onClick={modalMode === 'edit' ? handleUpdateDeviceType : handleCreateDeviceType}
          >
            Simpan
          </button>
        </div>
      </Modal>

      <Modal isOpen={modal === 'model'} onClose={closeModal} className="admin-modal">
        <button className="admin-modal-close" type="button" onClick={closeModal}>
          <i className="bi bi-x"></i>
        </button>
        <h2>{modalMode === 'edit' ? 'Edit Model' : 'Tambah Model'}</h2>
        <p>Tambahkan model ...</p>
        {modalError && <div className="admin-modal-error">{modalError}</div>}
        <div className="admin-modal-field">
          <label>Perangkat</label>
          <select
            value={modelForm.device_type_id}
            onChange={(event) =>
              setModelForm((prev) => ({
                ...prev,
                device_type_id: event.target.value,
              }))
            }
          >
            <option value="">Pilih</option>
            {deviceTypes.map((deviceType) => (
              <option key={deviceType.id} value={deviceType.id}>
                {deviceType.name}
              </option>
            ))}
          </select>
        </div>
        <div className="admin-modal-field">
          <label>Brand/ merk</label>
          <input
            type="text"
            placeholder="Masukkan nama Merk"
            value={modelForm.brand}
            onChange={(event) =>
              setModelForm((prev) => ({
                ...prev,
                brand: event.target.value,
              }))
            }
          />
        </div>
        <div className="admin-modal-field">
          <label>Nama Model</label>
          <input
            type="text"
            placeholder="Masukkan nama model"
            value={modelForm.model}
            onChange={(event) =>
              setModelForm((prev) => ({
                ...prev,
                model: event.target.value,
              }))
            }
          />
        </div>
        <div className="admin-modal-actions">
          <button
            className="admin-modal-save"
            type="button"
            onClick={modalMode === 'edit' ? handleUpdateDeviceModel : handleCreateDeviceModel}
          >
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
        {modalError && <div className="admin-modal-error">{modalError}</div>}
        <div className="admin-modal-field">
          <label>Jenis</label>
          <input
            type="text"
            placeholder="Masukkan nama jenis servicenya"
            value={serviceForm.name}
            onChange={(event) => setServiceForm({ name: event.target.value })}
          />
        </div>
        <div className="admin-modal-actions">
          <button className="admin-modal-save" type="button" onClick={handleServiceReadOnly}>
            Simpan
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default MasterData;
