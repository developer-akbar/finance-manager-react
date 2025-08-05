const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Helper function to set auth token
const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      // Handle 401 Unauthorized
      if (response.status === 401) {
        setAuthToken(null);
        window.location.href = '/login';
        throw new Error('Authentication required');
      }
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// Authentication API
export const authAPI = {
  // Register new user
  register: async (userData) => {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.success && response.data.token) {
      setAuthToken(response.data.token);
    }
    
    return response;
  },

  // Login user
  login: async (credentials) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.success && response.data.token) {
      setAuthToken(response.data.token);
    }
    
    return response;
  },

  // Get current user
  getCurrentUser: async () => {
    return await apiRequest('/auth/me');
  },

  // Logout
  logout: () => {
    setAuthToken(null);
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!getAuthToken();
  },
};

// Transactions API
export const transactionsAPI = {
  // Get all transactions
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/transactions?${queryString}` : '/transactions';
    return await apiRequest(endpoint);
  },

  // Get single transaction
  getById: async (id) => {
    return await apiRequest(`/transactions/${id}`);
  },

  // Create transaction
  create: async (transactionData) => {
    return await apiRequest('/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  },

  // Update transaction
  update: async (id, transactionData) => {
    return await apiRequest(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transactionData),
    });
  },

  // Delete transaction
  delete: async (id) => {
    return await apiRequest(`/transactions/${id}`, {
      method: 'DELETE',
    });
  },

  // Bulk import transactions
  bulkImport: async (transactions) => {
    return await apiRequest('/transactions/bulk', {
      method: 'POST',
      body: JSON.stringify({ transactions }),
    });
  },
};

// Settings API
export const settingsAPI = {
  // Get user settings
  get: async () => {
    return await apiRequest('/settings');
  },

  // Update user settings
  update: async (settingsData) => {
    return await apiRequest('/settings', {
      method: 'PUT',
      body: JSON.stringify(settingsData),
    });
  },

  // Update accounts
  updateAccounts: async (accounts) => {
    return await apiRequest('/settings/accounts', {
      method: 'PUT',
      body: JSON.stringify({ accounts }),
    });
  },

  // Update categories
  updateCategories: async (categories) => {
    return await apiRequest('/settings/categories', {
      method: 'PUT',
      body: JSON.stringify({ categories }),
    });
  },

  // Update account groups
  updateAccountGroups: async (accountGroups) => {
    return await apiRequest('/settings/account-groups', {
      method: 'PUT',
      body: JSON.stringify({ accountGroups }),
    });
  },

  // Update account mapping
  updateAccountMapping: async (accountMapping) => {
    return await apiRequest('/settings/account-mapping', {
      method: 'PUT',
      body: JSON.stringify({ accountMapping }),
    });
  },
};

// Import API
export const importAPI = {
  // Import from Excel file
  fromExcel: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const token = getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/import/excel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        setAuthToken(null);
        window.location.href = '/login';
        throw new Error('Authentication required');
      }
      throw new Error(data.message || 'Import failed');
    }

    return data;
  },

  // Import from JSON data
  fromJSON: async (transactions) => {
    return await apiRequest('/import/json', {
      method: 'POST',
      body: JSON.stringify({ transactions }),
    });
  },
};

// Health check API
export const healthAPI = {
  check: async () => {
    return await apiRequest('/health');
  },
};

// Export default API object
export default {
  auth: authAPI,
  transactions: transactionsAPI,
  settings: settingsAPI,
  import: importAPI,
  health: healthAPI,
}; 