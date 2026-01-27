import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateRequest.css';
import backIcon from '../../../assets/icons/back.svg';
import nextIcon from '../../../assets/icons/next.svg';
import { authenticatedRequest } from '../../../lib/api';

const CreateRequest = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [photoFile, setPhotoFile] = useState(null);

  // Master data from API
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [deviceModels, setDeviceModels] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [form, setForm] = useState({
    deviceTypeId: '',
    deviceModelId: '',
    serialNumber: '',
    serviceTypeId: '',
    complaint: '',
    photoName: '',
  });

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

        if (typesRes.ok) {
          const types = typesRes.data.data || [];
          setDeviceTypes(types);
          if (types.length > 0) {
            setForm(prev => ({ ...prev, deviceTypeId: types[0].id }));
          }
        }

        if (modelsRes.ok) {
          setDeviceModels(modelsRes.data.data || []);
        }

        if (serviceTypesRes.ok) {
          const sTypes = serviceTypesRes.data.data || [];
          setServiceTypes(sTypes);
          if (sTypes.length > 0) {
            setForm(prev => ({ ...prev, serviceTypeId: sTypes[0].id }));
          }
        }
      } catch (err) {
        console.error('Failed to load master data:', err);
        setError('Failed to load form data. Please refresh the page.');
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchMasterData();
  }, []);

  // Filter device models by selected device type
  const filteredDeviceModels = useMemo(() => {
    if (!form.deviceTypeId) return [];
    return deviceModels.filter(model => model.device_type_id === parseInt(form.deviceTypeId));
  }, [deviceModels, form.deviceTypeId]);

  // Auto-select first model when device type changes
  useEffect(() => {
    if (filteredDeviceModels.length > 0 && !form.deviceModelId) {
      setForm(prev => ({ ...prev, deviceModelId: filteredDeviceModels[0].id }));
    }
  }, [filteredDeviceModels, form.deviceModelId]);

  const handleDeviceTypeSelect = (typeId) => {
    setForm(prev => ({ ...prev, deviceTypeId: typeId, deviceModelId: '' }));
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

  const handleBack = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const handlePrimary = async () => {
    if (step === 1) {
      if (!form.serialNumber.trim()) {
        setError('Serial Number is required');
        return;
      }
      setError('');
      setStep(2);
      return;
    }

    if (step === 2) {
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
    setError('');

    try {
      // Step 1: Create Device
      const deviceData = {
        device_model_id: parseInt(form.deviceModelId),
        serial_number: form.serialNumber,
      };

      console.log('Creating device with data:', deviceData);

      const deviceResponse = await authenticatedRequest('/devices', {
        method: 'POST',
        body: deviceData, // Don't stringify - authenticatedRequest handles it
      });

      console.log('Device creation response:', deviceResponse);

      if (!deviceResponse.ok) {
        // Show detailed validation errors
        let errorMsg = deviceResponse.data?.message || 'Failed to create device';
        if (deviceResponse.data?.errors) {
          const errors = deviceResponse.data.errors;
          const errorList = Object.entries(errors).map(([field, msgs]) => {
            return `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`;
          });
          errorMsg = errorList.join('\n');
        }
        throw new Error(errorMsg);
      }

      const deviceId = deviceResponse.data.data?.id || deviceResponse.data.id;

      if (!deviceId) {
        throw new Error('Device ID not returned from server');
      }

      // Step 2: Create Service Request
      const formData = new FormData();

      // Get user data for admin_id (for now, we'll use a default or get from auth)
      const userResponse = await authenticatedRequest('/auth/me');
      const userId = userResponse.data?.data?.id || userResponse.data?.id || 1;

      formData.append('admin_id', '1'); // Default admin - adjust as needed
      formData.append('user_id', userId);
      formData.append('request_date', new Date().toISOString().split('T')[0]);
      formData.append('status_id', '1'); // Pending status
      formData.append('service_type_id', form.serviceTypeId);

      // Details array
      formData.append('details[0][device_id]', deviceId);
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
        // Navigate to service list instead of detail (detail might not have all data yet)
        navigate('/services');
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
    }
  };

  const steps = [
    { id: 1, icon: 'bi-display' },
    { id: 2, icon: 'bi-wrench-adjustable' },
    { id: 3, icon: 'bi-file-earmark-text' },
  ];

  const selectedDeviceType = deviceTypes.find(t => t.id === parseInt(form.deviceTypeId));
  const selectedDeviceModel = filteredDeviceModels.find(m => m.id === parseInt(form.deviceModelId));
  const selectedServiceType = serviceTypes.find(s => s.id === parseInt(form.serviceTypeId));

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
                const isActive = form.deviceTypeId === type.id;
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
            </div>
          </section>

          <section className="request-card">
            <div className="card-title">Model Perangkat</div>
            <div className="field">
              <select
                value={form.deviceModelId}
                onChange={handleFieldChange('deviceModelId')}
                disabled={filteredDeviceModels.length === 0}
              >
                {filteredDeviceModels.length === 0 ? (
                  <option value="">No models available</option>
                ) : (
                  filteredDeviceModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.brand} - {model.model}
                    </option>
                  ))
                )}
              </select>
            </div>
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
              onChange={handleFieldChange('serviceTypeId')}
            >
              {serviceTypes.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

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
                  <span className="confirm-value">{selectedDeviceType?.name || '-'}</span>
                </div>
                <div className="confirm-row">
                  <span className="confirm-key">Model</span>
                  <span className="confirm-value">
                    {selectedDeviceModel ? `${selectedDeviceModel.brand} - ${selectedDeviceModel.model}` : '-'}
                  </span>
                </div>
                <div className="confirm-row">
                  <span className="confirm-key">Serial Number</span>
                  <span className="confirm-value">{form.serialNumber}</span>
                </div>
                <div className="confirm-row">
                  <span className="confirm-key">Jenis Service</span>
                  <span className="confirm-value">{selectedServiceType?.name || '-'}</span>
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
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : step === 3 ? 'Submit' : 'Next'}
          <img src={nextIcon} alt="Next" />
        </button>
      </div>
    </div>
  );
};

export default CreateRequest;
