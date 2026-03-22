import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, RefreshCw, Edit, Trash2, Plus, Eye, List, X } from 'lucide-react';
import type { Playlist, Channel } from '@/types';

interface PlaylistManagementProps {
  playlists: Playlist[];
  channels: Channel[];
  onCreate: (data: Partial<Playlist>) => Promise<void>;
  onUpdate: (id: string, data: Partial<Playlist>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  isLoading: boolean;
}

const PlaylistManagement: React.FC<PlaylistManagementProps> = ({
  playlists,
  channels,
  onCreate,
  onUpdate,
  onDelete,
  onRefresh,
  isLoading
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedChannelIds, setSelectedChannelIds] = useState<Set<string>>(new Set());

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'General',
    isPublic: false
  });

  const filteredPlaylists = playlists.filter(playlist =>
    playlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    playlist.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'General',
      isPublic: false
    });
    setSelectedChannelIds(new Set());
  };

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      await onCreate({
        name: formData.name,
        description: formData.description,
        category: formData.category,
        isPublic: formData.isPublic,
        channels: Array.from(selectedChannelIds).map(id => ({ _id: id } as Channel))
      });
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create playlist:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setFormData({
      name: playlist.name,
      description: playlist.description || '',
      category: playlist.category || 'General',
      isPublic: playlist.isPublic
    });
    setSelectedChannelIds(new Set(playlist.channels.map(c => c._id)));
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedPlaylist) return;
    
    setIsSubmitting(true);
    try {
      await onUpdate(selectedPlaylist._id, {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        isPublic: formData.isPublic,
        channels: Array.from(selectedChannelIds).map(id => ({ _id: id } as Channel))
      });
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update playlist:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPlaylist) return;
    
    setIsSubmitting(true);
    try {
      await onDelete(selectedPlaylist._id);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete playlist:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleChannelSelection = (channelId: string) => {
    const newSelected = new Set(selectedChannelIds);
    if (newSelected.has(channelId)) {
      newSelected.delete(channelId);
    } else {
      newSelected.add(channelId);
    }
    setSelectedChannelIds(newSelected);
  };

  const PlaylistForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="space-y-4 py-4">
      <div>
        <label className="text-sm text-gray-400 mb-2 block">Playlist Name *</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter playlist name"
          className="bg-gray-800 border-gray-700 text-white"
        />
      </div>
      <div>
        <label className="text-sm text-gray-400 mb-2 block">Description</label>
        <Input
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter description"
          className="bg-gray-800 border-gray-700 text-white"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Category</label>
          <Input
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="e.g., Sports, Movies"
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>
        <div className="flex items-end">
          <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
            <Switch
              checked={formData.isPublic}
              onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
            />
            <span className="text-sm text-gray-300">Public Playlist</span>
          </div>
        </div>
      </div>
      
      {/* Channel Selection */}
      <div>
        <label className="text-sm text-gray-400 mb-2 block">
          Channels ({selectedChannelIds.size} selected)
        </label>
        <div className="max-h-48 overflow-y-auto bg-gray-800 rounded-lg p-2 space-y-1">
          {channels.filter(c => c.isActive).map((channel) => (
            <div
              key={channel._id}
              className="flex items-center gap-3 p-2 hover:bg-gray-700 rounded cursor-pointer"
              onClick={() => toggleChannelSelection(channel._id)}
            >
              <input
                type="checkbox"
                checked={selectedChannelIds.has(channel._id)}
                onChange={() => {}}
                className="rounded border-gray-600"
              />
              {channel.logo && (
                <img
                  src={channel.logo}
                  alt=""
                  className="w-8 h-8 object-contain rounded bg-gray-900"
                />
              )}
              <span className="text-sm text-white">{channel.name}</span>
              <Badge variant="outline" className="ml-auto border-gray-600 text-xs">
                {channel.category}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => {
          setIsCreateDialogOpen(false);
          setIsEditDialogOpen(false);
          resetForm();
        }}>
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isSubmitting || !formData.name}
          className="bg-red-600 hover:bg-red-700"
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </DialogFooter>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search playlists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-900 border-gray-700 text-white"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={isLoading}
            className="border-gray-700 text-gray-300"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setIsCreateDialogOpen(true);
            }}
            className="bg-red-600 hover:bg-red-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Playlist
          </Button>
        </div>
      </div>

      {/* Playlists Table */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800 hover:bg-transparent">
                  <TableHead className="text-gray-400">Playlist</TableHead>
                  <TableHead className="text-gray-400">Category</TableHead>
                  <TableHead className="text-gray-400">Channels</TableHead>
                  <TableHead className="text-gray-400">Visibility</TableHead>
                  <TableHead className="text-gray-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlaylists.map((playlist) => (
                  <TableRow key={playlist._id} className="border-gray-800">
                    <TableCell>
                      <div>
                        <p className="text-white font-medium">{playlist.name}</p>
                        {playlist.description && (
                          <p className="text-sm text-gray-500 truncate max-w-xs">
                            {playlist.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-gray-600 text-gray-300">
                        {playlist.category || 'General'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2 text-gray-300">
                        <List className="w-4 h-4" />
                        {playlist.channels?.length || 0} channels
                      </span>
                    </TableCell>
                    <TableCell>
                      {playlist.isPublic ? (
                        <span className="flex items-center gap-1 text-green-400 text-sm">
                          <Eye className="w-4 h-4" />
                          Public
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-500 text-sm">
                          <X className="w-4 h-4" />
                          Private
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(playlist)}
                          className="text-gray-400 hover:text-white"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedPlaylist(playlist);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Playlist</DialogTitle>
            <DialogDescription className="text-gray-400">
              Create a new playlist and add channels
            </DialogDescription>
          </DialogHeader>
          <PlaylistForm onSubmit={handleCreate} submitLabel="Create Playlist" />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Playlist</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update playlist details and channels
            </DialogDescription>
          </DialogHeader>
          <PlaylistForm onSubmit={handleUpdate} submitLabel="Save Changes" />
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-red-500">Delete Playlist</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete &quot;{selectedPlaylist?.name}&quot;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isSubmitting}
              variant="destructive"
            >
              {isSubmitting ? 'Deleting...' : 'Delete Playlist'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlaylistManagement;
