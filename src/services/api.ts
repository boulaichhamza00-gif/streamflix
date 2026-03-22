import axios, { type AxiosInstance, type AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (email: string, password: string, name: string) =>
    api.post('/auth/register', { email, password, name }),
  
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  getMe: () =>
    api.get('/auth/me'),
  
  refresh: () =>
    api.post('/auth/refresh')
};

// Channels API
export const channelsAPI = {
  getAll: (params?: { category?: string; search?: string; page?: number; limit?: number }) =>
    api.get('/channels', { params }),
  
  getCategories: () =>
    api.get('/channels/categories'),
  
  getById: (id: string) =>
    api.get(`/channels/${id}`),
  
  getStream: (id: string) =>
    api.get(`/channels/${id}/stream`)
};

// Admin API
export const adminAPI = {
  // Stats
  getStats: () =>
    api.get('/admin/stats'),
  
  // Users
  getUsers: (params?: { search?: string; subscriptionStatus?: string; page?: number; limit?: number }) =>
    api.get('/admin/users', { params }),
  
  updateSubscription: (userId: string, data: { subscriptionStatus: string; subscriptionExpiry?: string }) =>
    api.put(`/admin/users/${userId}/subscription`, data),
  
  revokeAccess: (userId: string) =>
    api.put(`/admin/users/${userId}/revoke`),
  
  restoreAccess: (userId: string) =>
    api.put(`/admin/users/${userId}/restore`),
  
  // Channels
  getChannels: (params?: { category?: string; search?: string; page?: number; limit?: number }) =>
    api.get('/admin/channels', { params }),
  
  createChannel: (data: Partial<Channel>) =>
    api.post('/admin/channels', data),
  
  updateChannel: (id: string, data: Partial<Channel>) =>
    api.put(`/admin/channels/${id}`, data),
  
  deleteChannel: (id: string) =>
    api.delete(`/admin/channels/${id}`),
  
  toggleChannel: (id: string) =>
    api.put(`/admin/channels/${id}/toggle`),
  
  // M3U Upload
  parseM3U: (formData: FormData) =>
    api.post('/admin/m3u/parse', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  importChannels: (channels: ParsedChannel[]) =>
    api.post('/admin/m3u/import', { channels }),
  
  // Playlists
  getPlaylists: () =>
    api.get('/admin/playlists'),
  
  createPlaylist: (data: Partial<Playlist>) =>
    api.post('/admin/playlists', data),
  
  updatePlaylist: (id: string, data: Partial<Playlist>) =>
    api.put(`/admin/playlists/${id}`, data),
  
  deletePlaylist: (id: string) =>
    api.delete(`/admin/playlists/${id}`),
  
  updatePlaylistChannels: (id: string, channelIds: string[], action: 'add' | 'remove') =>
    api.put(`/admin/playlists/${id}/channels`, { channelIds, action })
};

export default api;

import type { Channel, ParsedChannel, Playlist } from '@/types';
