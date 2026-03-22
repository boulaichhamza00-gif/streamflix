import { useState, useCallback } from 'react';
import { adminAPI } from '@/services/api';
import type { User, Channel, Playlist, ParsedChannel, AdminStats } from '@/types';

interface UseAdminReturn {
  // Stats
  stats: AdminStats | null;
  fetchStats: () => Promise<void>;
  
  // Users
  users: User[];
  fetchUsers: (params?: any) => Promise<void>;
  updateUserSubscription: (userId: string, data: any) => Promise<void>;
  revokeUserAccess: (userId: string) => Promise<void>;
  restoreUserAccess: (userId: string) => Promise<void>;
  
  // Channels
  channels: Channel[];
  fetchAdminChannels: (params?: any) => Promise<void>;
  createChannel: (data: Partial<Channel>) => Promise<void>;
  updateChannel: (id: string, data: Partial<Channel>) => Promise<void>;
  deleteChannel: (id: string) => Promise<void>;
  toggleChannel: (id: string) => Promise<void>;
  
  // M3U
  parseM3U: (file: File) => Promise<ParsedChannel[]>;
  importChannels: (channels: ParsedChannel[]) => Promise<void>;
  
  // Playlists
  playlists: Playlist[];
  fetchPlaylists: () => Promise<void>;
  createPlaylist: (data: Partial<Playlist>) => Promise<void>;
  updatePlaylist: (id: string, data: Partial<Playlist>) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  
  // Loading & Error
  isLoading: boolean;
  error: string | null;
}

export const useAdmin = (): UseAdminReturn => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stats
  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await adminAPI.getStats();
      setStats(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch stats');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Users
  const fetchUsers = useCallback(async (params = {}) => {
    setIsLoading(true);
    try {
      const response = await adminAPI.getUsers(params);
      setUsers(response.data.data.users);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateUserSubscription = useCallback(async (userId: string, data: any) => {
    try {
      await adminAPI.updateSubscription(userId, data);
      await fetchUsers();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to update subscription');
    }
  }, [fetchUsers]);

  const revokeUserAccess = useCallback(async (userId: string) => {
    try {
      await adminAPI.revokeAccess(userId);
      await fetchUsers();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to revoke access');
    }
  }, [fetchUsers]);

  const restoreUserAccess = useCallback(async (userId: string) => {
    try {
      await adminAPI.restoreAccess(userId);
      await fetchUsers();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to restore access');
    }
  }, [fetchUsers]);

  // Channels
  const fetchAdminChannels = useCallback(async (params = {}) => {
    setIsLoading(true);
    try {
      const response = await adminAPI.getChannels(params);
      setChannels(response.data.data.channels);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch channels');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createChannel = useCallback(async (data: Partial<Channel>) => {
    try {
      await adminAPI.createChannel(data);
      await fetchAdminChannels();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to create channel');
    }
  }, [fetchAdminChannels]);

  const updateChannel = useCallback(async (id: string, data: Partial<Channel>) => {
    try {
      await adminAPI.updateChannel(id, data);
      await fetchAdminChannels();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to update channel');
    }
  }, [fetchAdminChannels]);

  const deleteChannel = useCallback(async (id: string) => {
    try {
      await adminAPI.deleteChannel(id);
      await fetchAdminChannels();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to delete channel');
    }
  }, [fetchAdminChannels]);

  const toggleChannel = useCallback(async (id: string) => {
    try {
      await adminAPI.toggleChannel(id);
      await fetchAdminChannels();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to toggle channel');
    }
  }, [fetchAdminChannels]);

  // M3U
  const parseM3U = useCallback(async (file: File): Promise<ParsedChannel[]> => {
    const formData = new FormData();
    formData.append('m3uFile', file);
    
    try {
      const response = await adminAPI.parseM3U(formData);
      return response.data.data.channels;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to parse M3U file');
    }
  }, []);

  const importChannels = useCallback(async (channels: ParsedChannel[]) => {
    try {
      await adminAPI.importChannels(channels);
      await fetchAdminChannels();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to import channels');
    }
  }, [fetchAdminChannels]);

  // Playlists
  const fetchPlaylists = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await adminAPI.getPlaylists();
      setPlaylists(response.data.data.playlists);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch playlists');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createPlaylist = useCallback(async (data: Partial<Playlist>) => {
    try {
      await adminAPI.createPlaylist(data);
      await fetchPlaylists();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to create playlist');
    }
  }, [fetchPlaylists]);

  const updatePlaylist = useCallback(async (id: string, data: Partial<Playlist>) => {
    try {
      await adminAPI.updatePlaylist(id, data);
      await fetchPlaylists();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to update playlist');
    }
  }, [fetchPlaylists]);

  const deletePlaylist = useCallback(async (id: string) => {
    try {
      await adminAPI.deletePlaylist(id);
      await fetchPlaylists();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to delete playlist');
    }
  }, [fetchPlaylists]);

  return {
    stats,
    fetchStats,
    users,
    fetchUsers,
    updateUserSubscription,
    revokeUserAccess,
    restoreUserAccess,
    channels,
    fetchAdminChannels,
    createChannel,
    updateChannel,
    deleteChannel,
    toggleChannel,
    parseM3U,
    importChannels,
    playlists,
    fetchPlaylists,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    isLoading,
    error
  };
};
