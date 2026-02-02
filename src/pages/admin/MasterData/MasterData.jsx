import React, { useEffect, useMemo, useState } from 'react';
import './MasterData.css';
import { Modal } from '../../../components/common';
import { authenticatedRequest, unwrapApiData, API_BASE_URL } from '../../../lib/api';
import globalCache from '../../../lib/globalCache';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes for master data

// Wrapper functions to use globalCache
const readCache = (key) => globalCache.get(key);
const writeCache = (key, data) => {
  const safeData = Array.isArray(data)
    ? data.filter((item) => !item?.__optimistic)
    : [];
  globalCache.set(key, safeData, CACHE_TTL_MS);
};

const CACHE_KEYS = {
  deviceTypes: 'master-data:device-types',
  deviceModels: 'master-data:device-models',
  serviceTypes: 'master-data:service-types',
  vendors: 'master-data:vendors',
  departments: 'master-data:departments',
};

const MasterData = () => {
  const [activeTab, setActiveTab] = useState('device');
  const [modal, setModal] = useState(null);
  const [modalMode, setModalMode] = useState('create');
  const [modalError, setModalError] = useState('');

  const [deviceTypes, setDeviceTypes] = useState([]);
  const [deviceModels, setDeviceModels] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [deviceSearch, setDeviceSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [vendorSearch, setVendorSearch] = useState('');
  const [departmentSearch, setDepartmentSearch] = useState('');

  const [loading, setLoading] = useState({
    device: false,
    model: false,
    service: false,
    vendor: false,
    department: false,
  });

  const [errors, setErrors] = useState({
    device: '',
    model: '',
    service: '',
    vendor: '',
    department: '',
  });

  const [editingItem, setEditingItem] = useState(null);
  const [deviceForm, setDeviceForm] = useState({ name: '' });
  const [modelForm, setModelForm] = useState({
    device_type_id: '',
    brand: '',
    model: '',
  });
  const [serviceForm, setServiceForm] = useState({ name: '' });
  const [vendorForm, setVendorForm] = useState({
    name: '',
    maps_url: '',
    description: '',
  });
  const [departmentForm, setDepartmentForm] = useState({
    name: '',
    code: '',
  });

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

  const filteredVendors = useMemo(() => {
    const keyword = vendorSearch.trim().toLowerCase();
    if (!keyword) return vendors;
    return vendors.filter((item) => {
      const name = String(item.name || '').toLowerCase();
      const mapsUrl = String(item.maps_url || '').toLowerCase();
      const description = String(item.description || '').toLowerCase();
      return name.includes(keyword) || mapsUrl.includes(keyword) || description.includes(keyword);
    });
  }, [vendorSearch, vendors]);

  const filteredDepartments = useMemo(() => {
    const keyword = departmentSearch.trim().toLowerCase();
    if (!keyword) return departments;
    return departments.filter((item) => {
      const name = String(item.name || '').toLowerCase();
      const code = String(item.code || '').toLowerCase();
      return name.includes(keyword) || code.includes(keyword);
    });
  }, [departmentSearch, departments]);

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
      const res = await authenticatedRequest('/device-type');
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
      const res = await authenticatedRequest('/device-model');
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
      const res = await authenticatedRequest('/references/service-types');
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

  const fetchVendors = async () => {
    const cached = readCache(CACHE_KEYS.vendors);
    if (cached?.length) {
      setVendors(cached);
      setTabError('vendor', '');
      setTabLoading('vendor', false);
      return;
    }

    setTabLoading('vendor', true);
    setTabError('vendor', '');
    try {
      const res = await authenticatedRequest('/vendors?per_page=200');
      if (!res.ok) {
        throw new Error(getErrorMessage(res.data));
      }

      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setVendors(list);
      writeCache(CACHE_KEYS.vendors, list);
    } catch (error) {
      setTabError('vendor', error.message || 'Gagal mengambil data vendor.');
    } finally {
      setTabLoading('vendor', false);
    }
  };

  const fetchDepartments = async () => {
    const cached = readCache(CACHE_KEYS.departments);
    if (cached?.length) {
      setDepartments(cached);
      setTabError('department', '');
      setTabLoading('department', false);
      return;
    }

    setTabLoading('department', true);
    setTabError('department', '');
    try {
      const res = await authenticatedRequest('/departments?per_page=200');
      if (!res.ok || res.data?.success === false) {
        throw new Error(getErrorMessage(res.data));
      }
      const payload = unwrapApiData(res.data);
      const list = Array.isArray(payload) ? payload : [];
      setDepartments(list);
      writeCache(CACHE_KEYS.departments, list);
    } catch (error) {
      setTabError('department', error.message || 'Gagal mengambil data departemen.');
    } finally {
      setTabLoading('department', false);
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

    if (activeTab === 'vendor') {
      if (vendors.length === 0) {
        fetchVendors();
      }
    }

    if (activeTab === 'department') {
      if (departments.length === 0) {
        fetchDepartments();
      }
    }
  }, [
    activeTab,
    deviceModels.length,
    deviceTypes.length,
    serviceTypes.length,
    vendors.length,
    departments.length,
  ]);

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

    if (activeTab === 'vendor') {
      setVendorForm({
        name: item?.name || '',
        maps_url: item?.maps_url || '',
        description: item?.description || '',
      });
    }

    if (activeTab === 'department') {
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

      const res = await authenticatedRequest('/device-type', {
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
      const res = await authenticatedRequest(`/device-type/${editingItem.id}`, {
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
      const res = await authenticatedRequest(`/device-type/${item.id}`, { method: 'DELETE' });
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

      const res = await authenticatedRequest('/device-model', {
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
      const res = await authenticatedRequest(`/device-model/${editingItem.id}`, {
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
      const res = await authenticatedRequest(`/device-model/${item.id}`, { method: 'DELETE' });
      if (!res.ok || res.data?.success === false) {
        throw new Error(getErrorMessage(res.data));
      }
    } catch (error) {
      setDeviceModels(prevItems);
      writeCache(CACHE_KEYS.deviceModels, prevItems);
      setTabError('model', error.message || 'Gagal menghapus model.');
    }
  };

  const handleCreateServiceType = async () => {
    const payload = { name: serviceForm.name.trim() };
    if (!payload.name) {
      setModalError('Nama service wajib diisi.');
      return;
    }

    const tempId = `temp-${Date.now()}`;
    try {
      const optimisticItem = { id: tempId, name: payload.name, __optimistic: true };
      setServiceTypes((prev) => [optimisticItem, ...prev]);
      closeModal();

      const res = await authenticatedRequest('/references/service-types', {
        method: 'POST',
        body: payload,
      });
      if (!res.ok || res.data?.success === false) {
        throw new Error(getErrorMessage(res.data));
      }

      const created = unwrapApiData(res.data);
      if (created?.id) {
        setServiceTypes((prev) => {
          const next = prev.map((item) => (item.id === tempId ? created : item));
          writeCache(CACHE_KEYS.serviceTypes, next);
          return next;
        });
      } else {
        await fetchServiceTypes();
      }
    } catch (error) {
      setServiceTypes((prev) => {
        const next = prev.filter((item) => item.id !== tempId);
        writeCache(CACHE_KEYS.serviceTypes, next);
        return next;
      });
      setTabError('service', error.message || 'Gagal menyimpan jenis service.');
    }
  };

  const isValidUrl = (value) => {
    if (!value) return false;
    try {
      // eslint-disable-next-line no-new
      new URL(value);
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleCreateVendor = async () => {
    const payload = {
      name: vendorForm.name.trim(),
      maps_url: vendorForm.maps_url.trim(),
      description: vendorForm.description.trim(),
    };

    if (!payload.name) {
      setModalError('Nama vendor wajib diisi.');
      return;
    }

    if (!payload.maps_url || !isValidUrl(payload.maps_url)) {
      setModalError('Maps URL wajib diisi (format url).');
      return;
    }

    if (!payload.description) {
      setModalError('Deskripsi/alamat wajib diisi.');
      return;
    }

    const tempId = `temp-${Date.now()}`;
    try {
      const optimisticItem = {
        id: tempId,
        ...payload,
        __optimistic: true,
      };
      setVendors((prev) => [optimisticItem, ...prev]);
      closeModal();

      const res = await authenticatedRequest('/vendors', {
        method: 'POST',
        body: payload,
      });

      if (!res.ok) {
        throw new Error(getErrorMessage(res.data));
      }

      const created = res.data;
      if (created?.id) {
        setVendors((prev) => {
          const next = prev.map((item) => (item.id === tempId ? created : item));
          writeCache(CACHE_KEYS.vendors, next);
          return next;
        });
      } else {
        await fetchVendors();
      }
    } catch (error) {
      setVendors((prev) => {
        const next = prev.filter((item) => item.id !== tempId);
        writeCache(CACHE_KEYS.vendors, next);
        return next;
      });
      setTabError('vendor', error.message || 'Gagal menyimpan vendor.');
    }
  };

  const handleUpdateVendor = async () => {
    if (!editingItem) return;

    const payload = {
      name: vendorForm.name.trim(),
      maps_url: vendorForm.maps_url.trim(),
      description: vendorForm.description.trim(),
    };

    if (!payload.name) {
      setModalError('Nama vendor wajib diisi.');
      return;
    }

    if (!payload.maps_url || !isValidUrl(payload.maps_url)) {
      setModalError('Maps URL wajib diisi (format url).');
      return;
    }

    if (!payload.description) {
      setModalError('Deskripsi/alamat wajib diisi.');
      return;
    }

    try {
      const res = await authenticatedRequest(`/vendors/${editingItem.id}`, {
        method: 'PUT',
        body: payload,
      });
      if (!res.ok) {
        throw new Error(getErrorMessage(res.data));
      }
      const updated = res.data || payload;
      setVendors((prev) => {
        const next = prev.map((item) =>
          item.id === editingItem.id ? { ...item, ...updated } : item
        );
        writeCache(CACHE_KEYS.vendors, next);
        return next;
      });
      closeModal();
    } catch (error) {
      setModalError(error.message || 'Gagal memperbarui vendor.');
    }
  };

  const handleDeleteVendor = async (item) => {
    const confirmed = window.confirm(`Hapus vendor "${item.name}"?`);
    if (!confirmed) return;
    const prevItems = vendors;
    setVendors((prev) => {
      const next = prev.filter((entry) => entry.id !== item.id);
      writeCache(CACHE_KEYS.vendors, next);
      return next;
    });
    try {
      const res = await authenticatedRequest(`/vendors/${item.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error(getErrorMessage(res.data));
      }
    } catch (error) {
      setVendors(prevItems);
      writeCache(CACHE_KEYS.vendors, prevItems);
      setTabError('vendor', error.message || 'Gagal menghapus vendor.');
    }
  };

  const handleCreateDepartment = async () => {
    const payload = {
      name: departmentForm.name.trim(),
      code: departmentForm.code.trim(),
    };

    if (!payload.name || !payload.code) {
      setModalError('Nama dan kode departemen wajib diisi.');
      return;
    }

    const tempId = `temp-${Date.now()}`;
    try {
      const optimisticItem = { id: tempId, ...payload, __optimistic: true };
      setDepartments((prev) => [optimisticItem, ...prev]);
      closeModal();

      const res = await authenticatedRequest('/departments', {
        method: 'POST',
        body: payload,
      });
      if (!res.ok || res.data?.success === false) {
        throw new Error(getErrorMessage(res.data));
      }

      const created = unwrapApiData(res.data);
      if (created?.id) {
        setDepartments((prev) => {
          const next = prev.map((item) => (item.id === tempId ? created : item));
          writeCache(CACHE_KEYS.departments, next);
          return next;
        });
      } else {
        await fetchDepartments();
      }
    } catch (error) {
      setDepartments((prev) => {
        const next = prev.filter((item) => item.id !== tempId);
        writeCache(CACHE_KEYS.departments, next);
        return next;
      });
      setTabError('department', error.message || 'Gagal menyimpan departemen.');
    }
  };

  const handleUpdateDepartment = async () => {
    if (!editingItem) return;
    const payload = {
      name: departmentForm.name.trim(),
      code: departmentForm.code.trim(),
    };

    // Backend service currently expects both name+code.
    if (!payload.name || !payload.code) {
      setModalError('Nama dan kode departemen wajib diisi.');
      return;
    }

    try {
      const res = await authenticatedRequest(`/departments/${editingItem.id}`, {
        method: 'PUT',
        body: payload,
      });
      if (!res.ok || res.data?.success === false) {
        throw new Error(getErrorMessage(res.data));
      }
      const updated = unwrapApiData(res.data) || payload;
      setDepartments((prev) => {
        const next = prev.map((item) =>
          item.id === editingItem.id ? { ...item, ...updated } : item
        );
        writeCache(CACHE_KEYS.departments, next);
        return next;
      });
      closeModal();
    } catch (error) {
      setModalError(error.message || 'Gagal memperbarui departemen.');
    }
  };

  const handleDeleteDepartment = async (item) => {
    const confirmed = window.confirm(`Hapus departemen "${item.name}"?`);
    if (!confirmed) return;
    const prevItems = departments;
    setDepartments((prev) => {
      const next = prev.filter((entry) => entry.id !== item.id);
      writeCache(CACHE_KEYS.departments, next);
      return next;
    });
    try {
      const res = await authenticatedRequest(`/departments/${item.id}`, {
        method: 'DELETE',
      });
      if (!res.ok || res.data?.success === false) {
        throw new Error(getErrorMessage(res.data));
      }
    } catch (error) {
      setDepartments(prevItems);
      writeCache(CACHE_KEYS.departments, prevItems);
      setTabError('department', error.message || 'Gagal menghapus departemen.');
    }
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

          <button
            type="button"
            className={`admin-master-tab ${
              activeTab === 'vendor' ? 'active' : ''
            }`}
            onClick={() => setActiveTab('vendor')}
          >
            Vendor
          </button>

          <button
            type="button"
            className={`admin-master-tab ${
              activeTab === 'department' ? 'active' : ''
            }`}
            onClick={() => setActiveTab('department')}
          >
            Departemen
          </button>
        </div>

        <div className="admin-master-toolbar">
          <div>
            <div className="admin-master-title">
              {activeTab === 'device' && 'Daftar Perangkat'}
              {activeTab === 'model' && 'Daftar Model'}
              {activeTab === 'service' && 'Daftar Jenis Service'}
              {activeTab === 'vendor' && 'Daftar Vendor'}
              {activeTab === 'department' && 'Daftar Departemen'}
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

              {(activeTab === 'model' ||
                activeTab === 'service' ||
                activeTab === 'vendor' ||
                activeTab === 'department') && (
                <div className="admin-search-box">
                  <input
                    type="text"
                    placeholder="Cari"
                    aria-label="Search"
                    value={
                      activeTab === 'model'
                        ? modelSearch
                        : activeTab === 'service'
                        ? serviceSearch
                        : activeTab === 'vendor'
                        ? vendorSearch
                        : departmentSearch
                    }
                    onChange={(event) =>
                      activeTab === 'model'
                        ? setModelSearch(event.target.value)
                        : activeTab === 'service'
                        ? setServiceSearch(event.target.value)
                        : activeTab === 'vendor'
                        ? setVendorSearch(event.target.value)
                        : setDepartmentSearch(event.target.value)
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
              title="Tambah data"
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

          {activeTab === 'vendor' && (
            <>
              <div className="admin-master-row admin-master-head admin-master-vendor-head">
                <div>Nama Vendor</div>
                <div>Maps URL</div>
                <div>Deskripsi/Alamat</div>
                <div className="admin-master-action-col">Aksi</div>
              </div>
              {loading.vendor && filteredVendors.length === 0 &&
                renderStatusRow('Memuat data...')}
              {!loading.vendor && errors.vendor && renderStatusRow(errors.vendor)}
              {!loading.vendor && !errors.vendor && filteredVendors.length === 0
                ? renderStatusRow('Data kosong.')
                : filteredVendors.map((row) => (
                    <div className="admin-master-row admin-master-vendor-row" key={row.id}>
                      <div>{row.name}</div>
                      <div>{row.maps_url || '-'}</div>
                      <div>{row.description || '-'}</div>
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
                          onClick={() => handleDeleteVendor(row)}
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
              <div className="admin-master-row admin-master-head admin-master-dept-head">
                <div>Nama Departemen</div>
                <div>Kode</div>
                <div className="admin-master-action-col">Aksi</div>
              </div>

              {loading.department && filteredDepartments.length === 0 &&
                renderStatusRow('Memuat data...')}

              {!loading.department && errors.department && renderStatusRow(errors.department)}

              {!loading.department && !errors.department && filteredDepartments.length === 0
                ? renderStatusRow('Data kosong.')
                : filteredDepartments.map((row) => (
                    <div
                      className="admin-master-row admin-master-dept-row"
                      key={row.id}
                    >
                      <div>{row.name}</div>
                      <div>{row.code}</div>
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
                          onClick={() => handleDeleteDepartment(row)}
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
        <p>Tambahkan jenis service untuk request.</p>
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
          <button className="admin-modal-save" type="button" onClick={handleCreateServiceType}>
            Simpan
          </button>
        </div>
      </Modal>

      <Modal isOpen={modal === 'vendor'} onClose={closeModal} className="admin-modal">
        <button className="admin-modal-close" type="button" onClick={closeModal}>
          <i className="bi bi-x"></i>
        </button>
        <h2>{modalMode === 'edit' ? 'Edit Vendor' : 'Tambah Vendor'}</h2>
        <p>Tambahkan vendor/service location.</p>
        {modalError && <div className="admin-modal-error">{modalError}</div>}

        <div className="admin-modal-field">
          <label>Nama Vendor</label>
          <input
            type="text"
            placeholder="Masukkan nama vendor"
            value={vendorForm.name}
            onChange={(event) =>
              setVendorForm((prev) => ({ ...prev, name: event.target.value }))
            }
          />
        </div>

        <div className="admin-modal-field">
          <label>Maps URL</label>
          <input
            type="text"
            placeholder="https://maps.google.com/..."
            value={vendorForm.maps_url}
            onChange={(event) =>
              setVendorForm((prev) => ({
                ...prev,
                maps_url: event.target.value,
              }))
            }
          />
        </div>

        <div className="admin-modal-field">
          <label>Deskripsi/Alamat</label>
          <textarea
            placeholder="Masukkan deskripsi atau alamat vendor"
            value={vendorForm.description}
            onChange={(event) =>
              setVendorForm((prev) => ({
                ...prev,
                description: event.target.value,
              }))
            }
          />
        </div>

        <div className="admin-modal-actions">
          <button
            className="admin-modal-save"
            type="button"
            onClick={modalMode === 'edit' ? handleUpdateVendor : handleCreateVendor}
          >
            Simpan
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={modal === 'department'}
        onClose={closeModal}
        className="admin-modal"
      >
        <button className="admin-modal-close" type="button" onClick={closeModal}>
          <i className="bi bi-x"></i>
        </button>
        <h2>{modalMode === 'edit' ? 'Edit Departemen' : 'Tambah Departemen'}</h2>
        <p>Kelola departemen untuk user.</p>
        {modalError && <div className="admin-modal-error">{modalError}</div>}

        <div className="admin-modal-field">
          <label>Nama Departemen</label>
          <input
            type="text"
            placeholder="Contoh: Finance"
            value={departmentForm.name}
            onChange={(event) =>
              setDepartmentForm((prev) => ({ ...prev, name: event.target.value }))
            }
          />
        </div>

        <div className="admin-modal-field">
          <label>Kode</label>
          <input
            type="text"
            placeholder="Contoh: FIN"
            value={departmentForm.code}
            onChange={(event) =>
              setDepartmentForm((prev) => ({ ...prev, code: event.target.value }))
            }
          />
        </div>

        <div className="admin-modal-actions">
          <button
            className="admin-modal-save"
            type="button"
            onClick={
              modalMode === 'edit' ? handleUpdateDepartment : handleCreateDepartment
            }
          >
            Simpan
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default MasterData;
