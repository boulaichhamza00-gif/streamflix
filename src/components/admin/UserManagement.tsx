import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, RefreshCw, Ban, CheckCircle, Edit, Shield } from 'lucide-react';
import type { User } from '@/types';

interface UserManagementProps {
  users: User[];
  onUpdateSubscription: (userId: string, data: any) => Promise<void>;
  onRevokeAccess: (userId: string) => Promise<void>;
  onRestoreAccess: (userId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  isLoading: boolean;
}

const UserManagement: React.FC<UserManagementProps> = ({
  users,
  onUpdateSubscription,
  onRevokeAccess,
  onRestoreAccess,
  onRefresh,
  isLoading
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState('');
  const [subscriptionExpiry, setSubscriptionExpiry] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setSubscriptionStatus(user.subscriptionStatus);
    setSubscriptionExpiry(user.subscriptionExpiry ? new Date(user.subscriptionExpiry).toISOString().split('T')[0] : '');
    setIsEditDialogOpen(true);
  };

  const handleSaveSubscription = async () => {
    if (!selectedUser) return;
    
    setIsSubmitting(true);
    try {
      await onUpdateSubscription(selectedUser.id, {
        subscriptionStatus,
        subscriptionExpiry: subscriptionExpiry || undefined
      });
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update subscription:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async () => {
    if (!selectedUser) return;
    
    setIsSubmitting(true);
    try {
      await onRevokeAccess(selectedUser.id);
      setIsRevokeDialogOpen(false);
    } catch (error) {
      console.error('Failed to revoke access:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      premium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      basic: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      none: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
      expired: 'bg-red-500/20 text-red-400 border-red-500/50'
    };
    return variants[status] || variants.none;
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-900 border-gray-700 text-white"
          />
        </div>
        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={isLoading}
          className="border-gray-700 text-gray-300"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Users Table */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800 hover:bg-transparent">
                  <TableHead className="text-gray-400">User</TableHead>
                  <TableHead className="text-gray-400">Subscription</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400">Expiry</TableHead>
                  <TableHead className="text-gray-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-gray-800">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                          {user.isAdmin ? (
                            <Shield className="w-4 h-4 text-yellow-500" />
                          ) : (
                            <span className="text-sm text-gray-400">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusBadge(user.subscriptionStatus)}>
                        {user.subscriptionStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <span className="flex items-center gap-1 text-green-400 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-400 text-sm">
                          <Ban className="w-4 h-4" />
                          Revoked
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {user.subscriptionExpiry
                        ? new Date(user.subscriptionExpiry).toLocaleDateString()
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(user)}
                          disabled={user.isAdmin}
                          className="text-gray-400 hover:text-white"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {user.isActive ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsRevokeDialogOpen(true);
                            }}
                            disabled={user.isAdmin}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Ban className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onRestoreAccess(user.id)}
                            className="text-green-400 hover:text-green-300"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Subscription Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Edit Subscription</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update subscription for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Subscription Status</label>
              <Select value={subscriptionStatus} onValueChange={setSubscriptionStatus}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Expiry Date</label>
              <Input
                type="date"
                value={subscriptionExpiry}
                onChange={(e) => setSubscriptionExpiry(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveSubscription}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Access Dialog */}
      <Dialog open={isRevokeDialogOpen} onOpenChange={setIsRevokeDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-red-500">Revoke Access</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to revoke access for {selectedUser?.name}?
              This will deactivate their account and expire their subscription.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRevokeDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRevoke}
              disabled={isSubmitting}
              variant="destructive"
            >
              {isSubmitting ? 'Revoking...' : 'Revoke Access'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
