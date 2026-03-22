import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Users, 
  Tv, 
  ListMusic, 
  Upload, 
  Loader2,
  Shield,
  ArrowLeft
} from 'lucide-react';

// Import admin components
import DashboardStats from '@/components/admin/DashboardStats';
import UserManagement from '@/components/admin/UserManagement';
import ChannelManagement from '@/components/admin/ChannelManagement';
import M3UUpload from '@/components/admin/M3UUpload';
import PlaylistManagement from '@/components/admin/PlaylistManagement';

const Admin: React.FC = () => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [error] = useState('');

  const {
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
    isLoading
  } = useAdmin();

  // Redirect if not admin
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!isAdmin) {
      navigate('/');
      return;
    }
  }, [isAuthenticated, isAdmin, navigate]);

  // Load initial data
  useEffect(() => {
    if (isAdmin) {
      fetchStats();
      fetchUsers();
      fetchAdminChannels();
      fetchPlaylists();
    }
  }, [isAdmin, fetchStats, fetchUsers, fetchAdminChannels, fetchPlaylists]);

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Admin Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
        <div className="px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Admin Panel</h1>
                  <p className="text-xs text-gray-400">StreamFlix Management</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="border-green-600 text-green-400">
                Admin Access
              </Badge>
              <div className="hidden md:block text-right">
                <p className="text-sm text-white">{user?.name}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 md:p-8">
        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-900/50 border-red-800">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-gray-900 border border-gray-800 p-1 flex flex-wrap gap-1">
            <TabsTrigger 
              value="dashboard" 
              className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger 
              value="users"
              className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
            >
              <Users className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger 
              value="channels"
              className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
            >
              <Tv className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Channels</span>
            </TabsTrigger>
            <TabsTrigger 
              value="m3u"
              className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">M3U Upload</span>
            </TabsTrigger>
            <TabsTrigger 
              value="playlists"
              className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
            >
              <ListMusic className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Playlists</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <DashboardStats stats={stats} isLoading={isLoading} />
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <UserManagement
              users={users}
              onUpdateSubscription={updateUserSubscription}
              onRevokeAccess={revokeUserAccess}
              onRestoreAccess={restoreUserAccess}
              onRefresh={fetchUsers}
              isLoading={isLoading}
            />
          </TabsContent>

          {/* Channels Tab */}
          <TabsContent value="channels">
            <ChannelManagement
              channels={channels}
              onCreate={createChannel}
              onUpdate={updateChannel}
              onDelete={deleteChannel}
              onToggle={toggleChannel}
              onRefresh={fetchAdminChannels}
              isLoading={isLoading}
            />
          </TabsContent>

          {/* M3U Upload Tab */}
          <TabsContent value="m3u">
            <M3UUpload
              onParse={parseM3U}
              onImport={importChannels}
              isLoading={isLoading}
            />
          </TabsContent>

          {/* Playlists Tab */}
          <TabsContent value="playlists">
            <PlaylistManagement
              playlists={playlists}
              channels={channels}
              onCreate={createPlaylist}
              onUpdate={updatePlaylist}
              onDelete={deletePlaylist}
              onRefresh={fetchPlaylists}
              isLoading={isLoading}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
