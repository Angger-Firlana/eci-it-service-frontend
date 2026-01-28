import React, { useEffect, useMemo, useState } from 'react';
import './ManageUsers.css';

import { Modal } from '../../../components/common';
import { authenticatedRequest, unwrapApiData } from '../../../lib/api';

const ManageUsers = () => {
  const [activeTab, setActiveTab] = useState('user');
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role_id: '',
    department_id: '',
  });

  const selectedRow = useMemo(
    () => users.find((row) => row.id === selectedId) || null,
    [users, selectedId]
  );

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role_id: '',
    department_id: '',
  });

  const getErrorMessage = (payload) => {
    if (!payload) return 'Request gagal.';
    if (typeof payload === 'string') return payload;
    if (payload.message) return payload.message;
    if (payload.errors) {
      try {
        const values = Object.values(payload.errors).flat();
        return values.join(', ');
      } catch (e) {
        return 'Request gagal.';
      }
    }
    return 'Request gagal.';
  };

  const getRoleIdsForTab = (tab) => {
    const byName = (name) =>
      roles.find((r) => String(r.name || '').toLowerCase() === name)?.id;

    if (tab === 'admin') {
      // admin and technician are considered admin
      return ['admin', 'technician'].map(byName).filter(Boolean);
    }

    if (tab === 'atasan') {
      // supervisor and above are considered atasan
      return ['supervisor', 'manager', 'director', 'ceo']
        .map(byName)
        .filter(Boolean);
    }

    // regular user tab
    const userId = byName('user');
    return userId ? [userId] : [];
  };

  useEffect(() => {
    const fetchRefs = async () => {
      try {
        const [rolesRes, deptRes] = await Promise.all([
          authenticatedRequest('/references/roles'),
          authenticatedRequest('/departments?per_page=200'),
        ]);

        if (!rolesRes.ok) {
          throw new Error(getErrorMessage(rolesRes.data));
        }
        if (!deptRes.ok) {
          throw new Error(getErrorMessage(deptRes.data));
        }

        const rolesList = Array.isArray(unwrapApiData(rolesRes.data))
          ? unwrapApiData(rolesRes.data)
          : [];
        const deptList = Array.isArray(unwrapApiData(deptRes.data))
          ? unwrapApiData(deptRes.data)
          : [];

        setRoles(rolesList);
        setDepartments(deptList);
      } catch (err) {
        setError(err.message || 'Gagal mengambil reference data');
      }
    };

    fetchRefs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const roleId = getRoleIdsForTab(activeTab)[0] || '';
    const defaultDepartmentId = departments[0]?.id ? String(departments[0].id) : '';
    setCreateForm((prev) => ({
      ...prev,
      role_id: String(roleId || prev.role_id || ''),
      department_id: String(defaultDepartmentId || prev.department_id || ''),
    }));
  }, [activeTab, departments, roles]);

  useEffect(() => {
    const roleIds = getRoleIdsForTab(activeTab);
    if (!roleIds.length) return;

    const fetchUsers = async () => {
      setIsLoading(true);
      setError('');
      try {
        const buildParams = (rid) => {
          const params = new URLSearchParams();
          params.set('per_page', '50');
          params.set('role_id', String(rid));
          if (search.trim()) params.set('search', search.trim());
          if (departmentId) params.set('department_id', String(departmentId));
          return params;
        };

        const requests = roleIds.map((rid) =>
          authenticatedRequest(`/users?${buildParams(rid).toString()}`)
        );
        const responses = await Promise.all(requests);

        const list = [];
        const seen = new Set();
        let total = 0;

        for (const res of responses) {
          if (!res.ok || res.data?.success === false) {
            throw new Error(getErrorMessage(res.data));
          }
          const items = Array.isArray(unwrapApiData(res.data))
            ? unwrapApiData(res.data)
            : [];
          for (const item of items) {
            if (!item?.id || seen.has(item.id)) continue;
            seen.add(item.id);
            list.push(item);
          }
          total += Number(res.data?.meta?.total || items.length || 0);
        }

        // Stable-ish ordering so the table doesn't jump around.
        list.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));

        setUsers(list);
        setMeta({ total: total || list.length });

        setSelectedId((prev) => {
          if (prev && list.some((u) => u.id === prev)) return prev;
          return list[0]?.id ?? null;
        });
      } catch (err) {
        setUsers([]);
        setMeta(null);
        setSelectedId(null);
        setError(err.message || 'Gagal mengambil user');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [activeTab, departmentId, search, roles]);

  useEffect(() => {
    if (!selectedRow) {
      setForm({
        name: '',
        email: '',
        password: '',
        role_id: '',
        department_id: '',
      });
      return;
    }

    setForm({
      name: selectedRow.name || '',
      email: selectedRow.email || '',
      password: '',
      role_id: String(
        selectedRow.roles?.[0]?.id || getRoleIdsForTab(activeTab)[0] || ''
      ),
      department_id: String(selectedRow.departments?.[0]?.id || ''),
    });
  }, [activeTab, selectedRow]);

  const handleFieldChange = (field) => (event) => {
    setForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleUpdate = async () => {
    if (!selectedRow) return;

    const payload = {
      name: String(form.name || '').trim(),
      email: String(form.email || '').trim(),
    };

    if (!payload.name || !payload.email) {
      setError('Nama dan email wajib diisi.');
      return;
    }

    if (form.password) payload.password = form.password;
    if (form.role_id) payload.role_id = Number(form.role_id);
    if (form.department_id) payload.department_id = Number(form.department_id);

    const prevUsers = users;
    const optimisticRole = roles.find((r) => String(r.id) === String(form.role_id));
    const optimisticDept = departments.find(
      (d) => String(d.id) === String(form.department_id)
    );

    // Optimistic UI update: apply changes immediately while request is in-flight.
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== selectedRow.id) return u;
        return {
          ...u,
          name: payload.name,
          email: payload.email,
          roles: optimisticRole ? [optimisticRole] : u.roles,
          departments: optimisticDept ? [optimisticDept] : u.departments,
        };
      })
    );

    setIsSaving(true);
    setError('');
    try {
      const res = await authenticatedRequest(`/users/${selectedRow.id}`, {
        method: 'PUT',
        body: payload,
      });
      if (!res.ok || res.data?.success === false) {
        throw new Error(getErrorMessage(res.data));
      }
      const updated = unwrapApiData(res.data) || null;
      if (updated?.id) {
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        setForm((prev) => ({ ...prev, password: '' }));
      }
    } catch (err) {
      setUsers(prevUsers);
      setError(err.message || 'Gagal menyimpan user');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRow) return;
    const confirmed = window.confirm(`Hapus user "${selectedRow.name}"?`);
    if (!confirmed) return;

    setIsSaving(true);
    setError('');
    try {
      const res = await authenticatedRequest(`/users/${selectedRow.id}`, {
        method: 'DELETE',
      });
      if (!res.ok || res.data?.success === false) {
        throw new Error(getErrorMessage(res.data));
      }

      setUsers((prev) => {
        const next = prev.filter((u) => u.id !== selectedRow.id);
        setSelectedId(next[0]?.id ?? null);
        return next;
      });
    } catch (err) {
      setError(err.message || 'Gagal menghapus user');
    } finally {
      setIsSaving(false);
    }
  };

  const openCreate = () => {
    setCreateError('');
    setCreateOpen(true);
    setCreateForm((prev) => ({
      ...prev,
      name: '',
      email: '',
      password: '',
      role_id: String(getRoleIdsForTab(activeTab)[0] || prev.role_id || ''),
      department_id: String(departments[0]?.id || prev.department_id || ''),
    }));
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setCreateError('');
  };

  const handleCreate = async () => {
    const payload = {
      name: createForm.name.trim(),
      email: createForm.email.trim(),
      password: createForm.password,
      role_id: Number(createForm.role_id),
      department_id: Number(createForm.department_id),
    };

    if (!payload.name || !payload.email || !payload.password) {
      setCreateError('Nama, email, dan password wajib diisi.');
      return;
    }
    if (!payload.role_id || !payload.department_id) {
      setCreateError('Role dan departemen wajib dipilih.');
      return;
    }

    setIsSaving(true);
    setCreateError('');
    try {
      const res = await authenticatedRequest('/users', {
        method: 'POST',
        body: payload,
      });
      if (!res.ok || res.data?.success === false) {
        throw new Error(getErrorMessage(res.data));
      }

      const created = unwrapApiData(res.data);
      if (created?.id) {
        setUsers((prev) => [created, ...prev]);
        setSelectedId(created.id);
      }
      closeCreate();
    } catch (err) {
      setCreateError(err.message || 'Gagal membuat user');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="admin-users-page">
      <div className="admin-users-header">
        <h1>Kelola User</h1>
        <button className="admin-users-add" type="button" onClick={openCreate}>
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
                activeTab === 'admin' ? 'active' : ''
              }`}
              type="button"
              onClick={() => setActiveTab('admin')}
            >
              Admin
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
              {meta?.total ?? users.length}{' '}
              {activeTab === 'user' ? 'User' : activeTab === 'admin' ? 'Admin' : 'Atasan'}
            </div>

            <div className="admin-users-controls">
              <div className="admin-search-box">
                <input
                  type="text"
                  placeholder="Cari nama"
                  aria-label="Search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <i className="bi bi-search"></i>
              </div>

              <select
                className="admin-filter-select"
                value={departmentId}
                onChange={(event) => setDepartmentId(event.target.value)}
                aria-label="Departemen"
              >
                <option value="">Departemen</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && <div className="admin-users-error">{error}</div>}

          <div className="admin-users-table">
            <div className="admin-users-row admin-users-head">
              <div>Nama</div>
              <div>Email</div>
              <div>Password</div>
              <div>Departemen</div>
            </div>

            {isLoading && (
              <div className="admin-users-row">
                <div>Memuat data...</div>
                <div></div>
                <div></div>
                <div></div>
              </div>
            )}

            {!isLoading && users.map((row) => (
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
                <div>••••••••</div>
                <div>{row.departments?.[0]?.name || '-'}</div>
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
                disabled={!selectedRow || isSaving}
              />
            </label>

            <label>
              Email
              <input
                type="email"
                value={form?.email || ''}
                onChange={handleFieldChange('email')}
                disabled={!selectedRow || isSaving}
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={form?.password || ''}
                onChange={handleFieldChange('password')}
                placeholder="(Opsional)"
                disabled={!selectedRow || isSaving}
              />
            </label>

            <label>
              Departemen
              <select
                value={form?.department_id || ''}
                onChange={handleFieldChange('department_id')}
                disabled={!selectedRow || isSaving}
              >
                <option value="">Pilih</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Role
              <select
                value={form?.role_id || ''}
                onChange={handleFieldChange('role_id')}
                disabled={!selectedRow || isSaving}
              >
                <option value="">Pilih</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
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
              disabled={!selectedRow || isSaving}
            >
              Hapus
            </button>
            <button
              className="admin-users-save"
              type="button"
              onClick={handleUpdate}
              disabled={!selectedRow || isSaving}
            >
              Simpan
            </button>
          </div>
        </aside>
      </div>

      <Modal isOpen={createOpen} onClose={closeCreate} className="admin-modal">
        <button className="admin-modal-close" type="button" onClick={closeCreate}>
          <i className="bi bi-x"></i>
        </button>
        <h2>Tambah User</h2>
        <p>Tambahkan user atau atasan.</p>
        {createError && <div className="admin-modal-error">{createError}</div>}

        <div className="admin-modal-field">
          <label>Nama</label>
          <input
            type="text"
            value={createForm.name}
            onChange={(event) =>
              setCreateForm((prev) => ({ ...prev, name: event.target.value }))
            }
          />
        </div>

        <div className="admin-modal-field">
          <label>Email</label>
          <input
            type="email"
            value={createForm.email}
            onChange={(event) =>
              setCreateForm((prev) => ({ ...prev, email: event.target.value }))
            }
          />
        </div>

        <div className="admin-modal-field">
          <label>Password</label>
          <input
            type="password"
            value={createForm.password}
            onChange={(event) =>
              setCreateForm((prev) => ({
                ...prev,
                password: event.target.value,
              }))
            }
          />
        </div>

        <div className="admin-modal-field">
          <label>Departemen</label>
          <select
            value={createForm.department_id}
            onChange={(event) =>
              setCreateForm((prev) => ({
                ...prev,
                department_id: event.target.value,
              }))
            }
          >
            <option value="">Pilih</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-modal-field">
          <label>Role</label>
          <select
            value={createForm.role_id}
            onChange={(event) =>
              setCreateForm((prev) => ({ ...prev, role_id: event.target.value }))
            }
          >
            <option value="">Pilih</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-modal-actions">
          <button className="admin-modal-save" type="button" onClick={handleCreate}>
            Simpan
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ManageUsers;
