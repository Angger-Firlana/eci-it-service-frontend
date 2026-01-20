import React, { useMemo, useState } from 'react';
import './CreateRequest.css';
import backIcon from '../../../assets/icons/back.svg';
import nextIcon from '../../../assets/icons/next.svg';

const DEVICE_OPTIONS = [
  'Laptop',
  'PC',
  'Monitor',
  'Printer',
  'Scaner',
  'UPS',
  'Mikrotik',
  'Switch',
  'Proyektor',
  '+',
];

const BRAND_OPTIONS = ['Lenovo', 'Apple', 'Asus', 'Lainnya'];

const MODEL_OPTIONS = {
  Lenovo: ['Lenovo V14', 'Lenovo V13', 'Thinkpad'],
  Apple: ['MacBook Air', 'MacBook Pro'],
  Asus: ['VivoBook', 'ROG', 'TUF'],
  Lainnya: ['Lainnya'],
};

const SERVICE_OPTIONS = ['Hardware', 'Software', 'Network', 'Other'];

const CreateRequest = () => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    deviceType: 'Laptop',
    brand: 'Lenovo',
    model: 'Lenovo V14',
    serialNumber: 'KMBT123098MTCS',
    serviceType: 'Hardware',
    description: 'Keyboard nya rada rusak',
    photoName: '',
  });

  const availableModels = useMemo(
    () => MODEL_OPTIONS[form.brand] || MODEL_OPTIONS.Lainnya,
    [form.brand]
  );

  const handleDeviceSelect = (device) => {
    setForm((prev) => ({
      ...prev,
      deviceType: device === '+' ? 'Lainnya' : device,
    }));
  };

  const handleBrandChange = (event) => {
    const brand = event.target.value;
    const nextModel =
      (MODEL_OPTIONS[brand] && MODEL_OPTIONS[brand][0]) || 'Lainnya';

    setForm((prev) => ({
      ...prev,
      brand,
      model: nextModel,
    }));
  };

  const handleFieldChange = (field) => (event) => {
    setForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    setForm((prev) => ({
      ...prev,
      photoName: file ? file.name : '',
    }));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(1, prev - 1));
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

    console.log('Submit request', form);
  };

  const steps = [
    { id: 1, icon: 'bi-display' },
    { id: 2, icon: 'bi-wrench-adjustable' },
    { id: 3, icon: 'bi-file-earmark-text' },
  ];

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
            <div className="card-title">Pilih Perangkat</div>
            <div className="card-subtitle">
              Pilih perangkat yang akan di service
            </div>

            <div className="device-grid">
              {DEVICE_OPTIONS.map((device) => {
                const isAdd = device === '+';
                const isActive =
                  form.deviceType === device ||
                  (isAdd && form.deviceType === 'Lainnya');

                return (
                  <button
                    key={device}
                    type="button"
                    className={`device-btn ${isActive ? 'active' : ''} ${
                      isAdd ? 'device-add' : ''
                    }`}
                    onClick={() => handleDeviceSelect(device)}
                  >
                    {device}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="request-card">
            <div className="card-title">Brand/ Merk</div>
            <div className="field">
              <select value={form.brand} onChange={handleBrandChange}>
                {BRAND_OPTIONS.map((brand) => (
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
              <select value={form.model} onChange={handleFieldChange('model')}>
                {availableModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="request-card">
            <div className="card-title">Serial Number</div>
            <div className="field">
              <input
                type="text"
                placeholder="Serial number"
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
              value={form.serviceType}
              onChange={handleFieldChange('serviceType')}
            >
              {SERVICE_OPTIONS.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </select>
          </div>

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
              {form.photoName && (
                <span className="upload-name">{form.photoName}</span>
              )}
              <input type="file" onChange={handlePhotoChange} />
            </label>
          </div>
        </section>
      )}

      {step === 3 && (
        <div className="confirm-grid">
          <section className="request-card confirm-card">
            <div className="card-title">Konfirmasi Request</div>
            <div className="confirm-photo-block">
              <div className="confirm-label">Foto Perangkat</div>
              <div className="confirm-photo">
                {form.photoName ? form.photoName : 'Foto Perangkat'}
              </div>
            </div>

            <div className="confirm-rows">
              <div className="confirm-row">
                <span className="confirm-key">Perangkat</span>
                <span className="confirm-value">{form.deviceType}</span>
              </div>
              <div className="confirm-row">
                <span className="confirm-key">Merk</span>
                <span className="confirm-value">{form.brand}</span>
              </div>
              <div className="confirm-row">
                <span className="confirm-key">Model</span>
                <span className="confirm-value">{form.model}</span>
              </div>
              <div className="confirm-row">
                <span className="confirm-key">Jenis Service</span>
                <span className="confirm-value">{form.serviceType}</span>
              </div>
              <div className="confirm-row">
                <span className="confirm-key">Serial Number</span>
                <span className="confirm-value">{form.serialNumber}</span>
              </div>
            </div>

            <div className="confirm-notes">
              <div className="confirm-label">Keterangan</div>
              <div className="confirm-text">{form.description}</div>
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

      <div className="request-actions">
        <button
          type="button"
          className="btn-ghost"
          onClick={handleBack}
          disabled={step === 1}
        >
          <img src={backIcon} alt="Back" />
          Back
        </button>

        <button type="button" className="btn-primary" onClick={handlePrimary}>
          {step === 1 ? 'Next' : 'Submit'}
          <img src={nextIcon} alt="Next" />
        </button>
      </div>
    </div>
  );
};

export default CreateRequest;
