const API_BASE = '/api';

// Token storage key
const TOKEN_KEY = 'renewradar_token';

// Helper for authenticated fetch
async function authFetch(url, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    // If unauthorized, clear token and notify listener
    localStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new Event('auth:unauthorized'));
  }

  return response.json();
}

export const api = {
  // Authentication
  login: async (username, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.success && data.data?.token) {
      localStorage.setItem(TOKEN_KEY, data.data.token);
    }
    return data;
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new Event('auth:unauthorized'));
  },

  getMe: async () => {
    return authFetch(`${API_BASE}/auth/me`);
  },

  isAuthenticated: () => {
    return Boolean(localStorage.getItem(TOKEN_KEY));
  },

  // Dashboard
  getDashboardSummary: async () => {
    return authFetch(`${API_BASE}/dashboard/summary`);
  },

  // Platforms
  getPlatforms: async () => {
    return authFetch(`${API_BASE}/platforms`);
  },
  createPlatform: async (data) => {
    return authFetch(`${API_BASE}/platforms`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  updatePlatform: async (id, data) => {
    return authFetch(`${API_BASE}/platforms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  deletePlatform: async (id) => {
    return authFetch(`${API_BASE}/platforms/${id}`, {
      method: 'DELETE'
    });
  },

  // Combo Bundles
  createBundle: async (data) => {
    return authFetch(`${API_BASE}/bundles`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  renewBundle: async (bundleData) => {
    return authFetch(`${API_BASE}/bundles/renew`, {
      method: 'POST',
      body: JSON.stringify(bundleData)
    });
  },

  // Domains
  getDomains: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return authFetch(`${API_BASE}/domains?${query}`);
  },
  createDomain: async (data) => {
    return authFetch(`${API_BASE}/domains`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  updateDomain: async (id, data) => {
    return authFetch(`${API_BASE}/domains/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  renewDomain: async (id, years = 1) => {
    return authFetch(`${API_BASE}/domains/${id}/renew`, {
      method: 'POST',
      body: JSON.stringify({ years })
    });
  },
  deleteDomain: async (id) => {
    return authFetch(`${API_BASE}/domains/${id}`, {
      method: 'DELETE'
    });
  },

  // Hostings
  getHostings: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return authFetch(`${API_BASE}/hostings?${query}`);
  },
  createHosting: async (data) => {
    return authFetch(`${API_BASE}/hostings`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  updateHosting: async (id, data) => {
    return authFetch(`${API_BASE}/hostings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  renewHosting: async (id, months = 12) => {
    return authFetch(`${API_BASE}/hostings/${id}/renew`, {
      method: 'POST',
      body: JSON.stringify({ months })
    });
  },
  deleteHosting: async (id) => {
    return authFetch(`${API_BASE}/hostings/${id}`, {
      method: 'DELETE'
    });
  },

  // Clients
  getClients: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return authFetch(`${API_BASE}/clients?${query}`);
  },
  getClientById: async (id) => {
    return authFetch(`${API_BASE}/clients/${id}`);
  },
  createClient: async (data) => {
    return authFetch(`${API_BASE}/clients`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  updateClient: async (id, data) => {
    return authFetch(`${API_BASE}/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  deleteClient: async (id) => {
    return authFetch(`${API_BASE}/clients/${id}`, {
      method: 'DELETE'
    });
  },

  // Telegram
  getTelegramStatus: async () => {
    return authFetch(`${API_BASE}/telegram/status`);
  },
  getTelegramSettings: async () => {
    return authFetch(`${API_BASE}/telegram/settings`);
  },
  updateTelegramSettings: async (settings) => {
    return authFetch(`${API_BASE}/telegram/settings`, {
      method: 'POST',
      body: JSON.stringify(settings)
    });
  },
  sendTelegramTest: async (message) => {
    return authFetch(`${API_BASE}/telegram/test`, {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  },
  triggerExpiryCheck: async () => {
    return authFetch(`${API_BASE}/telegram/trigger-check`, {
      method: 'POST'
    });
  },
  getTelegramLogs: async () => {
    return authFetch(`${API_BASE}/telegram/logs`);
  }
};
