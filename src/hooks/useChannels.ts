import { useState, useEffect, useCallback } from 'react';
import { channelsAPI } from '@/services/api';
import type { Channel, ChannelsResponse } from '@/types';

interface UseChannelsReturn {
  channels: Channel[];
  categories: string[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  fetchChannels: (params?: { category?: string; search?: string; page?: number; limit?: number }) => Promise<void>;
  fetchCategories: () => Promise<void>;
}

export const useChannels = (): UseChannelsReturn => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });

  const fetchChannels = useCallback(async (params = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await channelsAPI.getAll(params);
      const data: ChannelsResponse = response.data.data;
      setChannels(data.channels);
      setCategories(data.categories);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch channels');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await channelsAPI.getCategories();
      setCategories(response.data.data.categories.map((c: any) => c._id));
    } catch (err: any) {
      console.error('Failed to fetch categories:', err);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  return {
    channels,
    categories,
    isLoading,
    error,
    pagination,
    fetchChannels,
    fetchCategories
  };
};
