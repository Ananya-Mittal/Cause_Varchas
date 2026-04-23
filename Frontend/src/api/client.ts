// src/api/client.ts
// Central API client — Expo Go compatible

import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CreditRequest, CreditResponse,
  HistoryItem, RegisterRequest, LoginRequest, AuthResponse,
} from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// BASE URL
// Expo Go: must use real LAN IP — NOT localhost or 10.0.2.2
// Find your IP:  Windows → ipconfig   Mac → ifconfig | grep inet
// Phone + PC must be on the SAME WiFi network
// ─────────────────────────────────────────────────────────────────────────────
export const BASE_URL = 'http://192.168.29.72:5000';  // ← your PC's LAN IP

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept:         'application/json',
  },
});

// Attach JWT to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Unwrap server error messages
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<{ detail?: string }>) => {
    const msg =
      error.response?.data?.detail ||
      error.message ||
      'Network error — check IP and server';
    return Promise.reject(new Error(msg));
  },
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: async (data: RegisterRequest) => {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  login: async (data: LoginRequest) => {
    // FastAPI OAuth2PasswordRequestForm expects url-encoded form, NOT JSON
    const formData = new URLSearchParams();
    formData.append('username', data.phone);    // FastAPI key is always 'username'
    formData.append('password', data.password);

    const res = await api.post<AuthResponse>(
      '/auth/login',
      formData.toString(),                      // ← .toString() critical for Expo
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    await AsyncStorage.setItem('auth_token',  res.data.access_token);
    await AsyncStorage.setItem('farmer_name', res.data.farmer_name);
    await AsyncStorage.setItem('farmer_phone', data.phone);
    return res.data;
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['auth_token', 'farmer_name', 'farmer_phone']);
  },

  getStoredToken: () => AsyncStorage.getItem('auth_token'),
  getStoredName:  () => AsyncStorage.getItem('farmer_name'),
  getStoredPhone: () => AsyncStorage.getItem('farmer_phone'),
};

// ── Credit ────────────────────────────────────────────────────────────────────
export const creditAPI = {
  calculate: async (data: CreditRequest): Promise<CreditResponse> => {
    const res = await api.post<CreditResponse>('/credit-score', data);
    return res.data;
  },

  getHistory: async (limit = 15): Promise<HistoryItem[]> => {
    const res = await api.get<HistoryItem[]>(`/history?limit=${limit}`);
    return res.data;
  },

  healthCheck: async (): Promise<boolean> => {
    try { await api.get('/health'); return true; }
    catch { return false; }
  },
};

export default api;
