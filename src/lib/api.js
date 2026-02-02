import axios from 'axios';

const normalizeBaseUrl = (baseUrl) => baseUrl.replace(/\/+$/, '');

const resolveBaseUrl = () => {
  const envBaseUrl = import.meta.env.VITE_API_BASE_URL;
  if (envBaseUrl) {
    return envBaseUrl;
  }

  if (typeof window !== 'undefined') {
    const { origin, port } = window.location;
    if (origin && port && port !== '5173') {
      return `${origin}/api`;
    }
  }

  return 'http://localhost:8000/api';
};

export const API_BASE_URL = normalizeBaseUrl(resolveBaseUrl());

export const buildApiUrl = (path = '') => {
  if (!path) return API_BASE_URL;
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const unwrapApiData = (payload) => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data;
  }
  return payload;
};

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
});

// Response interceptor for consistent error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Pass through axios errors with additional context
    return Promise.reject(error);
  }
);

let onUnauthorizedCallback = null;

export const setUnauthorizedHandler = (callback) => {
  onUnauthorizedCallback = callback;
};

/**
 * Generic API request using axios
 * @param {string} path - API endpoint path
 * @param {object} options - Request options
 * @param {string} options.method - HTTP method (GET, POST, PUT, DELETE)
 * @param {any} options.body - Request body (will be auto-serialized)
 * @param {string} options.token - Auth token (optional)
 * @param {object} options.headers - Additional headers
 * @param {AbortSignal} options.signal - Abort signal for cancellation
 * @returns {Promise<{ok: boolean, status: number, data: any}>}
 */
export const apiRequest = async (path, options = {}) => {
  const { method = 'GET', body, token, headers = {}, signal } = options;

  try {
    const config = {
      method: method.toUpperCase(),
      url: path.startsWith('/') ? path : `/${path}`,
      headers: { ...headers },
      signal,
    };

    // Add auth token if provided
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Handle different body types
    if (body instanceof FormData) {
      config.data = body;
      // Let axios set multipart boundary automatically
    } else if (body !== undefined) {
      config.data = body;
      // Set default JSON content type for object payloads if not already specified
      if (!config.headers['Content-Type']) {
        config.headers['Content-Type'] = 'application/json';
      }
    }

    const response = await axiosInstance.request(config);

    // Return fetch-compatible response format
    return {
      ok: true,
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    // Handle axios errors
    if (axios.isCancel(error)) {
      // Request was cancelled
      throw error;
    }

    if (error.response) {
      // Server responded with error status
      return {
        ok: false,
        status: error.response.status,
        data: error.response.data,
      };
    }

    if (error.request) {
      // Request made but no response received (network error)
      return {
        ok: false,
        status: 0,
        data: { message: 'Network error - no response from server' },
      };
    }

    // Something else went wrong
    return {
      ok: false,
      status: 0,
      data: { message: error.message || 'Request failed' },
    };
  }
};

/**
 * Authenticated request wrapper
 * Automatically adds auth token from localStorage and handles 401 errors
 */
export const authenticatedRequest = async (path, options = {}) => {
  const token = localStorage.getItem('auth_token');

  if (!token) {
    if (onUnauthorizedCallback) {
      onUnauthorizedCallback();
    }
    throw new Error('No authentication token found');
  }

  const response = await apiRequest(path, { ...options, token });

  if (response.status === 401) {
    if (onUnauthorizedCallback) {
      onUnauthorizedCallback();
    }
    throw new Error('Unauthorized');
  }

  return response;
};

/**
 * Download file using axios with blob response
 * @param {string} url - Full URL to download from
 * @param {string} filename - Filename for download
 * @param {string} token - Auth token
 * @returns {Promise<void>}
 */
export const downloadFile = async (url, filename, token) => {
  try {
    const response = await axios.get(url, {
      responseType: 'blob',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      timeout: 60000, // 60 second timeout for downloads
    });

    // Create blob URL and trigger download
    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    if (axios.isCancel(error)) {
      throw new Error('Download cancelled');
    }
    if (error.response) {
      // Try to extract error message from response
      let errorMessage = 'Failed to download file';
      if (error.response.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const json = JSON.parse(text);
          errorMessage = json.message || json.error || errorMessage;
        } catch {
          // Blob couldn't be parsed, use default message
        }
      } else if (error.response.data?.message) {
        errorMessage = error.response.data.message;
      }
      throw new Error(errorMessage);
    }
    throw new Error(error.message || 'Download failed');
  }
};
