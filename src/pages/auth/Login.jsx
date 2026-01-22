import React, { useState } from 'react';
import './Login.css';
import robotImg from '../../assets/images/login_maskot.png';
import { API_BASE_URL } from '../../lib/api';

const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [isTesting, setIsTesting] = useState(false);
  const [testLogs, setTestLogs] = useState('');
  const apiBaseUrl = API_BASE_URL;

  const handleCredentialChange = (field) => (event) => {
    setCredentials((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const appendLog = (line = '') => {
    setTestLogs((prev) => (prev ? `${prev}\n${line}` : line));
    if (line) {
      console.log(line);
    }
  };

  const appendBlock = (lines) => {
    appendLog(lines.join('\n'));
  };

  const safeJson = (value) => {
    try {
      return JSON.stringify(value, null, 2);
    } catch (error) {
      return String(value);
    }
  };

  const limitText = (text, max = 2000) =>
    text.length > max ? `${text.slice(0, max)}...<truncated>` : text;

  const extractData = (payload) => {
    if (!payload) return null;
    if (typeof payload === 'object' && payload !== null && 'data' in payload) {
      return payload.data;
    }
    return payload;
  };

  const requestApi = async ({
    label,
    method,
    path,
    body,
    bodyExample,
    token,
    responseType,
  }) => {
    const url = `${apiBaseUrl}${path}`;
    appendBlock([
      `--- ${label}`,
      `${method} ${url}`,
      `body: ${
        bodyExample !== undefined
          ? safeJson(bodyExample)
          : body !== undefined
          ? safeJson(body)
          : '-'
      }`,
    ]);

    const headers = {};
    const options = { method, headers };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (body instanceof FormData) {
      options.body = body;
    } else if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      const contentType = response.headers.get('content-type') || '';
      let data;

      if (responseType === 'blob') {
        const blob = await response.blob();
        data = { blobSize: blob.size, blobType: blob.type };
      } else if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      const formatted = typeof data === 'string' ? data : safeJson(data);
      appendBlock([
        `status: ${response.status} ${response.statusText}`,
        `content-type: ${contentType || 'unknown'}`,
        `response: ${limitText(formatted)}`,
      ]);

      return { ok: response.ok, status: response.status, data };
    } catch (error) {
      appendBlock([`error: ${error.message || String(error)}`]);
      return { ok: false, status: 0, data: null, error };
    }
  };

  const logSkip = (label, method, path, bodyExample, reason) => {
    appendBlock([
      `--- ${label}`,
      `${method} ${API_BASE_URL}${path}`,
      `body: ${bodyExample !== undefined ? safeJson(bodyExample) : '-'}`,
      `SKIP: ${reason}`,
    ]);
  };

  const runApiTests = async () => {
    if (isTesting) return;
    setIsTesting(true);
    setTestLogs('');

    const seed = Date.now();
    const ctx = {
      token: null,
      roleId: null,
      departmentId: null,
      userId: null,
      serviceTypeId: null,
      statusId: null,
      vendorId: null,
      deviceTypeId: null,
      deviceModelId: null,
      deviceId: null,
      serviceRequestId: null,
      locationId: null,
      costId: null,
      approvalId: null,
      invoiceId: null,
    };

    appendLog(`API base URL: ${apiBaseUrl}`);

    try {
      const rolesRes = await requestApi({
        label: 'GET /references/roles',
        method: 'GET',
        path: '/references/roles',
      });
      const rolesData = extractData(rolesRes.data);
      ctx.roleId = Array.isArray(rolesData) && rolesData.length ? rolesData[0].id : null;

      const serviceTypesRes = await requestApi({
        label: 'GET /references/service-types',
        method: 'GET',
        path: '/references/service-types',
      });
      const serviceTypesData = extractData(serviceTypesRes.data);
      ctx.serviceTypeId =
        Array.isArray(serviceTypesData) && serviceTypesData.length
          ? serviceTypesData[0].id
          : null;

      const statusesRes = await requestApi({
        label: 'GET /references/statuses?entity_type_id=1',
        method: 'GET',
        path: '/references/statuses?entity_type_id=1',
      });
      const statusesData = extractData(statusesRes.data);
      ctx.statusId =
        Array.isArray(statusesData) && statusesData.length
          ? statusesData[0].id
          : null;

      const vendorsRes = await requestApi({
        label: 'GET /references/vendors',
        method: 'GET',
        path: '/references/vendors',
      });
      const vendorsData = extractData(vendorsRes.data);
      ctx.vendorId =
        Array.isArray(vendorsData) && vendorsData.length ? vendorsData[0].id : null;

      await requestApi({
        label: 'GET /references/departments',
        method: 'GET',
        path: '/references/departments',
      });

      await requestApi({
        label: 'GET /references/users',
        method: 'GET',
        path: '/references/users',
      });

      await requestApi({
        label: 'GET /departments',
        method: 'GET',
        path: '/departments',
      });

      const departmentBody = {
        name: `Dept Test ${seed}`,
        code: `DT${seed}`,
      };
      const departmentRes = await requestApi({
        label: 'POST /departments',
        method: 'POST',
        path: '/departments',
        body: departmentBody,
        bodyExample: departmentBody,
      });
      const departmentData = extractData(departmentRes.data);
      ctx.departmentId = departmentData?.id ?? null;

      if (ctx.departmentId) {
        await requestApi({
          label: 'GET /departments/{id}',
          method: 'GET',
          path: `/departments/${ctx.departmentId}`,
        });
        await requestApi({
          label: 'PUT /departments/{id}',
          method: 'PUT',
          path: `/departments/${ctx.departmentId}`,
          body: {
            name: `Dept Test ${seed} Updated`,
            code: `DT${seed}U`,
          },
          bodyExample: {
            name: 'Dept Test Updated',
            code: 'DT1234U',
          },
        });
      } else {
        logSkip(
          'GET/PUT /departments/{id}',
          'GET/PUT',
          '/departments/{id}',
          null,
          'departmentId tidak tersedia'
        );
      }

      await requestApi({
        label: 'GET /users',
        method: 'GET',
        path: '/users',
      });

      const userBody = {
        name: `Test User ${seed}`,
        email: `test.user.${seed}@example.com`,
        password: 'Passw0rd!',
        role_id: ctx.roleId ?? 1,
        department_id: ctx.departmentId ?? 1,
      };
      const userRes = await requestApi({
        label: 'POST /users',
        method: 'POST',
        path: '/users',
        body: userBody,
        bodyExample: userBody,
      });
      const userData = extractData(userRes.data);
      ctx.userId = userData?.id ?? null;

      if (ctx.userId) {
        await requestApi({
          label: 'GET /users/{id}',
          method: 'GET',
          path: `/users/${ctx.userId}`,
        });
        await requestApi({
          label: 'PUT /users/{id}',
          method: 'PUT',
          path: `/users/${ctx.userId}`,
          body: {
            name: `Test User ${seed} Updated`,
            email: `test.user.${seed}.updated@example.com`,
            password: 'Passw0rd!',
            role_id: ctx.roleId ?? 1,
            department_id: ctx.departmentId ?? 1,
          },
          bodyExample: {
            name: 'Test User Updated',
            email: 'test.user.updated@example.com',
            password: 'Passw0rd!',
            role_id: 1,
            department_id: 1,
          },
        });
      } else {
        logSkip(
          'GET/PUT /users/{id}',
          'GET/PUT',
          '/users/{id}',
          null,
          'userId tidak tersedia'
        );
      }

      const registerBody = {
        name: `Auth User ${seed}`,
        email: `auth.user.${seed}@example.com`,
        password: 'Passw0rd!',
        pin: '123456',
        role_id: ctx.roleId ?? 1,
      };
      await requestApi({
        label: 'POST /auth/register',
        method: 'POST',
        path: '/auth/register',
        body: registerBody,
        bodyExample: registerBody,
      });

      const loginBody = {
        email: userBody.email,
        password: userBody.password,
      };
      const loginRes = await requestApi({
        label: 'POST /auth/login',
        method: 'POST',
        path: '/auth/login',
        body: loginBody,
        bodyExample: loginBody,
      });
      const loginData = extractData(loginRes.data);
      ctx.token = loginData?.token ?? null;

      await requestApi({
        label: 'GET /auth/me',
        method: 'GET',
        path: '/auth/me',
        token: ctx.token || undefined,
      });

      await requestApi({
        label: 'POST /auth/logout',
        method: 'POST',
        path: '/auth/logout',
        token: ctx.token || undefined,
        bodyExample: {},
      });

      await requestApi({
        label: 'GET /user',
        method: 'GET',
        path: '/user',
        token: ctx.token || undefined,
      });

      await requestApi({
        label: 'GET /device-type',
        method: 'GET',
        path: '/device-type',
      });

      const deviceTypeBody = { name: `DeviceType ${seed}` };
      const deviceTypeRes = await requestApi({
        label: 'POST /device-type',
        method: 'POST',
        path: '/device-type',
        body: deviceTypeBody,
        bodyExample: deviceTypeBody,
      });
      const deviceTypeData = extractData(deviceTypeRes.data);
      ctx.deviceTypeId = deviceTypeData?.id ?? null;

      if (ctx.deviceTypeId) {
        await requestApi({
          label: 'GET /device-type/{id}',
          method: 'GET',
          path: `/device-type/${ctx.deviceTypeId}`,
        });
        await requestApi({
          label: 'PUT /device-type/{id}',
          method: 'PUT',
          path: `/device-type/${ctx.deviceTypeId}`,
          body: { name: `DeviceType ${seed} Updated` },
          bodyExample: { name: 'DeviceType Updated' },
        });
      } else {
        logSkip(
          'GET/PUT /device-type/{id}',
          'GET/PUT',
          '/device-type/{id}',
          null,
          'deviceTypeId tidak tersedia'
        );
      }

      await requestApi({
        label: 'GET /device-model',
        method: 'GET',
        path: '/device-model',
      });

      if (ctx.deviceTypeId) {
        const deviceModelBody = {
          device_type_id: ctx.deviceTypeId,
          brand: `Brand ${seed}`,
          model: `Model ${seed}`,
        };
        const deviceModelRes = await requestApi({
          label: 'POST /device-model',
          method: 'POST',
          path: '/device-model',
          body: deviceModelBody,
          bodyExample: deviceModelBody,
        });
        const deviceModelData = extractData(deviceModelRes.data);
        ctx.deviceModelId = deviceModelData?.id ?? null;

        if (ctx.deviceModelId) {
          await requestApi({
            label: 'GET /device-model/{id}',
            method: 'GET',
            path: `/device-model/${ctx.deviceModelId}`,
          });
          await requestApi({
            label: 'PUT /device-model/{id}',
            method: 'PUT',
            path: `/device-model/${ctx.deviceModelId}`,
            body: {
              device_type_id: ctx.deviceTypeId,
              brand: `Brand ${seed} Updated`,
              model: `Model ${seed} Updated`,
            },
            bodyExample: {
              device_type_id: 1,
              brand: 'Brand Updated',
              model: 'Model Updated',
            },
          });
          await requestApi({
            label: 'PATCH /device-model/{id}',
            method: 'PATCH',
            path: `/device-model/${ctx.deviceModelId}`,
            body: {
              brand: `Brand ${seed} Patch`,
            },
            bodyExample: {
              brand: 'Brand Patch',
            },
          });
        }
      } else {
        logSkip(
          'POST/GET/PUT/PATCH /device-model',
          'POST/GET/PUT/PATCH',
          '/device-model/{id}',
          { device_type_id: 1, brand: 'Brand', model: 'Model' },
          'deviceTypeId tidak tersedia'
        );
      }

      await requestApi({
        label: 'GET /devices',
        method: 'GET',
        path: '/devices',
      });

      if (ctx.deviceModelId) {
        const deviceBody = {
          device_model_id: ctx.deviceModelId,
          serial_number: `SN-${seed}`,
        };
        const deviceRes = await requestApi({
          label: 'POST /devices',
          method: 'POST',
          path: '/devices',
          body: deviceBody,
          bodyExample: deviceBody,
        });
        const deviceData = extractData(deviceRes.data);
        ctx.deviceId = deviceData?.id ?? null;

        if (ctx.deviceId) {
          await requestApi({
            label: 'GET /devices/{id}',
            method: 'GET',
            path: `/devices/${ctx.deviceId}`,
          });
          await requestApi({
            label: 'PUT /devices/{id}',
            method: 'PUT',
            path: `/devices/${ctx.deviceId}`,
            body: {
              device_model_id: ctx.deviceModelId,
              serial_number: `SN-${seed}-U`,
            },
            bodyExample: {
              device_model_id: 1,
              serial_number: 'SN-UPDATED',
            },
          });
          await requestApi({
            label: 'PATCH /devices/{id}',
            method: 'PATCH',
            path: `/devices/${ctx.deviceId}`,
            body: {
              serial_number: `SN-${seed}-P`,
            },
            bodyExample: {
              serial_number: 'SN-PATCH',
            },
          });
        }
      } else {
        logSkip(
          'POST/GET/PUT/PATCH /devices',
          'POST/GET/PUT/PATCH',
          '/devices/{id}',
          { device_model_id: 1, serial_number: 'SN-EXAMPLE' },
          'deviceModelId tidak tersedia'
        );
      }

      await requestApi({
        label: 'GET /service-requests',
        method: 'GET',
        path: '/service-requests',
      });
      await requestApi({
        label: 'GET /service-requests/stats',
        method: 'GET',
        path: '/service-requests/stats',
      });

      if (ctx.userId && ctx.deviceId && ctx.serviceTypeId && ctx.statusId) {
        const serviceRequestBody = {
          admin_id: ctx.userId,
          user_id: ctx.userId,
          service_type_id: ctx.serviceTypeId,
          request_date: new Date().toISOString().slice(0, 10),
          status_id: ctx.statusId,
          details: [
            {
              device_id: ctx.deviceId,
              complaint: 'Test complaint from login page',
              complaint_images: [],
            },
          ],
        };
        const serviceRequestRes = await requestApi({
          label: 'POST /service-requests',
          method: 'POST',
          path: '/service-requests',
          body: serviceRequestBody,
          bodyExample: serviceRequestBody,
        });
        const serviceRequestData = extractData(serviceRequestRes.data);
        ctx.serviceRequestId = serviceRequestData?.id ?? null;
      } else {
        logSkip(
          'POST /service-requests',
          'POST',
          '/service-requests',
          {
            admin_id: 1,
            user_id: 1,
            service_type_id: 1,
            request_date: '2026-01-22',
            status_id: 1,
            details: [{ device_id: 1, complaint: 'Sample complaint' }],
          },
          'userId/deviceId/serviceTypeId/statusId tidak lengkap'
        );
      }

      if (ctx.serviceRequestId) {
        await requestApi({
          label: 'GET /service-requests/{id}',
          method: 'GET',
          path: `/service-requests/${ctx.serviceRequestId}`,
        });
        await requestApi({
          label: 'GET /service-requests/{id}/allowed-transitions',
          method: 'GET',
          path: `/service-requests/${ctx.serviceRequestId}/allowed-transitions`,
          token: ctx.token || undefined,
        });
        const locationBody = {
          location_type: 'external',
          vendor_id: ctx.vendorId ?? 1,
          is_active: true,
        };
        const locationRes = await requestApi({
          label: 'POST /service-requests/{id}/locations',
          method: 'POST',
          path: `/service-requests/${ctx.serviceRequestId}/locations`,
          body: locationBody,
          bodyExample: locationBody,
        });
        const locationData = extractData(locationRes.data);
        ctx.locationId = locationData?.id ?? null;

        if (ctx.locationId) {
          await requestApi({
            label: 'PUT /service-requests/{id}/locations/{locationId}',
            method: 'PUT',
            path: `/service-requests/${ctx.serviceRequestId}/locations/${ctx.locationId}`,
            body: {
              is_active: false,
            },
            bodyExample: {
              location_type: 'internal',
              vendor_id: 1,
              is_active: false,
            },
          });
        } else {
          logSkip(
            'PUT /service-requests/{id}/locations/{locationId}',
            'PUT',
            `/service-requests/${ctx.serviceRequestId}/locations/{locationId}`,
            { is_active: false },
            'locationId tidak tersedia'
          );
        }

        await requestApi({
          label: 'GET /service-requests/{id}/costs',
          method: 'GET',
          path: `/service-requests/${ctx.serviceRequestId}/costs`,
        });

        const costBody = {
          cost_type_id: 1,
          amount: 100000,
          description: 'Biaya service test',
        };
        const costRes = await requestApi({
          label: 'POST /service-requests/{id}/costs',
          method: 'POST',
          path: `/service-requests/${ctx.serviceRequestId}/costs`,
          body: costBody,
          bodyExample: costBody,
        });
        const costData = extractData(costRes.data);
        ctx.costId = costData?.id ?? null;

        if (ctx.costId) {
          await requestApi({
            label: 'DELETE /service-requests/{id}/costs/{costId}',
            method: 'DELETE',
            path: `/service-requests/${ctx.serviceRequestId}/costs/${ctx.costId}`,
            bodyExample: {},
          });
        }

        await requestApi({
          label: 'POST /service-requests/{id}/cancellation',
          method: 'POST',
          path: `/service-requests/${ctx.serviceRequestId}/cancellation`,
          body: { reason: 'Testing cancellation' },
          bodyExample: { reason: 'Testing cancellation' },
        });

        const updateBody = {
          status_id: 2,
          admin_id: ctx.userId,
        };
        await requestApi({
          label: 'PUT /service-requests/{id}',
          method: 'PUT',
          path: `/service-requests/${ctx.serviceRequestId}`,
          body: updateBody,
          bodyExample: {
            status_id: 2,
            admin_id: 1,
          },
        });

        const approvalBody = {
          vendor_approvals: [
            {
              approver_id: ctx.userId,
              assigned_by: ctx.userId,
              status_id: 8,
              notes: 'Assign approval',
            },
          ],
        };
        const approvalRes = await requestApi({
          label: 'PUT /service-requests/{id} (vendor_approvals)',
          method: 'PUT',
          path: `/service-requests/${ctx.serviceRequestId}`,
          body: approvalBody,
          bodyExample: approvalBody,
        });
        const approvalPayload = extractData(approvalRes.data);
        const approvals = approvalPayload?.vendor_approvals || approvalPayload?.vendorApprovals || [];
        ctx.approvalId = Array.isArray(approvals) && approvals.length ? approvals[0].id : null;

        if (ctx.approvalId) {
          await requestApi({
            label: 'POST /service-requests/approved/{id}',
            method: 'POST',
            path: `/service-requests/approved/${ctx.approvalId}`,
            body: { notes: 'Approved in test' },
            bodyExample: { notes: 'Approved in test' },
          });
          await requestApi({
            label: 'POST /service-requests/rejected/{id}',
            method: 'POST',
            path: `/service-requests/rejected/${ctx.approvalId}`,
            body: { notes: 'Rejected in test' },
            bodyExample: { notes: 'Rejected in test' },
          });
        } else {
          logSkip(
            'POST /service-requests/approved|rejected/{id}',
            'POST',
            '/service-requests/approved/{id}',
            { notes: 'Example note' },
            'approvalId tidak tersedia'
          );
        }

        await requestApi({
          label: 'GET /service-requests/{id}/download-invoice',
          method: 'GET',
          path: `/service-requests/${ctx.serviceRequestId}/download-invoice`,
          responseType: 'blob',
        });

        await requestApi({
          label: 'GET /export-invoice/{id}',
          method: 'GET',
          path: `/export-invoice/${ctx.serviceRequestId}`,
          responseType: 'blob',
        });
      }

      const invoicesRes = await requestApi({
        label: 'GET /invoices',
        method: 'GET',
        path: '/invoices',
      });
      const invoicesData = extractData(invoicesRes.data);
      ctx.invoiceId =
        Array.isArray(invoicesData) && invoicesData.length ? invoicesData[0].id : null;

      if (ctx.invoiceId) {
        await requestApi({
          label: 'GET /invoices/{id}',
          method: 'GET',
          path: `/invoices/${ctx.invoiceId}`,
        });
        await requestApi({
          label: 'GET /invoices/{id}/print',
          method: 'GET',
          path: `/invoices/${ctx.invoiceId}/print`,
        });
      } else {
        logSkip(
          'GET /invoices/{id} & /invoices/{id}/print',
          'GET',
          '/invoices/{id}',
          null,
          'invoiceId tidak tersedia'
        );
      }

      if (ctx.serviceRequestId) {
        await requestApi({
          label: 'DELETE /service-requests/{id}',
          method: 'DELETE',
          path: `/service-requests/${ctx.serviceRequestId}`,
          bodyExample: {},
        });
      }

      if (ctx.deviceId) {
        await requestApi({
          label: 'DELETE /devices/{id}',
          method: 'DELETE',
          path: `/devices/${ctx.deviceId}`,
          bodyExample: {},
        });
      }

      if (ctx.deviceModelId) {
        await requestApi({
          label: 'DELETE /device-model/{id}',
          method: 'DELETE',
          path: `/device-model/${ctx.deviceModelId}`,
          bodyExample: {},
        });
      }

      if (ctx.deviceTypeId) {
        await requestApi({
          label: 'DELETE /device-type/{id}',
          method: 'DELETE',
          path: `/device-type/${ctx.deviceTypeId}`,
          bodyExample: {},
        });
      }

      if (ctx.userId) {
        await requestApi({
          label: 'DELETE /users/{id}',
          method: 'DELETE',
          path: `/users/${ctx.userId}`,
          bodyExample: {},
        });
      }

      if (ctx.departmentId) {
        await requestApi({
          label: 'DELETE /departments/{id}',
          method: 'DELETE',
          path: `/departments/${ctx.departmentId}`,
          bodyExample: {},
        });
      }

      appendLog('--- Test selesai ---');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-hero" aria-hidden="true"></div>

      <div className="login-card">
        <h1>Welcome!</h1>
        <p>Please enter your details</p>
        <div className="login-divider"></div>

        <label>
          Username
          <input
            type="text"
            placeholder="Username"
            value={credentials.email}
            onChange={handleCredentialChange('email')}
          />
        </label>

        <label>
          Password
          <input
            type="password"
            placeholder="Password"
            value={credentials.password}
            onChange={handleCredentialChange('password')}
          />
        </label>

        <button className="login-btn" type="button" onClick={() => onLogin?.('user')}>
          Login
        </button>

        <div className="login-alt">
          <button
            type="button"
            className="login-alt-btn"
            onClick={() => onLogin?.('user')}
          >
            Login sebagai User
          </button>
          <button
            type="button"
            className="login-alt-btn"
            onClick={() => onLogin?.('atasan')}
          >
            Login sebagai Atasan
          </button>
          <button
            type="button"
            className="login-alt-btn"
            onClick={() => onLogin?.('admin')}
          >
            Login sebagai Admin
          </button>
        </div>

        <div className="login-test">
          <button
            type="button"
            className="login-alt-btn login-test-btn"
            onClick={runApiTests}
            disabled={isTesting}
          >
            {isTesting ? 'Testing API...' : 'Test Semua Endpoint API'}
          </button>
          <div className="login-test-meta">Base URL: {apiBaseUrl}</div>
          <div className="login-test-log">
            {testLogs ? <pre>{testLogs}</pre> : <span>Log akan muncul di sini.</span>}
          </div>
        </div>

        <img src={robotImg} alt="" className="login-robot" />
      </div>
    </div>
  );
};

export default Login;
