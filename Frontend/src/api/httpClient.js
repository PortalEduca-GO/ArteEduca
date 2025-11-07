const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL || 'http://localhost:3001/api').replace(/\/$/, '');

const buildHeaders = (extra = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...extra
  };

  try {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      if (parsed?.id) {
        headers['x-user-id'] = parsed.id;
      }
    }
  } catch (error) {
    console.warn('Não foi possível ler currentUser do localStorage:', error);
  }

  return headers;
};

const buildUrl = (path, params) => {
  const url = new URL(`${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`);
  if (params && typeof params === 'object') {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, value);
      }
    });
  }
  return url.toString();
};

const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message = payload?.message || payload || response.statusText;
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
};

export const httpClient = {
  get: (path, params) => fetch(buildUrl(path, params), {
    method: 'GET',
    headers: buildHeaders()
  }).then(handleResponse),

  post: (path, body, options = {}) => fetch(buildUrl(path), {
    method: 'POST',
    headers: buildHeaders(options.headers),
    body: body !== undefined ? JSON.stringify(body) : undefined
  }).then(handleResponse),

  put: (path, body, options = {}) => fetch(buildUrl(path), {
    method: 'PUT',
    headers: buildHeaders(options.headers),
    body: body !== undefined ? JSON.stringify(body) : undefined
  }).then(handleResponse),

  patch: (path, body, options = {}) => fetch(buildUrl(path), {
    method: 'PATCH',
    headers: buildHeaders(options.headers),
    body: body !== undefined ? JSON.stringify(body) : undefined
  }).then(handleResponse),

  delete: (path, body, options = {}) => fetch(buildUrl(path), {
    method: 'DELETE',
    headers: buildHeaders(options.headers),
    body: body !== undefined ? JSON.stringify(body) : undefined
  }).then(handleResponse)
};

export default httpClient;
