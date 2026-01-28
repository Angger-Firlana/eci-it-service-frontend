import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateRequest.css';
import backIcon from '../../../assets/icons/back.svg';
import nextIcon from '../../../assets/icons/next.svg';
import { authenticatedRequest } from '../../../lib/api';
import { useServiceCache } from '../../../contexts/ServiceCacheContext';

const CreateRequest = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingMaster, setIsSavingMaster] = useState(false);
  const [error, setError] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const {
    serviceListCache,
    updateCache,
    masterDataCache,
    calendarCache,
    updateMasterDataCache,
    updateCalendarCache,
    isMasterDataCacheValid,
  } = useServiceCache();

  // Master data from API
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [deviceModels, setDeviceModels] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [showDeviceTypeForm, setShowDeviceTypeForm] = useState(false);
  const [showServiceTypeForm, setShowServiceTypeForm] = useState(false);
  const [newDeviceTypeName, setNewDeviceTypeName] = useState('');
  const [newDeviceBrand, setNewDeviceBrand] = useState('');
  const [newDeviceModel, setNewDeviceModel] = useState('');
  const [newServiceTypeName, setNewServiceTypeName] = useState('');

  const [form, setForm] = useState({
    deviceTypeId: '',
    deviceBrand: '',
    deviceModelId: '',
    serialNumber: '',
    serviceTypeId: '',
    complaint: '',
    photoName: '',
  });

  const isCustomBrand = form.deviceBrand === 'other';
  const isCustomModel = form.deviceModelId === 'other';
  const showCustomModelForm = showDeviceTypeForm || isCustomBrand || isCustomModel;

  const syncMasterDataCache = (types, models, services) => {
    updateMasterDataCache({
      deviceTypes: types,
      deviceModels: models,
      serviceTypes: services,
    });
  };

  const ensureDefaultSelections = (types, services) => {
    setForm((prev) => ({
      ...prev,
      deviceTypeId: prev.deviceTypeId || (types[0]?.id ?? ''),
      serviceTypeId: prev.serviceTypeId || (services[0]?.id ?? ''),
    }));
  };

  // Fetch master data on mount
  useEffect(() => {
    const fetchMasterData = async () => {
      setIsLoadingData(true);
      try {
        const [typesRes, modelsRes, serviceTypesRes] = await Promise.all([
          authenticatedRequest('/device-type'),
          authenticatedRequest('/device-model'),
          authenticatedRequest('/references/service-types'),
        ]);

        const types = typesRes.ok ? typesRes.data.data || [] : [];
        const models = modelsRes.ok ? modelsRes.data.data || [] : [];
        const services = serviceTypesRes.ok ? serviceTypesRes.data.data || [] : [];

        if (typesRes.ok) {
          setDeviceTypes(types);
        }

        if (modelsRes.ok) {
          setDeviceModels(models);
        }

        if (serviceTypesRes.ok) {
          setServiceTypes(services);
        }

        ensureDefaultSelections(types, services);
        syncMasterDataCache(types, models, services);
      } catch (err) {
        console.error('Failed to load master data:', err);
        setError('Failed to load form data. Please refresh the page.');
      } finally {
        setIsLoadingData(false);
      }
    };

    if (masterDataCache && isMasterDataCacheValid()) {
      const cachedTypes = masterDataCache.deviceTypes || [];
      const cachedModels = masterDataCache.deviceModels || [];
      const cachedServices = masterDataCache.serviceTypes || [];
      setDeviceTypes(cachedTypes);
      setDeviceModels(cachedModels);
      setServiceTypes(cachedServices);
      ensureDefaultSelections(cachedTypes, cachedServices);
      setIsLoadingData(false);
      return;
    }

    fetchMasterData();
  }, [isMasterDataCacheValid, masterDataCache]);

  // Filter device models by selected device type
  const filteredDeviceModels = useMemo(() => {
    const deviceTypeId = Number(form.deviceTypeId);
    if (!Number.isFinite(deviceTypeId)) return [];
    return deviceModels.filter(model => model.device_type_id === deviceTypeId);
  }, [deviceModels, form.deviceTypeId]);

  const brandOptions = useMemo(() => {
    const brands = filteredDeviceModels
      .map((model) => model.brand)
      .filter(Boolean);
    return Array.from(new Set(brands));
  }, [filteredDeviceModels]);

  const modelsForBrand = useMemo(() => {
    if (!form.deviceBrand || isCustomBrand) return [];
    return filteredDeviceModels.filter(
      (model) => model.brand === form.deviceBrand
    );
  }, [filteredDeviceModels, form.deviceBrand, isCustomBrand]);

  useEffect(() => {
    if (!form.deviceTypeId || showDeviceTypeForm) return;
    if (!form.deviceBrand && brandOptions.length > 0) {
      setForm(prev => ({ ...prev, deviceBrand: brandOptions[0] }));
      setNewDeviceBrand(brandOptions[0]);
    }
  }, [brandOptions, form.deviceBrand, form.deviceTypeId, showDeviceTypeForm]);

  useEffect(() => {
    if (modelsForBrand.length > 0 && !form.deviceModelId && !showCustomModelForm) {
      setForm(prev => ({ ...prev, deviceModelId: modelsForBrand[0].id }));
    }
  }, [modelsForBrand, form.deviceModelId, showCustomModelForm]);

  const handleDeviceTypeSelect = (typeId) => {
    setShowDeviceTypeForm(false);
    setNewDeviceTypeName('');
    setNewDeviceBrand('');
    setNewDeviceModel('');
    setForm(prev => ({
      ...prev,
      deviceTypeId: typeId,
      deviceBrand: '',
      deviceModelId: '',
    }));
  };

  const toggleDeviceTypeForm = () => {
    setShowDeviceTypeForm((prev) => {
      const next = !prev;
      if (next) {
        setForm((current) => ({
          ...current,
          deviceTypeId: '',
          deviceBrand: 'other',
          deviceModelId: 'other',
        }));
        setNewDeviceBrand('');
        setNewDeviceModel('');
      } else {
        setNewDeviceTypeName('');
      }
      return next;
    });
  };

  const handleBrandChange = (event) => {
    const value = event.target.value;
    const isOther = value === 'other';
    setForm(prev => ({
      ...prev,
      deviceBrand: value,
      deviceModelId: isOther ? 'other' : '',
    }));
    if (isOther) {
      setNewDeviceBrand('');
    } else {
      setNewDeviceBrand(value);
    }
    setNewDeviceModel('');
  };

  const handleModelChange = (event) => {
    const value = event.target.value;
    const isOther = value === 'other';
    setForm(prev => ({ ...prev, deviceModelId: value }));
    if (!isOther) {
      setNewDeviceModel('');
    }
  };

  const handleServiceTypeChange = (event) => {
    const value = event.target.value;
    const isOther = value === 'other';
    setForm(prev => ({ ...prev, serviceTypeId: value }));
    setShowServiceTypeForm(isOther);
    if (!isOther) {
      setNewServiceTypeName('');
    }
  };

  const createDeviceType = async (name) => {
    const response = await authenticatedRequest('/device-type', {
      method: 'POST',
      body: { name },
    });

    if (!response.ok) {
      const errorMsg = response.data?.message || 'Gagal menambah tipe perangkat';
      throw new Error(errorMsg);
    }

    return response.data?.data || response.data;
  };

  const createDeviceModel = async (payload) => {
    const response = await authenticatedRequest('/device-model', {
      method: 'POST',
      body: payload,
    });

    if (!response.ok) {
      const errorMsg = response.data?.message || 'Gagal menambah model perangkat';
      throw new Error(errorMsg);
    }

    return response.data?.data || response.data;
  };

  const createServiceType = async (name) => {
    const response = await authenticatedRequest('/references/service-types', {
      method: 'POST',
      body: { name },
    });

    if (!response.ok) {
      const errorMsg = response.data?.message || 'Gagal menambah jenis service';
      throw new Error(errorMsg);
    }

    return response.data?.data || response.data;
  };

  const handleFieldChange = (field) => (event) => {
    setForm(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    setPhotoFile(file || null);
    setForm(prev => ({
      ...prev,
      photoName: file ? file.name : '',
    }));
  };

  const findById = (list, id) =>
    list.find((item) => String(item.id) === String(id));

  const handleAddDeviceTypeLocal = () => {
    const name = newDeviceTypeName.trim();
    if (!name) {
      setError('Nama tipe perangkat wajib diisi');
      return;
    }

    const tempId = `temp-device-type-${Date.now()}`;
    const tempType = { id: tempId, name, __optimistic: true };
    const nextTypes = [tempType, ...deviceTypes];
    setDeviceTypes(nextTypes);
    syncMasterDataCache(nextTypes, deviceModels, serviceTypes);
    setForm((prev) => ({
      ...prev,
      deviceTypeId: tempId,
      deviceBrand: 'other',
      deviceModelId: 'other',
    }));
    setNewDeviceTypeName('');
    setShowDeviceTypeForm(false);
    setError('');
  };

  const handleBack = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const handlePrimary = async () => {
    if (step === 1) {
      const selectedType = findById(deviceTypes, form.deviceTypeId);
      if (showDeviceTypeForm) {
        setError('Klik Tambah untuk memasukkan tipe perangkat baru');
        return;
      }
      if (!showDeviceTypeForm && !form.deviceTypeId) {
        setError('Tipe perangkat wajib dipilih');
        return;
      }
      if (!form.deviceBrand && !showCustomModelForm) {
        setError('Brand perangkat wajib dipilih');
        return;
      }
      if (showCustomModelForm) {
        const brandValue = isCustomBrand
          ? newDeviceBrand.trim()
          : newDeviceBrand.trim() || form.deviceBrand;
        if (!brandValue || !newDeviceModel.trim()) {
          setError('Brand dan model wajib diisi');
          return;
        }
      }
      if (!showCustomModelForm && !form.deviceModelId) {
        setError('Model perangkat wajib dipilih');
        return;
      }
      if (selectedType?.__optimistic && !form.deviceTypeId) {
        setError('Tipe perangkat wajib dipilih');
        return;
      }
      if (!form.serialNumber.trim()) {
        setError('Serial Number is required');
        return;
      }
      setError('');
      setStep(2);
      return;
    }

    if (step === 2) {
      if (showServiceTypeForm && !newServiceTypeName.trim()) {
        setError('Nama jenis service wajib diisi');
        return;
      }
      if (!showServiceTypeForm && !form.serviceTypeId) {
        setError('Jenis service wajib dipilih');
        return;
      }
      if (!form.complaint.trim()) {
        setError('Complaint description is required');
        return;
      }
      setError('');
      setStep(3);
      return;
    }

    await handleSubmit();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setIsSavingMaster(true);
    setError('');

    try {
      const trimmedSerialNumber = form.serialNumber.trim();
      const prevDeviceTypes = deviceTypes;
      const prevDeviceModels = deviceModels;
      const prevServiceTypes = serviceTypes;

      let nextDeviceTypes = deviceTypes;
      let nextDeviceModels = deviceModels;
      let nextServiceTypes = serviceTypes;

      let resolvedDeviceTypeId = form.deviceTypeId;
      const selectedType = findById(deviceTypes, form.deviceTypeId);
      let resolvedDeviceModel = deviceModels.find(
        (item) => String(item.id) === String(form.deviceModelId)
      );
      let resolvedServiceTypeId = form.serviceTypeId;

      if (selectedType?.__optimistic) {
        const name = selectedType.name;
        try {
          const created = await createDeviceType(name);
          if (!created?.id) {
            throw new Error('Tipe perangkat tidak valid');
          }

          resolvedDeviceTypeId = created.id;
          nextDeviceTypes = nextDeviceTypes.map((item) =>
            item.id === selectedType.id ? created : item
          );
          setDeviceTypes(nextDeviceTypes);
          syncMasterDataCache(nextDeviceTypes, nextDeviceModels, nextServiceTypes);
          setForm((prev) => ({
            ...prev,
            deviceTypeId: created.id,
          }));
        } catch (err) {
          setDeviceTypes(prevDeviceTypes);
          syncMasterDataCache(prevDeviceTypes, prevDeviceModels, prevServiceTypes);
          throw err;
        }
      }

      if (showCustomModelForm) {
        const brand = isCustomBrand
          ? newDeviceBrand.trim()
          : newDeviceBrand.trim() || form.deviceBrand;
        const model = newDeviceModel.trim();
        const deviceTypeId = Number(resolvedDeviceTypeId);
        if (!Number.isFinite(deviceTypeId)) {
          throw new Error('Tipe perangkat wajib diisi');
        }

        const optimisticModel = {
          id: `temp-device-model-${Date.now()}`,
          device_type_id: deviceTypeId,
          brand,
          model,
          __optimistic: true,
        };

        nextDeviceModels = [optimisticModel, ...nextDeviceModels];
        setDeviceModels(nextDeviceModels);
        syncMasterDataCache(nextDeviceTypes, nextDeviceModels, nextServiceTypes);

        try {
          const created = await createDeviceModel({
            device_type_id: deviceTypeId,
            brand,
            model,
          });
          if (!created?.id) {
            throw new Error('Model perangkat tidak valid');
          }

          resolvedDeviceModel = created;
          nextDeviceModels = nextDeviceModels.map((item) =>
            item.id === optimisticModel.id ? created : item
          );
          setDeviceModels(nextDeviceModels);
          syncMasterDataCache(nextDeviceTypes, nextDeviceModels, nextServiceTypes);
          setForm((prev) => ({
            ...prev,
            deviceModelId: created.id,
            deviceBrand: created.brand || brand,
          }));
          setNewDeviceBrand('');
          setNewDeviceModel('');
        } catch (err) {
          setDeviceModels(prevDeviceModels);
          syncMasterDataCache(nextDeviceTypes, prevDeviceModels, nextServiceTypes);
          throw err;
        }
      }

      if (showServiceTypeForm) {
        const name = newServiceTypeName.trim();
        const optimisticService = {
          id: `temp-service-type-${Date.now()}`,
          name,
          __optimistic: true,
        };

        nextServiceTypes = [optimisticService, ...nextServiceTypes];
        setServiceTypes(nextServiceTypes);
        syncMasterDataCache(nextDeviceTypes, nextDeviceModels, nextServiceTypes);

        try {
          const created = await createServiceType(name);
          if (!created?.id) {
            throw new Error('Jenis service tidak valid');
          }

          resolvedServiceTypeId = created.id;
          nextServiceTypes = nextServiceTypes.map((item) =>
            item.id === optimisticService.id ? created : item
          );
          setServiceTypes(nextServiceTypes);
          syncMasterDataCache(nextDeviceTypes, nextDeviceModels, nextServiceTypes);
          setForm((prev) => ({ ...prev, serviceTypeId: created.id }));
          setShowServiceTypeForm(false);
          setNewServiceTypeName('');
        } catch (err) {
          setServiceTypes(prevServiceTypes);
          syncMasterDataCache(nextDeviceTypes, nextDeviceModels, prevServiceTypes);
          throw err;
        }
      }

      if (!resolvedDeviceModel) {
        throw new Error('Device model is required');
      }

      const formData = new FormData();

      // Get user data for admin_id (for now, we'll use a default or get from auth)
      const userResponse = await authenticatedRequest('/auth/me');
      const userId = userResponse.data?.data?.id || userResponse.data?.id || 1;

      formData.append('admin_id', '1'); // Default admin - adjust as needed
      formData.append('user_id', userId);
      formData.append('request_date', new Date().toISOString().split('T')[0]);
      formData.append('status_id', '1'); // Pending status

      // Details array
      formData.append('details[0][device_type_id]', String(resolvedDeviceTypeId));
      formData.append('details[0][brand]', resolvedDeviceModel.brand);
      formData.append('details[0][model]', resolvedDeviceModel.model);
      formData.append('details[0][serial_number]', trimmedSerialNumber);
      formData.append('details[0][service_type_id]', String(resolvedServiceTypeId));
      formData.append('details[0][complaint]', form.complaint);

      if (photoFile) {
        formData.append('details[0][complaint_images][0]', photoFile);
      }

      const serviceResponse = await authenticatedRequest('/service-requests', {
        method: 'POST',
        body: formData,
      });

      console.log('Service request response:', serviceResponse);

      if (serviceResponse.ok) {
        const serviceData = serviceResponse.data?.data || serviceResponse.data;
        if (serviceData) {
          const existing = Array.isArray(serviceListCache) ? serviceListCache : [];
          const filtered = existing.filter((item) => item.id !== serviceData.id);
          updateCache([serviceData, ...filtered]);

          const calendarExisting = Array.isArray(calendarCache) ? calendarCache : [];
          const calendarFiltered = calendarExisting.filter(
            (item) => item.id !== serviceData.id
          );
          updateCalendarCache([serviceData, ...calendarFiltered]);
        }

        navigate('/dashboard');
      } else {
        // Show detailed validation errors
        let errorMsg = serviceResponse.data?.message || 'Failed to create service request';
        if (serviceResponse.data?.errors) {
          const errors = serviceResponse.data.errors;
          const errorList = Object.entries(errors).map(([field, msgs]) => {
            return `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`;
          });
          errorMsg = errorList.join('\n');
        }
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.message || 'Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
      setIsSavingMaster(false);
    }
  };

  const steps = [
    { id: 1, icon: 'bi-display' },
    { id: 2, icon: 'bi-wrench-adjustable' },
    { id: 3, icon: 'bi-file-earmark-text' },
  ];

  const selectedDeviceType = findById(deviceTypes, form.deviceTypeId);
  const selectedDeviceModel = findById(deviceModels, form.deviceModelId);
  const selectedServiceType = findById(serviceTypes, form.serviceTypeId);

  if (isLoadingData) {
    return (
      <div className="create-request">
        <div className="request-header">
          <h1 className="request-title">Buat Request Service</h1>
          <p className="request-subtitle">Loading form data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="create-request">
      <div className="request-header">
        <h1 className="request-title">Buat Request Service</h1>
        <p className="request-subtitle">
          Ajukan permintaan service perangkat EC
        </p>
      </div>

      <div className="request-stepper">
        {steps.map((item, index) => {
          const isActive = step === item.id;
          const isCompleted = step > item.id;
          const lineActive = step > item.id;

          return (
            <div className="stepper-item" key={item.id}>
              <div
                className={`stepper-circle ${
                  isActive ? 'active' : ''
                } ${isCompleted ? 'completed' : ''}`}
              >
                {isCompleted ? (
                  <i className="bi bi-check-lg"></i>
                ) : (
                  <i className={`bi ${item.icon}`}></i>
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`stepper-line ${lineActive ? 'active' : ''}`}
                ></div>
              )}
            </div>
          );
        })}
      </div>

      {step === 1 && (
        <>
          <section className="request-card">
            <div className="card-title">Pilih Tipe Perangkat</div>
            <div className="card-subtitle">
              Pilih tipe perangkat yang akan di service
            </div>

            <div className="device-grid">
              {deviceTypes.map((type) => {
                const isActive = String(form.deviceTypeId) === String(type.id);
                return (
                  <button
                    key={type.id}
                    type="button"
                    className={`device-btn ${isActive ? 'active' : ''}`}
                    onClick={() => handleDeviceTypeSelect(type.id)}
                  >
                    {type.name}
                  </button>
                );
              })}
              <button
                type="button"
                className="device-btn device-add"
                onClick={toggleDeviceTypeForm}
                aria-label="Tambah tipe perangkat"
              >
                +
              </button>
            </div>

            {showDeviceTypeForm && (
              <div className="field device-add-field">
                <label>Nama Tipe Perangkat Baru</label>
                <input
                  type="text"
                  placeholder="Contoh: Scanner"
                  value={newDeviceTypeName}
                  onChange={(event) => setNewDeviceTypeName(event.target.value)}
                />
                <button
                  type="button"
                  className="btn-primary add-inline"
                  onClick={handleAddDeviceTypeLocal}
                  disabled={isSavingMaster}
                >
                  Tambah
                </button>
              </div>
            )}
          </section>

          <section className="request-card">
            <div className="card-title">Brand & Model</div>
            <div className="field-grid">
              <div className="field">
                <label>Brand</label>
                <select
                  value={form.deviceBrand}
                  onChange={handleBrandChange}
                  disabled={showDeviceTypeForm}
                >
                  {brandOptions.length === 0 ? (
                    <option value="">No brands available</option>
                  ) : (
                    brandOptions.map((brand) => (
                      <option key={brand} value={brand}>
                        {brand}
                      </option>
                    ))
                  )}
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="field">
                <label>Model</label>
                <select
                  value={form.deviceModelId}
                  onChange={handleModelChange}
                  disabled={!form.deviceBrand || isCustomBrand}
                >
                  {!form.deviceBrand || isCustomBrand ? (
                    <option value="">Pilih brand terlebih dahulu</option>
                  ) : modelsForBrand.length === 0 ? (
                    <option value="">No models available</option>
                  ) : (
                    modelsForBrand.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.model}
                      </option>
                    ))
                  )}
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {showCustomModelForm && (
              <div className="field-grid">
                {isCustomBrand && (
                  <div className="field">
                    <label>Brand Baru</label>
                    <input
                      type="text"
                      placeholder="Contoh: HP"
                      value={newDeviceBrand}
                      onChange={(event) => setNewDeviceBrand(event.target.value)}
                    />
                  </div>
                )}
                <div className="field">
                  <label>Model Baru</label>
                  <input
                    type="text"
                    placeholder="Contoh: LaserJet Pro M404n"
                    value={newDeviceModel}
                    onChange={(event) => setNewDeviceModel(event.target.value)}
                  />
                </div>
              </div>
            )}
          </section>

          <section className="request-card">
            <div className="card-title">Serial Number</div>
            <div className="field">
              <input
                type="text"
                placeholder="Masukkan serial number perangkat"
                value={form.serialNumber}
                onChange={handleFieldChange('serialNumber')}
              />
            </div>
          </section>
        </>
      )}

      {step === 2 && (
        <section className="request-card">
          <div className="card-title">Jenis Service</div>
          <div className="card-subtitle">Masukkan masalah perangkat</div>

          <div className="field">
            <label>Jenis Service</label>
            <select
              value={form.serviceTypeId}
              onChange={handleServiceTypeChange}
              disabled={showServiceTypeForm}
            >
              {serviceTypes.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
              <option value="other">Other</option>
            </select>
          </div>

          {showServiceTypeForm && (
            <div className="field">
              <label>Nama Jenis Service Baru</label>
              <input
                type="text"
                placeholder="Contoh: Hardware Repair"
                value={newServiceTypeName}
                onChange={(event) => setNewServiceTypeName(event.target.value)}
              />
            </div>
          )}

          <div className="field">
            <label>Keterangan kerusakan</label>
            <textarea
              value={form.complaint}
              onChange={handleFieldChange('complaint')}
              placeholder="Deskripsikan masalah perangkat Anda..."
            ></textarea>
          </div>

          <div className="field">
            <label>Masukkan Foto (Opsional)</label>
            <label className="upload-box">
              <i className="bi bi-image"></i>
              <span>Klik untuk upload foto</span>
              {form.photoName && (
                <span className="upload-name">{form.photoName}</span>
              )}
              <input type="file" accept="image/*" onChange={handlePhotoChange} />
            </label>
          </div>
        </section>
      )}

      {step === 3 && (
        <div className="confirm-grid">
          <section className="request-card confirm-card">
            <div className="card-title">Konfirmasi Request</div>

            <div className="confirm-main">
              <div className="confirm-photo-block">
                <div className="confirm-label">Foto Perangkat</div>
                <div className="confirm-photo">
                  {form.photoName ? form.photoName : 'Tidak ada foto'}
                </div>
              </div>

              <div className="confirm-rows">
                <div className="confirm-row">
                  <span className="confirm-key">Tipe Perangkat</span>
                  <span className="confirm-value">
                    {showDeviceTypeForm
                      ? newDeviceTypeName || '-'
                      : selectedDeviceType?.name || '-'}
                  </span>
                </div>
                <div className="confirm-row">
                  <span className="confirm-key">Model</span>
                  <span className="confirm-value">
                    {showCustomModelForm
                      ? `${isCustomBrand ? newDeviceBrand || '-' : form.deviceBrand || '-'} - ${newDeviceModel || '-'}`
                      : selectedDeviceModel
                      ? `${selectedDeviceModel.brand} - ${selectedDeviceModel.model}`
                      : '-'}
                  </span>
                </div>
                <div className="confirm-row">
                  <span className="confirm-key">Serial Number</span>
                  <span className="confirm-value">{form.serialNumber}</span>
                </div>
                <div className="confirm-row">
                  <span className="confirm-key">Jenis Service</span>
                  <span className="confirm-value">
                    {showServiceTypeForm
                      ? newServiceTypeName || '-'
                      : selectedServiceType?.name || '-'}
                  </span>
                </div>
              </div>
            </div>

            <div className="confirm-notes">
              <div className="confirm-label">Keterangan</div>
              <div className="confirm-text">{form.complaint}</div>
            </div>
          </section>

          <aside className="alert-card">
            <div className="alert-bar"></div>
            <div className="alert-body">
              <i className="bi bi-exclamation-triangle"></i>
              <div>
                Request akan menunggu approval dari Admin sebelum diproses
              </div>
            </div>
          </aside>
        </div>
      )}

      {error && <div className="request-error">{error}</div>}

      <div className="request-actions">
        <button
          type="button"
          className="btn-ghost"
          onClick={handleBack}
          disabled={step === 1 || isSubmitting}
        >
          <img src={backIcon} alt="Back" />
          Back
        </button>

        <button
          type="button"
          className="btn-primary"
          onClick={handlePrimary}
          disabled={isSubmitting || isSavingMaster}
        >
          {isSubmitting ? 'Submitting...' : step === 3 ? 'Submit' : 'Next'}
          <img src={nextIcon} alt="Next" />
        </button>
      </div>
    </div>
  );
};

export default CreateRequest;
