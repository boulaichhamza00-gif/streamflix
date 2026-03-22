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
import { Search, RefreshCw, Edit, Trash2, Plus, Eye, EyeOff } from 'lucide-react';
import type { Channel } from '@/types';

interface ChannelManagementProps {
  channels: Channel[];
  onCreate: (data: Partial<Channel>) => Promise<void>;
  onUpdate: (id: string, data: Partial<Channel>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onToggle: (id: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  isLoading: boolean;
}

const ChannelManagement: React.FC<ChannelManagementProps> = ({
  channels,
  onCreate,
  onUpdate,
  onDelete,
  onToggle,
  onRefresh,
  isLoading
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    streamUrl: '',
    category: '',
    logo: '',
    description: '',
    country: '',
    language: ''
  });

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    channel.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      name: '',
      streamUrl: '',
      category: '',
      logo: '',
      description: '',
      country: '',
      language: ''
    });
  };

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      await onCreate(formData);
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create channel:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (channel: Channel) => {
    setSelectedChannel(channel);
    setFormData({
      name: channel.name,
      streamUrl: channel.streamUrl,
      category: channel.category,
      logo: channel.logo || '',
      description: channel.description || '',
      country: channel.country || '',
      language: channel.language || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedChannel) return;
    
    setIsSubmitting(true);
    try {
      await onUpdate(selectedChannel._id, formData);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update channel:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedChannel) return;
    
    setIsSubmitting(true);
    try {
      await onDelete(selectedChannel._id);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete channel:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const ChannelForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="text-sm text-gray-400 mb-2 block">Channel Name *</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter channel name"
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>
        <div className="col-span-2">
          <label className="text-sm text-gray-400 mb-2 block">Stream URL *</label>
          <Input
            value={formData.streamUrl}
            onChange={(e) => setFormData({ ...formData, streamUrl: e.target.value })}
            placeholder="https://example.com/stream.m3u8"
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Category *</label>
          <Input
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="e.g., Sports, News"
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Logo URL</label>
          <Input
            value={formData.logo}
            onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
            placeholder="https://example.com/logo.png"
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Country</label>
          <Input
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            placeholder="e.g., USA"
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Language</label>
          <Input
            value={formData.language}
            onChange={(e) => setFormData({ ...formData, language: e.target.value })}
            placeholder="e.g., English"
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>
        <div className="col-span-2">
          <label className="text-sm text-gray-400 mb-2 block">Description</label>
          <Input
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Channel description"
            className="bg-gray-800 border-gray-700 text-white"
          />
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
          disabled={isSubmitting || !formData.name || !formData.streamUrl || !formData.category}
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
            placeholder="Search channels..."
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
            Add Channel
          </Button>
        </div>
      </div>

      {/* Channels Table */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800 hover:bg-transparent">
                  <TableHead className="text-gray-400">Channel</TableHead>
                  <TableHead className="text-gray-400">Category</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400">Views</TableHead>
                  <TableHead className="text-gray-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChannels.map((channel) => (
                  <TableRow key={channel._id} className="border-gray-800">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {channel.logo ? (
                          <img
                            src={channel.logo}
                            alt={channel.name}
                            className="w-10 h-10 object-contain rounded bg-gray-800"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center">
                            <span className="text-lg font-bold text-gray-500">
                              {channel.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-white font-medium">{channel.name}</p>
                          {channel.country && (
                            <p className="text-sm text-gray-500">{channel.country}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-gray-600 text-gray-300">
                        {channel.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={channel.isActive}
                          onCheckedChange={() => onToggle(channel._id)}
                        />
                        {channel.isActive ? (
                          <Eye className="w-4 h-4 text-green-400" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {channel.viewCount?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(channel)}
                          className="text-gray-400 hover:text-white"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedChannel(channel);
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
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Channel</DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter the channel details below
            </DialogDescription>
          </DialogHeader>
          <ChannelForm onSubmit={handleCreate} submitLabel="Create Channel" />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Channel</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update channel details
            </DialogDescription>
          </DialogHeader>
          <ChannelForm onSubmit={handleUpdate} submitLabel="Save Changes" />
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-red-500">Delete Channel</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete "{selectedChannel?.name}"?
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
              {isSubmitting ? 'Deleting...' : 'Delete Channel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChannelManagement;
