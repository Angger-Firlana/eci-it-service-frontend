import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import './ManageUsers.css';
import { apiRequest, unwrapApiData, parseApiError, unwrapApiMeta } from '../../../lib/api';
import { fetchDepartments, fetchRoles } from '../../../lib/referenceApi';
import { Pagination } from '../../../components/common';

const DEFAULT_PER_PAGE = 10;

const ManageUsers = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('role') || 'user');
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState('edit');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    department_id: '',
  });
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const page = Number(searchParams.get('page') || 1);
  const perPage = Number(searchParams.get('per_page') || DEFAULT_PER_PAGE);

  useEffect(() => {
    const loadReferences = async () => {
      try {
        const [roleList, departmentList] = await Promise.all([
          fetchRoles(),
          fetchDepartments(),
        ]);
        setRoles(roleList);
        setDepartments(departmentList);
      } catch (err) {
        setError(err.message || 'Gagal memuat referensi.');
      }
    };
    loadReferences();
  }, []);

  useEffect(() => {
    setActiveTab(searchParams.get('role') || 'user');
    setSearch(searchParams.get('search') || '');
  }, [searchParams]);

  const roleMap = useMemo(() => {
    const map = {};
    roles.forEach((role) => {
      map[role.name] = role.id;
    });
    return map;
  }, [roles]);

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

  const loadUsers = async () => {
    setError('');
    const roleName = activeTab === 'atasan' ? 'superior' : 'user';
    const roleId = roleMap[roleName];
    if (!roleId) {
      setUsers([]);
      setMeta(null);
      return;
    }
    try {
      const query = new URLSearchParams();
      query.set('role_id', String(roleId));
      query.set('page', String(page));
      query.set('per_page', String(perPage));
      if (searchParams.get('search')) {
        query.set('search', searchParams.get('search'));
      }
      const res = await apiRequest(`/users?${query.toString()}`);
      if (!res.ok || res.data?.success === false) {
        throw new Error(parseApiError(res.data, 'Gagal memuat user.'));
      }
      const payload = unwrapApiData(res.data);
      const list = Array.isArray(payload) ? payload : [];
      setUsers(list);
      setMeta(unwrapApiMeta(res.data));
      setSelectedId(list[0]?.id || null);
      setMode('edit');
    } catch (err) {
      setError(err.message || 'Gagal memuat user.');
    }
  };

  useEffect(() => {
    loadUsers();
  }, [activeTab, roleMap, page, perPage, searchParams]);

  useEffect(() => {
    const selected = users.find((row) => row.id === selectedId);
    if (!selected) return;
    setForm({
      name: selected.name || '',
      email: selected.email || '',
      password: '',
      department_id: selected.departments?.[0]?.id || '',
    });
  }, [selectedId, users]);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return users;
    return users.filter((row) =>
      [row.name, row.email]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    );
  }, [search, users]);

  const handleFieldChange = (field) => (event) => {
    setForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleAdd = () => {
    setMode('create');
    setSelectedId(null);
    setForm({
      name: '',
      email: '',
      password: '',
      department_id: departments[0]?.id || '',
    });
  };

  const handleSave = async () => {
    if (submitting) return;
    setError('');

    const roleName = activeTab === 'atasan' ? 'superior' : 'user';
    const roleId = roleMap[roleName];
    if (!roleId) {
      setError('Role belum tersedia.');
      return;
    }

    if (!form.name || !form.email || !form.department_id) {
      setError('Nama, email, dan departemen wajib diisi.');
      return;
    }

    if (mode === 'create' && !form.password) {
      setError('Password wajib diisi.');
      return;
    }

    try {
      setSubmitting(true);
      if (mode === 'create') {
        const res = await apiRequest('/users', {
          method: 'POST',
          body: {
            name: form.name,
            email: form.email,
            password: form.password,
            role_id: roleId,
            department_id: Number(form.department_id),
          },
        });
        if (!res.ok || res.data?.success === false) {
          throw new Error(parseApiError(res.data, 'Gagal menambah user.'));
        }
      } else if (selectedId) {
        const payload = {
          name: form.name,
          email: form.email,
          role_id: roleId,
          department_id: Number(form.department_id),
        };
        if (form.password) {
          payload.password = form.password;
        }
        const res = await apiRequest(`/users/${selectedId}`, {
          method: 'PUT',
          body: payload,
        });
        if (!res.ok || res.data?.success === false) {
          throw new Error(parseApiError(res.data, 'Gagal memperbarui user.'));
        }
      }

      await loadUsers();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan user.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId || mode === 'create') return;
    const confirmed = window.confirm('Hapus user ini?');
    if (!confirmed) return;
    try {
      setSubmitting(true);
      const res = await apiRequest(`/users/${selectedId}`, { method: 'DELETE' });
      if (!res.ok || res.data?.success === false) {
        throw new Error(parseApiError(res.data, 'Gagal menghapus user.'));
      }
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Gagal menghapus user.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedRow = users.find((row) => row.id === selectedId);

  return (
    <div className="admin-users-page">
      <div className="admin-users-header">
        <h1>Kelola User</h1>
        <button className="admin-users-add" type="button" onClick={handleAdd}>
          <span>+ Tambah</span>
        </button>
      </div>

      {error && <div className="admin-users-error">{error}</div>}

      <div className="admin-users-layout">
        <section className="admin-users-table-card">
          <div className="admin-users-tabs">
            <button
              className={`admin-users-tab ${
                activeTab === 'user' ? 'active' : ''
              }`}
              type="button"
              onClick={() => updateParams({ role: 'user', page: 1 })}
            >
              User
            </button>
            <button
              className={`admin-users-tab ${
                activeTab === 'atasan' ? 'active' : ''
              }`}
              type="button"
              onClick={() => updateParams({ role: 'atasan', page: 1 })}
            >
              Atasan
            </button>
          </div>

          <div className="admin-users-toolbar">
            <div className="admin-users-count">
              <i className="bi bi-people"></i>
              {filteredUsers.length} {activeTab === 'user' ? 'User' : 'Atasan'}
            </div>

            <div className="admin-users-controls">
              <div className="admin-search-box">
                <input
                  type="text"
                  placeholder=""
                  aria-label="Search"
                  value={search}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSearch(value);
                    updateParams({ search: value, page: 1 });
                  }}
                />
                <i className="bi bi-search"></i>
              </div>
              <button className="admin-filter-btn" type="button" disabled>
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

            {filteredUsers.map((row) => (
              <div
                className={`admin-users-row ${
                  row.id === selectedId ? 'active' : ''
                }`}
                key={row.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelectedId(row.id);
                  setMode('edit');
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    setSelectedId(row.id);
                    setMode('edit');
                  }
                }}
              >
                <div>{row.name}</div>
                <div>{row.email}</div>
                <div>••••••••</div>
                <div>{row.departments?.[0]?.name || '-'}</div>
              </div>
            ))}
          </div>

          <Pagination
            meta={meta}
            onPageChange={(nextPage) => updateParams({ page: nextPage })}
          />
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
                type="password"
                value={form?.password || ''}
                onChange={handleFieldChange('password')}
                placeholder={mode === 'edit' ? 'Kosongkan jika tidak diubah' : ''}
              />
            </label>

            <label>
              Departemen
              <select
                value={form?.department_id || ''}
                onChange={handleFieldChange('department_id')}
              >
                <option value="">Pilih</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="admin-users-actions">
            <button
              className="admin-users-delete"
              type="button"
              onClick={handleDelete}
              disabled={!selectedId || mode === 'create' || submitting}
            >
              Hapus
            </button>
            <button
              className="admin-users-save"
              type="button"
              onClick={handleSave}
              disabled={submitting}
            >
              Simpan
            </button>
          </div>

          {mode === 'create' && (
            <div className="admin-users-note">
              User baru akan dibuat dengan role {activeTab === 'user' ? 'user' : 'superior'}.
            </div>
          )}
          {selectedRow && mode === 'edit' && (
            <div className="admin-users-note">
              Terakhir diperbarui: {selectedRow.updated_at || '-'}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default ManageUsers;
