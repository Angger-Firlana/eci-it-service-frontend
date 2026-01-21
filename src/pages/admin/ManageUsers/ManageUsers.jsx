import React, { useEffect, useMemo, useState } from 'react';
import './ManageUsers.css';

const USER_ROWS = [
  {
    id: 1,
    name: 'Toni Apalah',
    email: 'Toni@gmail.com',
    password: 'toni12',
    department: 'ECOMERS',
  },
  {
    id: 2,
    name: 'Alva',
    email: 'Alva@gmail.com',
    password: 'alva12',
    department: 'Finance',
  },
  {
    id: 3,
    name: 'Viona',
    email: 'Viona@gmail.com',
    password: 'viona12',
    department: 'Marketing',
  },
  {
    id: 4,
    name: 'Rafi',
    email: 'Rafi@gmail.com',
    password: 'rafi12',
    department: 'IT',
  },
  {
    id: 5,
    name: 'Nadia',
    email: 'Nadia@gmail.com',
    password: 'nadia12',
    department: 'Finance',
  },
  {
    id: 6,
    name: 'Irfan',
    email: 'Irfan@gmail.com',
    password: 'irfan12',
    department: 'ECOMERS',
  },
];

const ATASAN_ROWS = [
  {
    id: 1,
    name: 'Alva Simatupang',
    email: 'alva@gmail.com',
    password: 'alva12',
    department: 'IT',
  },
  {
    id: 2,
    name: 'Alva Simalang',
    email: 'alva@gmail.com',
    password: 'alva12',
    department: 'IT',
  },
];

const ManageUsers = () => {
  const [activeTab, setActiveTab] = useState('user');
  const rows = activeTab === 'user' ? USER_ROWS : ATASAN_ROWS;
  const [selectedId, setSelectedId] = useState(rows[0]?.id);
  const selectedRow = useMemo(
    () => rows.find((row) => row.id === selectedId) || rows[0],
    [rows, selectedId]
  );
  const [form, setForm] = useState(selectedRow || {});

  useEffect(() => {
    setSelectedId(rows[0]?.id);
  }, [activeTab, rows]);

  useEffect(() => {
    if (selectedRow) {
      setForm(selectedRow);
    }
  }, [selectedRow]);

  const handleFieldChange = (field) => (event) => {
    setForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  return (
    <div className="admin-users-page">
      <div className="admin-users-header">
        <h1>Kelola User</h1>
        <button className="admin-users-add" type="button">
          <span>+ Tambah</span>
        </button>
      </div>

      <div className="admin-users-layout">
        <section className="admin-users-table-card">
          <div className="admin-users-tabs">
            <button
              className={`admin-users-tab ${
                activeTab === 'user' ? 'active' : ''
              }`}
              type="button"
              onClick={() => setActiveTab('user')}
            >
              User
            </button>
            <button
              className={`admin-users-tab ${
                activeTab === 'atasan' ? 'active' : ''
              }`}
              type="button"
              onClick={() => setActiveTab('atasan')}
            >
              Atasan
            </button>
          </div>

          <div className="admin-users-toolbar">
            <div className="admin-users-count">
              <i className="bi bi-people"></i>
              {rows.length} {activeTab === 'user' ? 'User' : 'Atasan'}
            </div>

            <div className="admin-users-controls">
              <div className="admin-search-box">
                <input type="text" placeholder="" aria-label="Search" />
                <i className="bi bi-search"></i>
              </div>
              <button className="admin-filter-btn" type="button">
                <i className="bi bi-funnel"></i>
                <span>Departemen</span>
                <i className="bi bi-chevron-down"></i>
              </button>
            </div>
          </div>

          <div className="admin-users-table">
            <div className="admin-users-row admin-users-head">
              <div>Nama</div>
              <div>Email</div>
              <div>Password</div>
              <div>Departemen</div>
            </div>

            {rows.map((row) => (
              <div
                className={`admin-users-row ${
                  row.id === selectedId ? 'active' : ''
                }`}
                key={row.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedId(row.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    setSelectedId(row.id);
                  }
                }}
              >
                <div>{row.name}</div>
                <div>{row.email}</div>
                <div>{row.password}</div>
                <div>{row.department}</div>
              </div>
            ))}
          </div>
        </section>

        <aside className="admin-users-form-card">
          <div className="admin-users-avatar">
            {form?.name?.charAt(0) || 'U'}
          </div>

          <div className="admin-users-form">
            <label>
              Nama
              <input
                type="text"
                value={form?.name || ''}
                onChange={handleFieldChange('name')}
              />
            </label>

            <label>
              Email
              <input
                type="email"
                value={form?.email || ''}
                onChange={handleFieldChange('email')}
              />
            </label>

            <label>
              Password
              <input
                type="text"
                value={form?.password || ''}
                onChange={handleFieldChange('password')}
              />
            </label>

            <label>
              Departemen
              <input
                type="text"
                value={form?.department || ''}
                onChange={handleFieldChange('department')}
              />
            </label>
          </div>

          <div className="admin-users-actions">
            <button className="admin-users-delete" type="button">
              Hapus
            </button>
            <button className="admin-users-save" type="button">
              Simpan
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ManageUsers;
