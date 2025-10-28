// API utility functions for backend communication
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('accessToken');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiError(response.status, error.message || 'Request failed');
  }

  return response.json();
}

// Auth API
export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    fetchApi('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  
  login: (data: { email: string; password: string }) =>
    fetchApi('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  
  refresh: (refreshToken: string) =>
    fetchApi('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
};

// User API
export const userApi = {
  getProfile: () => fetchApi('/users/profile'),
  updateProfile: (data: any) => fetchApi('/users/profile', { method: 'PUT', body: JSON.stringify(data) }),
  getTransactions: () => fetchApi('/users/transactions'),
  getHoldings: () => fetchApi('/users/holdings'),
};

// SPV API
export const spvApi = {
  getAll: () => fetchApi('/spv'),
  getById: (id: string) => fetchApi(`/spv/${id}`),
  create: (data: any) => fetchApi('/spv', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchApi(`/spv/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// Token API
export const tokenApi = {
  mint: (data: { spvId: string; amount: string; recipient: string }) =>
    fetchApi('/tokens/mint', { method: 'POST', body: JSON.stringify(data) }),
  
  transfer: (data: { tokenAddress: string; to: string; amount: string }) =>
    fetchApi('/tokens/transfer', { method: 'POST', body: JSON.stringify(data) }),
  
  getBalance: (address: string) => fetchApi(`/tokens/balance/${address}`),
};

// Payment API
export const paymentApi = {
  createDeposit: (data: { amount: number; currency: string }) =>
    fetchApi('/payments/deposit', { method: 'POST', body: JSON.stringify(data) }),
  
  withdraw: (data: { amount: number; currency: string; destination: string }) =>
    fetchApi('/payments/withdraw', { method: 'POST', body: JSON.stringify(data) }),
  
  getHistory: () => fetchApi('/payments/history'),
};

// Oracle API
export const oracleApi = {
  getPrice: (assetId: string) => fetchApi(`/oracle/price/${assetId}`),
  getAllPrices: () => fetchApi('/oracle/prices'),
};

// ML API
const ML_API_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000';

export const mlApi = {
  getValuation: (propertyData: any) =>
    fetch(`${ML_API_URL}/avm/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(propertyData),
    }).then(r => r.json()),
  
  getRiskScore: (data: any) =>
    fetch(`${ML_API_URL}/risk/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json()),
};
