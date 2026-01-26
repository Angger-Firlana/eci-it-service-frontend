import React, { useEffect, useMemo, useState } from 'react';
import './CreateRequest.css';
import backIcon from '../../../assets/icons/back.svg';
import nextIcon from '../../../assets/icons/next.svg';
import { apiRequest, parseApiError, clearRequestCache } from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';
import {
  fetchDeviceModels,
  fetchDeviceTypes,
  fetchDevices,
  fetchRoles,
  fetchServiceTypes,
  fetchStatuses,
  fetchUsers,
} from '../../../lib/referenceApi';
import {
  getServiceRequestEntityTypeId,
  getStatusByCode,
} from '../../../lib/statusHelpers';
import { toISODate } from '../../../lib/formatters';

const CreateRequest = () => {
  const { user } = useAuth();
  const roleName = user?.role?.name || user?.role || 'user';
  const isAdmin = roleName === 'admin';
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [deviceTypes, setDeviceTypes] = useState([]);
  const [deviceModels, setDeviceModels] = useState([]);
  const [devices, setDevices] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [pendingStatusId, setPendingStatusId] = useState(null);

  const [form, setForm] = useState({
    deviceTypeId: '',
    brand: '',
    deviceModelId: '',
    deviceId: '',
    serviceTypeId: '',
    adminId: '',
    description: '',
    photos: [],
  });

  useEffect(() => {
    const loadReferences = async () => {
      setLoading(true);
      setError('');
      try {
        const [types, models, deviceList, serviceList, roles, statuses] =
          await Promise.all([
            fetchDeviceTypes(),
            fetchDeviceModels(),
            fetchDevices(),
            fetchServiceTypes(),
            fetchRoles(),
            fetchStatuses(),
          ]);

        setDeviceTypes(types);
        setDeviceModels(models);
        setDevices(deviceList);
        setServiceTypes(serviceList);

        if (!isAdmin) {
          const adminRole = roles.find((role) => role.name === 'admin');
          if (adminRole?.id) {
            const adminList = await fetchUsers(`role_id=${adminRole.id}`);
            setAdmins(adminList);
          }
        }

        const serviceRequestEntityTypeId =
          getServiceRequestEntityTypeId(statuses);
        const pendingStatus = getStatusByCode(
          statuses,
          serviceRequestEntityTypeId,
          'PENDING'
        );
        setPendingStatusId(pendingStatus?.id || null);
      } catch (err) {
        setError(err.message || 'Gagal memuat data referensi.');
      } finally {
        setLoading(false);
      }
    };

    loadReferences();
  }, [isAdmin]);

  const deviceTypeOptions = useMemo(() => deviceTypes, [deviceTypes]);

  const brandOptions = useMemo(() => {
    if (!form.deviceTypeId) return [];
    const brands = deviceModels
      .filter((model) => model.device_type_id === Number(form.deviceTypeId))
      .map((model) => model.brand);
    return Array.from(new Set(brands)).filter(Boolean);
  }, [deviceModels, form.deviceTypeId]);

  const modelOptions = useMemo(() => {
    if (!form.deviceTypeId || !form.brand) return [];
    return deviceModels.filter(
      (model) =>
        model.device_type_id === Number(form.deviceTypeId) &&
        model.brand === form.brand
    );
  }, [deviceModels, form.brand, form.deviceTypeId]);

  const deviceOptions = useMemo(() => {
    if (!form.deviceModelId) return [];
    return devices.filter(
      (device) => device.device_model_id === Number(form.deviceModelId)
    );
  }, [devices, form.deviceModelId]);

  useEffect(() => {
    if (!form.deviceTypeId && deviceTypeOptions.length) {
      setForm((prev) => ({
        ...prev,
        deviceTypeId: deviceTypeOptions[0].id,
      }));
    }
  }, [deviceTypeOptions, form.deviceTypeId]);

  useEffect(() => {
    if (brandOptions.length && !brandOptions.includes(form.brand)) {
      setForm((prev) => ({
        ...prev,
        brand: brandOptions[0],
      }));
    }
  }, [brandOptions, form.brand]);

  useEffect(() => {
    if (modelOptions.length) {
      const nextModel = modelOptions[0];
      if (Number(form.deviceModelId) !== nextModel.id) {
        setForm((prev) => ({
          ...prev,
          deviceModelId: nextModel.id,
        }));
      }
    }
  }, [form.deviceModelId, modelOptions]);

  useEffect(() => {
    if (deviceOptions.length) {
      const nextDevice = deviceOptions[0];
      if (Number(form.deviceId) !== nextDevice.id) {
        setForm((prev) => ({
          ...prev,
          deviceId: nextDevice.id,
        }));
      }
    } else if (form.deviceId) {
      setForm((prev) => ({
        ...prev,
        deviceId: '',
      }));
    }
  }, [deviceOptions, form.deviceId]);

  useEffect(() => {
    if (!form.serviceTypeId && serviceTypes.length) {
      setForm((prev) => ({
        ...prev,
        serviceTypeId: serviceTypes[0].id,
      }));
    }
  }, [form.serviceTypeId, serviceTypes]);

  useEffect(() => {
    if (!isAdmin && !form.adminId && admins.length) {
      setForm((prev) => ({
        ...prev,
        adminId: admins[0].id,
      }));
    }
  }, [admins, form.adminId, isAdmin]);

  const handleDeviceSelect = (deviceTypeId) => {
    setForm((prev) => ({
      ...prev,
      deviceTypeId,
      brand: '',
      deviceModelId: '',
      deviceId: '',
    }));
  };

  const handleFieldChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePhotoChange = (event) => {
    const files = Array.from(event.target.files || []);
    setForm((prev) => ({
      ...prev,
      photos: files,
    }));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async () => {
    setSubmitError('');
    setSuccessMessage('');

    if (!user?.id) {
      setSubmitError('User belum terautentikasi.');
      return;
    }

    if (!isAdmin && !form.adminId) {
      setSubmitError('Admin PIC wajib dipilih.');
      return;
    }

    if (!form.serviceTypeId) {
      setSubmitError('Jenis service wajib dipilih.');
      return;
    }

    if (!form.deviceId) {
      setSubmitError('Device wajib dipilih.');
      return;
    }

    if (!form.description.trim()) {
      setSubmitError('Keterangan kerusakan wajib diisi.');
      return;
    }

    if (!pendingStatusId) {
      setSubmitError('Status PENDING tidak tersedia di backend.');
      return;
    }

    const formData = new FormData();
    if (!isAdmin) {
      formData.append('user_id', String(user.id));
      formData.append('admin_id', String(form.adminId));
    } else {
      formData.append('admin_id', String(user.id));
    }
    formData.append('service_type_id', String(form.serviceTypeId));
    formData.append('status_id', String(pendingStatusId));
    formData.append('request_date', toISODate());
    formData.append('details[0][device_id]', String(form.deviceId));
    formData.append('details[0][complaint]', form.description.trim());

    form.photos.forEach((file, index) => {
      formData.append(`details[0][complaint_images][${index}]`, file);
    });

    try {
      setLoading(true);
      const res = await apiRequest('/service-requests', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok || res.data?.success === false) {
        throw new Error(parseApiError(res.data, 'Gagal mengirim request.'));
      }

      clearRequestCache('service-requests');
      setSuccessMessage('Request berhasil dikirim.');
      setStep(1);
      setForm((prev) => ({
        ...prev,
        description: '',
        photos: [],
      }));
    } catch (err) {
      setSubmitError(err.message || 'Gagal mengirim request.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrimary = () => {
    if (step === 1) {
      setStep(2);
      return;
    }

    if (step === 2) {
      setStep(3);
      return;
    }

    handleSubmit();
  };

  const steps = [
    { id: 1, icon: 'bi-display' },
    { id: 2, icon: 'bi-wrench-adjustable' },
    { id: 3, icon: 'bi-file-earmark-text' },
  ];

  const selectedDeviceType = deviceTypes.find(
    (item) => item.id === Number(form.deviceTypeId)
  );
  const selectedModel = deviceModels.find(
    (item) => item.id === Number(form.deviceModelId)
  );
  const selectedDevice = devices.find(
    (item) => item.id === Number(form.deviceId)
  );
  const selectedServiceType = serviceTypes.find(
    (item) => item.id === Number(form.serviceTypeId)
  );

  const photoLabel =
    form.photos.length > 0
      ? form.photos.map((file) => file.name).join(', ')
      : '';

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

      {error && <div className="create-request-error">{error}</div>}
      {successMessage && (
        <div className="create-request-success">{successMessage}</div>
      )}

      {step === 1 && (
        <>
          <section className="request-card">
            <div className="card-title">Pilih Perangkat</div>
            <div className="card-subtitle">
              Pilih perangkat yang akan di service
            </div>

            <div className="device-grid">
              {deviceTypeOptions.map((device) => {
                const isActive =
                  Number(form.deviceTypeId) === Number(device.id);

                return (
                  <button
                    key={device.id}
                    type="button"
                    className={`device-btn ${isActive ? 'active' : ''}`}
                    onClick={() => handleDeviceSelect(device.id)}
                  >
                    {device.name}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="request-card">
            <div className="card-title">Brand/ Merk</div>
            <div className="field">
              <select value={form.brand} onChange={handleFieldChange('brand')}>
                {brandOptions.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="request-card">
            <div className="card-title">Model</div>
            <div className="field">
              <select
                value={form.deviceModelId}
                onChange={handleFieldChange('deviceModelId')}
              >
                {modelOptions.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.model}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="request-card">
            <div className="card-title">Serial Number</div>
            <div className="field">
              <select
                value={form.deviceId}
                onChange={handleFieldChange('deviceId')}
              >
                {deviceOptions.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.serial_number}
                  </option>
                ))}
              </select>
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
              onChange={handleFieldChange('serviceTypeId')}
            >
              {serviceTypes.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          {!isAdmin && (
            <div className="field">
              <label>Admin PIC</label>
              <select value={form.adminId} onChange={handleFieldChange('adminId')}>
                {admins.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isAdmin && (
            <div className="field">
              <label>Admin PIC</label>
              <div className="readonly-field">{user?.name || '-'}</div>
            </div>
          )}

          <div className="field">
            <label>Keterangan kerusakan</label>
            <textarea
              value={form.description}
              onChange={handleFieldChange('description')}
            ></textarea>
          </div>

          <div className="field">
            <label>Masukkan Foto (Opsional)</label>
            <label className="upload-box">
              <i className="bi bi-image"></i>
              <span>Klik untuk upload foto</span>
              {photoLabel && (
                <span className="upload-name">{photoLabel}</span>
              )}
              <input type="file" multiple onChange={handlePhotoChange} />
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
                  {photoLabel || 'Foto Perangkat'}
                </div>
              </div>

              <div className="confirm-rows">
                <div className="confirm-row">
                  <span className="confirm-key">Perangkat</span>
                  <span className="confirm-value">
                    {selectedDeviceType?.name || '-'}
                  </span>
                </div>
                <div className="confirm-row">
                  <span className="confirm-key">Merk</span>
                  <span className="confirm-value">{form.brand || '-'}</span>
                </div>
                <div className="confirm-row">
                  <span className="confirm-key">Model</span>
                  <span className="confirm-value">
                    {selectedModel?.model || '-'}
                  </span>
                </div>
                <div className="confirm-row">
                  <span className="confirm-key">Jenis Service</span>
                  <span className="confirm-value">
                    {selectedServiceType?.name || '-'}
                  </span>
                </div>
                <div className="confirm-row">
                  <span className="confirm-key">Serial Number</span>
                  <span className="confirm-value">
                    {selectedDevice?.serial_number || '-'}
                  </span>
                </div>
              </div>
            </div>

            <div className="confirm-notes">
              <div className="confirm-label">Keterangan</div>
              <div className="confirm-text">{form.description || '-'}</div>
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

      {submitError && <div className="create-request-error">{submitError}</div>}

      <div className="request-actions">
        <button
          type="button"
          className="btn-ghost"
          onClick={handleBack}
          disabled={step === 1 || loading}
        >
          <img src={backIcon} alt="Back" />
          Back
        </button>

        <button
          type="button"
          className="btn-primary"
          onClick={handlePrimary}
          disabled={loading}
        >
          {step === 1 ? 'Next' : step === 2 ? 'Next' : 'Submit'}
          <img src={nextIcon} alt="Next" />
        </button>
      </div>
    </div>
  );
};

export default CreateRequest;
