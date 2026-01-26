import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import './MasterData.css';
import { Modal, Pagination } from '../../../components/common';
import { apiRequest, unwrapApiData, unwrapApiMeta, parseApiError } from '../../../lib/api';
import { clearReferenceCache } from '../../../lib/referenceApi';

const DEFAULT_PER_PAGE = 10;

const TABS = [
  { id: 'device-type', label: 'Perangkat' },
  { id: 'model', label: 'Model' },
  { id: 'device', label: 'Device' },
  { id: 'vendor', label: 'Vendor' },
  { id: 'department', label: 'Departemen' },
  { id: 'service', label: 'Service' },
];

const MasterData = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'device-type';
  const search = searchParams.get('search') || '';
  const page = Number(searchParams.get('page') || 1);
  const perPage = Number(searchParams.get('per_page') || DEFAULT_PER_PAGE);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [metaMap, setMetaMap] = useState({});

  const [deviceTypes, setDeviceTypes] = useState([]);
  const [deviceModels, setDeviceModels] = useState([]);
  const [devices, setDevices] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);

  const [deviceTypeOptions, setDeviceTypeOptions] = useState([]);
  const [deviceModelOptions, setDeviceModelOptions] = useState([]);

  const [modal, setModal] = useState(null);
  const [modalMode, setModalMode] = useState('create');
  const [modalError, setModalError] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [deviceTypeForm, setDeviceTypeForm] = useState({ name: '' });
  const [deviceModelForm, setDeviceModelForm] = useState({
    device_type_id: '',
    brand: '',
    model: '',
  });
  const [deviceForm, setDeviceForm] = useState({
    device_model_id: '',
    serial_number: '',
  });
  const [vendorForm, setVendorForm] = useState({
    name: '',
    maps_url: '',
    description: '',
  });
  const [departmentForm, setDepartmentForm] = useState({
    name: '',
    code: '',
  });

  const updateParams = (next) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    setSearchParams(params);
  };

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [typeRes, modelRes] = await Promise.all([
          apiRequest('/device-type?per_page=200'),
          apiRequest('/device-model?per_page=200'),
        ]);

        if (typeRes.ok && typeRes.data?.success !== false) {
          const list = unwrapApiData(typeRes.data);
          setDeviceTypeOptions(Array.isArray(list) ? list : []);
        }

        if (modelRes.ok && modelRes.data?.success !== false) {
          const list = unwrapApiData(modelRes.data);
          setDeviceModelOptions(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        // silently ignore option load failures
      }
    };
    loadOptions();
  }, []);

  useEffect(() => {
    const fetchTabData = async () => {
      setLoading(true);
      setErrors((prev) => ({ ...prev, [activeTab]: '' }));
      try {
        let res;
        if (activeTab === 'device-type') {
          const query = new URLSearchParams();
          query.set('page', String(page));
          query.set('per_page', String(perPage));
          if (search) query.set('search', search);
          res = await apiRequest(`/device-type?${query.toString()}`);
          if (!res.ok || res.data?.success === false) {
            throw new Error(parseApiError(res.data));
          }
          const list = unwrapApiData(res.data);
          setDeviceTypes(Array.isArray(list) ? list : []);
          setMetaMap((prev) => ({ ...prev, 'device-type': unwrapApiMeta(res.data) }));
        }

        if (activeTab === 'model') {
          const query = new URLSearchParams();
          query.set('page', String(page));
          query.set('per_page', String(perPage));
          if (search) query.set('keyword', search);
          res = await apiRequest(`/device-model?${query.toString()}`);
          if (!res.ok || res.data?.success === false) {
            throw new Error(parseApiError(res.data));
          }
          const list = unwrapApiData(res.data);
          setDeviceModels(Array.isArray(list) ? list : []);
          setMetaMap((prev) => ({ ...prev, model: unwrapApiMeta(res.data) }));
        }

        if (activeTab === 'device') {
          const query = new URLSearchParams();
          query.set('page', String(page));
          query.set('per_page', String(perPage));
          if (search) query.set('serial-number', search);
          res = await apiRequest(`/devices?${query.toString()}`);
          if (!res.ok || res.data?.success === false) {
            throw new Error(parseApiError(res.data));
          }
          const list = unwrapApiData(res.data);
          setDevices(Array.isArray(list) ? list : []);
          setMetaMap((prev) => ({ ...prev, device: unwrapApiMeta(res.data) }));
        }

        if (activeTab === 'vendor') {
          const query = new URLSearchParams();
          query.set('page', String(page));
          query.set('per_page', String(perPage));
          if (search) query.set('search', search);
          res = await apiRequest(`/vendors?${query.toString()}`);
          if (!res.ok || res.data?.success === false) {
            throw new Error(parseApiError(res.data));
          }
          const list = unwrapApiData(res.data);
          setVendors(Array.isArray(list) ? list : []);
          setMetaMap((prev) => ({ ...prev, vendor: unwrapApiMeta(res.data) }));
        }

        if (activeTab === 'department') {
          const query = new URLSearchParams();
          query.set('page', String(page));
          query.set('per_page', String(perPage));
          if (search) query.set('search', search);
          res = await apiRequest(`/departments?${query.toString()}`);
          if (!res.ok || res.data?.success === false) {
            throw new Error(parseApiError(res.data));
          }
          const list = unwrapApiData(res.data);
          setDepartments(Array.isArray(list) ? list : []);
          setMetaMap((prev) => ({ ...prev, department: unwrapApiMeta(res.data) }));
        }

        if (activeTab === 'service') {
          res = await apiRequest('/references/service-types');
          if (!res.ok || res.data?.success === false) {
            throw new Error(parseApiError(res.data));
          }
          const list = unwrapApiData(res.data);
          setServiceTypes(Array.isArray(list) ? list : []);
          setMetaMap((prev) => ({ ...prev, service: null }));
        }
      } catch (err) {
        setErrors((prev) => ({
          ...prev,
          [activeTab]: err.message || 'Gagal mengambil data.',
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchTabData();
  }, [activeTab, page, perPage, search, reloadToken]);

  const deviceTypeMap = useMemo(() => {
    return deviceTypeOptions.reduce((acc, item) => {
      acc[item.id] = item.name;
      return acc;
    }, {});
  }, [deviceTypeOptions]);

  const deviceModelMap = useMemo(() => {
    return deviceModelOptions.reduce((acc, item) => {
      acc[item.id] = `${item.brand} ${item.model}`.trim();
      return acc;
    }, {});
  }, [deviceModelOptions]);

  const currentMeta = metaMap[activeTab];
  const currentError = errors[activeTab];

  const openModal = (tab, mode = 'create', item = null) => {
    setModalError('');
    setModal(tab);
    setModalMode(mode);
    setEditingItem(item);

    if (tab === 'device-type') {
      setDeviceTypeForm({ name: item?.name || '' });
    }

    if (tab === 'model') {
      setDeviceModelForm({
        device_type_id: item?.device_type_id || '',
        brand: item?.brand || '',
        model: item?.model || '',
      });
    }

    if (tab === 'device') {
      setDeviceForm({
        device_model_id: item?.device_model_id || '',
        serial_number: item?.serial_number || '',
      });
    }

    if (tab === 'vendor') {
      setVendorForm({
        name: item?.name || '',
        maps_url: item?.maps_url || '',
        description: item?.description || '',
      });
    }

    if (tab === 'department') {
      setDepartmentForm({
        name: item?.name || '',
        code: item?.code || '',
      });
    }
  };

  const closeModal = () => {
    setModal(null);
    setEditingItem(null);
    setModalError('');
  };

  const refreshActiveTab = () => {
    updateParams({ page: 1 });
    setReloadToken((prev) => prev + 1);
  };

  const handleSubmit = async () => {
    setModalError('');
    try {
      if (modal === 'device-type') {
        const payload = { name: deviceTypeForm.name.trim() };
        if (!payload.name) {
          setModalError('Nama perangkat wajib diisi.');
          return;
        }
        const res = await apiRequest(
          modalMode === 'edit' ? `/device-type/${editingItem.id}` : '/device-type',
          {
            method: modalMode === 'edit' ? 'PUT' : 'POST',
            body: payload,
          }
        );
        if (!res.ok || res.data?.success === false) {
          throw new Error(parseApiError(res.data));
        }
      }

      if (modal === 'model') {
        const payload = {
          device_type_id: Number(deviceModelForm.device_type_id),
          brand: deviceModelForm.brand.trim(),
          model: deviceModelForm.model.trim(),
        };
        if (!payload.device_type_id || !payload.brand || !payload.model) {
          setModalError('Perangkat, brand, dan model wajib diisi.');
          return;
        }
        const res = await apiRequest(
          modalMode === 'edit' ? `/device-model/${editingItem.id}` : '/device-model',
          {
            method: modalMode === 'edit' ? 'PUT' : 'POST',
            body: payload,
          }
        );
        if (!res.ok || res.data?.success === false) {
          throw new Error(parseApiError(res.data));
        }
      }

      if (modal === 'device') {
        const payload = {
          device_model_id: Number(deviceForm.device_model_id),
          serial_number: deviceForm.serial_number.trim(),
        };
        if (!payload.device_model_id || !payload.serial_number) {
          setModalError('Model dan serial number wajib diisi.');
          return;
        }
        const res = await apiRequest(
          modalMode === 'edit' ? `/devices/${editingItem.id}` : '/devices',
          {
            method: modalMode === 'edit' ? 'PUT' : 'POST',
            body: payload,
          }
        );
        if (!res.ok || res.data?.success === false) {
          throw new Error(parseApiError(res.data));
        }
      }

      if (modal === 'vendor') {
        const payload = {
          name: vendorForm.name.trim(),
          maps_url: vendorForm.maps_url.trim(),
          description: vendorForm.description.trim(),
        };
        if (!payload.name || !payload.maps_url || !payload.description) {
          setModalError('Nama, maps url, dan deskripsi wajib diisi.');
          return;
        }
        const res = await apiRequest(
          modalMode === 'edit' ? `/vendors/${editingItem.id}` : '/vendors',
          {
            method: modalMode === 'edit' ? 'PUT' : 'POST',
            body: payload,
          }
        );
        if (!res.ok || res.data?.success === false) {
          throw new Error(parseApiError(res.data));
        }
      }

      if (modal === 'department') {
        const payload = {
          name: departmentForm.name.trim(),
          code: departmentForm.code.trim(),
        };
        if (!payload.name || !payload.code) {
          setModalError('Nama dan kode departemen wajib diisi.');
          return;
        }
        const res = await apiRequest(
          modalMode === 'edit' ? `/departments/${editingItem.id}` : '/departments',
          {
            method: modalMode === 'edit' ? 'PUT' : 'POST',
            body: payload,
          }
        );
        if (!res.ok || res.data?.success === false) {
          throw new Error(parseApiError(res.data));
        }
      }

      clearReferenceCache();
      closeModal();
      refreshActiveTab();
    } catch (err) {
      setModalError(err.message || 'Gagal menyimpan data.');
    }
  };

  const handleDelete = async (tab, item) => {
    const confirmed = window.confirm('Hapus data ini?');
    if (!confirmed) return;
    try {
      let endpoint = '';
      if (tab === 'device-type') endpoint = `/device-type/${item.id}`;
      if (tab === 'model') endpoint = `/device-model/${item.id}`;
      if (tab === 'device') endpoint = `/devices/${item.id}`;
      if (tab === 'vendor') endpoint = `/vendors/${item.id}`;
      if (tab === 'department') endpoint = `/departments/${item.id}`;
      const res = await apiRequest(endpoint, { method: 'DELETE' });
      if (!res.ok || res.data?.success === false) {
        throw new Error(parseApiError(res.data));
      }
      clearReferenceCache();
      refreshActiveTab();
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        [activeTab]: err.message || 'Gagal menghapus data.',
      }));
    }
  };

  const renderEmptyRow = (message) => (
    <div className="admin-master-row">
      <div className="admin-master-empty">{message}</div>
    </div>
  );

  return (
    <div className="admin-master-page">
      <h1>Master Data</h1>

      <section className="admin-master-card">
        <div className="admin-master-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`admin-master-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => updateParams({ tab: tab.id, page: 1, search: '' })}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="admin-master-toolbar">
          <div>
            <div className="admin-master-title">
              {TABS.find((tab) => tab.id === activeTab)?.label}
            </div>
            {currentError && (
              <div className="admin-master-error">{currentError}</div>
            )}
          </div>

          <div className="admin-master-actions">
            {activeTab !== 'service' && (
              <div className="admin-search-box">
                <input
                  type="text"
                  placeholder="Cari"
                  aria-label="Search"
                  value={search}
                  onChange={(event) => updateParams({ search: event.target.value, page: 1 })}
                />
                <i className="bi bi-search"></i>
              </div>
            )}

            <button
              className="admin-master-add"
              type="button"
              onClick={() => openModal(activeTab, 'create')}
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
          {activeTab === 'device-type' && (
            <>
              <div className="admin-master-row admin-master-head">
                <div>Nama</div>
                <div className="admin-master-action-col">Aksi</div>
              </div>
              {loading && renderEmptyRow('Memuat data...')}
              {!loading && !currentError && deviceTypes.length === 0
                ? renderEmptyRow('Data kosong.')
                : deviceTypes.map((row) => (
                    <div className="admin-master-row" key={row.id}>
                      <div>{row.name}</div>
                      <div className="admin-master-actions-cell">
                        <button
                          type="button"
                          className="admin-master-icon"
                          onClick={() => openModal('device-type', 'edit', row)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          type="button"
                          className="admin-master-icon"
                          onClick={() => handleDelete('device-type', row)}
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
              {loading && renderEmptyRow('Memuat data...')}
              {!loading && !currentError && deviceModels.length === 0
                ? renderEmptyRow('Data kosong.')
                : deviceModels.map((row) => (
                    <div className="admin-master-row admin-master-model-row" key={row.id}>
                      <div>{deviceTypeMap[row.device_type_id] || '-'}</div>
                      <div>{row.brand}</div>
                      <div>{row.model}</div>
                      <div className="admin-master-actions-cell">
                        <button
                          type="button"
                          className="admin-master-icon"
                          onClick={() => openModal('model', 'edit', row)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          type="button"
                          className="admin-master-icon"
                          onClick={() => handleDelete('model', row)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
            </>
          )}

          {activeTab === 'device' && (
            <>
              <div className="admin-master-row admin-master-head admin-master-model-head">
                <div>Model</div>
                <div>Serial Number</div>
                <div className="admin-master-action-col">Aksi</div>
              </div>
              {loading && renderEmptyRow('Memuat data...')}
              {!loading && !currentError && devices.length === 0
                ? renderEmptyRow('Data kosong.')
                : devices.map((row) => (
                    <div className="admin-master-row admin-master-model-row" key={row.id}>
                      <div>{row.device_model ? `${row.device_model.brand} ${row.device_model.model}` : deviceModelMap[row.device_model_id] || '-'}</div>
                      <div>{row.serial_number}</div>
                      <div className="admin-master-actions-cell">
                        <button
                          type="button"
                          className="admin-master-icon"
                          onClick={() => openModal('device', 'edit', row)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          type="button"
                          className="admin-master-icon"
                          onClick={() => handleDelete('device', row)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
            </>
          )}

          {activeTab === 'vendor' && (
            <>
              <div className="admin-master-row admin-master-head admin-master-model-head">
                <div>Nama</div>
                <div>Maps URL</div>
                <div className="admin-master-action-col">Aksi</div>
              </div>
              {loading && renderEmptyRow('Memuat data...')}
              {!loading && !currentError && vendors.length === 0
                ? renderEmptyRow('Data kosong.')
                : vendors.map((row) => (
                    <div className="admin-master-row admin-master-model-row" key={row.id}>
                      <div>{row.name}</div>
                      <div>{row.maps_url || '-'}</div>
                      <div className="admin-master-actions-cell">
                        <button
                          type="button"
                          className="admin-master-icon"
                          onClick={() => openModal('vendor', 'edit', row)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          type="button"
                          className="admin-master-icon"
                          onClick={() => handleDelete('vendor', row)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
            </>
          )}

          {activeTab === 'department' && (
            <>
              <div className="admin-master-row admin-master-head admin-master-model-head">
                <div>Nama</div>
                <div>Kode</div>
                <div className="admin-master-action-col">Aksi</div>
              </div>
              {loading && renderEmptyRow('Memuat data...')}
              {!loading && !currentError && departments.length === 0
                ? renderEmptyRow('Data kosong.')
                : departments.map((row) => (
                    <div className="admin-master-row admin-master-model-row" key={row.id}>
                      <div>{row.name}</div>
                      <div>{row.code}</div>
                      <div className="admin-master-actions-cell">
                        <button
                          type="button"
                          className="admin-master-icon"
                          onClick={() => openModal('department', 'edit', row)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          type="button"
                          className="admin-master-icon"
                          onClick={() => handleDelete('department', row)}
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
              {loading && renderEmptyRow('Memuat data...')}
              {!loading && !currentError && serviceTypes.length === 0
                ? renderEmptyRow('Data kosong.')
                : serviceTypes.map((row) => (
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

        {currentMeta && (
          <Pagination
            meta={currentMeta}
            onPageChange={(nextPage) => updateParams({ page: nextPage })}
          />
        )}
      </section>

      <Modal isOpen={modal === 'device-type'} onClose={closeModal} className="admin-modal">
        <button className="admin-modal-close" type="button" onClick={closeModal}>
          <i className="bi bi-x"></i>
        </button>
        <h2>{modalMode === 'edit' ? 'Edit Perangkat' : 'Tambah Perangkat'}</h2>
        {modalError && <div className="admin-modal-error">{modalError}</div>}
        <div className="admin-modal-field">
          <label>Nama</label>
          <input
            type="text"
            placeholder="Masukkan nama perangkat"
            value={deviceTypeForm.name}
            onChange={(event) => setDeviceTypeForm({ name: event.target.value })}
          />
        </div>
        <div className="admin-modal-actions">
          <button className="admin-modal-save" type="button" onClick={handleSubmit}>
            Simpan
          </button>
        </div>
      </Modal>

      <Modal isOpen={modal === 'model'} onClose={closeModal} className="admin-modal">
        <button className="admin-modal-close" type="button" onClick={closeModal}>
          <i className="bi bi-x"></i>
        </button>
        <h2>{modalMode === 'edit' ? 'Edit Model' : 'Tambah Model'}</h2>
        {modalError && <div className="admin-modal-error">{modalError}</div>}
        <div className="admin-modal-field">
          <label>Perangkat</label>
          <select
            value={deviceModelForm.device_type_id}
            onChange={(event) =>
              setDeviceModelForm((prev) => ({
                ...prev,
                device_type_id: event.target.value,
              }))
            }
          >
            <option value="">Pilih</option>
            {deviceTypeOptions.map((deviceType) => (
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
            value={deviceModelForm.brand}
            onChange={(event) =>
              setDeviceModelForm((prev) => ({
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
            value={deviceModelForm.model}
            onChange={(event) =>
              setDeviceModelForm((prev) => ({
                ...prev,
                model: event.target.value,
              }))
            }
          />
        </div>
        <div className="admin-modal-actions">
          <button className="admin-modal-save" type="button" onClick={handleSubmit}>
            Simpan
          </button>
        </div>
      </Modal>

      <Modal isOpen={modal === 'device'} onClose={closeModal} className="admin-modal">
        <button className="admin-modal-close" type="button" onClick={closeModal}>
          <i className="bi bi-x"></i>
        </button>
        <h2>{modalMode === 'edit' ? 'Edit Device' : 'Tambah Device'}</h2>
        {modalError && <div className="admin-modal-error">{modalError}</div>}
        <div className="admin-modal-field">
          <label>Model</label>
          <select
            value={deviceForm.device_model_id}
            onChange={(event) =>
              setDeviceForm((prev) => ({
                ...prev,
                device_model_id: event.target.value,
              }))
            }
          >
            <option value="">Pilih</option>
            {deviceModelOptions.map((model) => (
              <option key={model.id} value={model.id}>
                {model.brand} {model.model}
              </option>
            ))}
          </select>
        </div>
        <div className="admin-modal-field">
          <label>Serial Number</label>
          <input
            type="text"
            placeholder="Masukkan serial number"
            value={deviceForm.serial_number}
            onChange={(event) =>
              setDeviceForm((prev) => ({
                ...prev,
                serial_number: event.target.value,
              }))
            }
          />
        </div>
        <div className="admin-modal-actions">
          <button className="admin-modal-save" type="button" onClick={handleSubmit}>
            Simpan
          </button>
        </div>
      </Modal>

      <Modal isOpen={modal === 'vendor'} onClose={closeModal} className="admin-modal">
        <button className="admin-modal-close" type="button" onClick={closeModal}>
          <i className="bi bi-x"></i>
        </button>
        <h2>{modalMode === 'edit' ? 'Edit Vendor' : 'Tambah Vendor'}</h2>
        {modalError && <div className="admin-modal-error">{modalError}</div>}
        <div className="admin-modal-field">
          <label>Nama</label>
          <input
            type="text"
            placeholder="Masukkan nama vendor"
            value={vendorForm.name}
            onChange={(event) => setVendorForm((prev) => ({ ...prev, name: event.target.value }))}
          />
        </div>
        <div className="admin-modal-field">
          <label>Maps URL</label>
          <input
            type="text"
            placeholder="Masukkan maps url"
            value={vendorForm.maps_url}
            onChange={(event) => setVendorForm((prev) => ({ ...prev, maps_url: event.target.value }))}
          />
        </div>
        <div className="admin-modal-field">
          <label>Deskripsi</label>
          <textarea
            rows={3}
            value={vendorForm.description}
            onChange={(event) => setVendorForm((prev) => ({ ...prev, description: event.target.value }))}
          />
        </div>
        <div className="admin-modal-actions">
          <button className="admin-modal-save" type="button" onClick={handleSubmit}>
            Simpan
          </button>
        </div>
      </Modal>

      <Modal isOpen={modal === 'department'} onClose={closeModal} className="admin-modal">
        <button className="admin-modal-close" type="button" onClick={closeModal}>
          <i className="bi bi-x"></i>
        </button>
        <h2>{modalMode === 'edit' ? 'Edit Departemen' : 'Tambah Departemen'}</h2>
        {modalError && <div className="admin-modal-error">{modalError}</div>}
        <div className="admin-modal-field">
          <label>Nama</label>
          <input
            type="text"
            placeholder="Masukkan nama departemen"
            value={departmentForm.name}
            onChange={(event) => setDepartmentForm((prev) => ({ ...prev, name: event.target.value }))}
          />
        </div>
        <div className="admin-modal-field">
          <label>Kode</label>
          <input
            type="text"
            placeholder="Masukkan kode departemen"
            value={departmentForm.code}
            onChange={(event) => setDepartmentForm((prev) => ({ ...prev, code: event.target.value }))}
          />
        </div>
        <div className="admin-modal-actions">
          <button className="admin-modal-save" type="button" onClick={handleSubmit}>
            Simpan
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default MasterData;
