export interface User {
  id: string;
  email: string;
  name: string;
  subscriptionStatus: 'none' | 'basic' | 'premium' | 'expired';
  subscriptionExpiry?: string;
  isAdmin: boolean;
  isActive: boolean;
  favorites?: Channel[];
  hasValidSubscription?: () => boolean;
}

export interface Channel {
  _id: string;
  name: string;
  streamUrl: string;
  category: string;
  logo?: string;
  description?: string;
  isActive: boolean;
  groupTitle?: string;
  tvgId?: string;
  tvgName?: string;
  country?: string;
  language?: string;
  viewCount?: number;
  addedBy?: User;
  createdAt?: string;
  updatedAt?: string;
}

export interface Playlist {
  _id: string;
  name: string;
  description?: string;
  channels: Channel[];
  createdBy: User;
  isPublic: boolean;
  category?: string;
  thumbnail?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ParsedChannel {
  id: string;
  name: string;
  streamUrl: string;
  category: string;
  logo?: string;
  groupTitle?: string;
  tvgId?: string;
  tvgName?: string;
  country?: string;
  language?: string;
  duration?: number;
  raw?: string;
  selected?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ChannelsResponse {
  channels: Channel[];
  categories: string[];
  pagination: PaginationData;
}

export interface AdminStats {
  users: {
    total: number;
    active: number;
  };
  channels: {
    total: number;
    active: number;
  };
  playlists: number;
  subscriptions: {
    none: number;
    basic: number;
    premium: number;
    expired: number;
  };
}
