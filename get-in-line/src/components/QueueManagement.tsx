'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  Users, 
  Clock,
  Settings
} from 'lucide-react';

interface Queue {
  id: string;
  name: string;
  description: string | null;
  service_type: string | null;
  max_size: number | null;
  is_active: boolean;
  estimated_wait_time: number | null;
  current_position?: number;
  total_waiting?: number;
  created_at: string;
  updated_at: string;
}

interface QueueManagementProps {
  businessId: string;
  queues: Queue[];
  onQueuesChange: (queues: Queue[]) => void;
  onQueueSelect: (queue: Queue) => void;
  userPermissions?: {
    canCreateQueues: boolean;
    canEditQueues: boolean;
    canDeleteQueues: boolean;
  };
}

export default function QueueManagement({ 
  businessId, 
  queues, 
  onQueuesChange, 
  onQueueSelect,
  userPermissions = {
    canCreateQueues: false,
    canEditQueues: false,
    canDeleteQueues: false
  }
}: QueueManagementProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingQueue, setEditingQueue] = useState<Queue | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    serviceType: '',
    maxSize: '',
    estimatedWaitTime: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      serviceType: '',
      maxSize: '',
      estimatedWaitTime: '',
    });
    setError(null);
  };

  const handleCreateQueue = async () => {
    if (!formData.name.trim()) {
      setError('Queue name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/queues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          serviceType: formData.serviceType.trim() || null,
          maxSize: formData.maxSize && parseInt(formData.maxSize) > 0 ? parseInt(formData.maxSize) : null,
          estimatedWaitTime: formData.estimatedWaitTime && parseInt(formData.estimatedWaitTime) > 0 ? parseInt(formData.estimatedWaitTime) : null,
          isActive: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create queue');
      }

      // Refresh queues list
      const queuesResponse = await fetch(`/api/businesses/${businessId}/queues`);
      if (queuesResponse.ok) {
        const updatedQueues = await queuesResponse.json();
        onQueuesChange(updatedQueues);
      }

      setIsCreateDialogOpen(false);
      resetForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditQueue = async () => {
    if (!editingQueue || !formData.name.trim()) {
      setError('Queue name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/queues/${editingQueue.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          serviceType: formData.serviceType.trim() || null,
          maxSize: formData.maxSize && parseInt(formData.maxSize) > 0 ? parseInt(formData.maxSize) : null,
          estimatedWaitTime: formData.estimatedWaitTime && parseInt(formData.estimatedWaitTime) > 0 ? parseInt(formData.estimatedWaitTime) : null,
          isActive: editingQueue.is_active,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update queue');
      }

      // Refresh queues list
      const queuesResponse = await fetch(`/api/businesses/${businessId}/queues`);
      if (queuesResponse.ok) {
        const updatedQueues = await queuesResponse.json();
        onQueuesChange(updatedQueues);
      }

      setIsEditDialogOpen(false);
      setEditingQueue(null);
      resetForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQueue = async (queueId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/queues/${queueId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete queue');
      }

      // Refresh queues list
      const queuesResponse = await fetch(`/api/businesses/${businessId}/queues`);
      if (queuesResponse.ok) {
        const updatedQueues = await queuesResponse.json();
        onQueuesChange(updatedQueues);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleQueueStatus = async (queueId: string, currentStatus: boolean) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/queues/${queueId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !currentStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update queue status');
      }

      // Refresh queues list
      const queuesResponse = await fetch(`/api/businesses/${businessId}/queues`);
      if (queuesResponse.ok) {
        const updatedQueues = await queuesResponse.json();
        onQueuesChange(updatedQueues);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (queue: Queue) => {
    setEditingQueue(queue);
    setFormData({
      name: queue.name,
      description: queue.description || '',
      serviceType: queue.service_type || '',
      maxSize: queue.max_size?.toString() || '',
      estimatedWaitTime: queue.estimated_wait_time?.toString() || '',
    });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Queue Management</h2>
          <p className="text-gray-600">Create and manage your business queues</p>
        </div>
        {userPermissions.canCreateQueues && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Create Queue
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Queue</DialogTitle>
                <DialogDescription>
                  Set up a new queue for customers to join.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Queue Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Customer Service, Coffee Shop"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description..."
                    rows={3}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="serviceType">Service Type</Label>
                  <Input
                    id="serviceType"
                    value={formData.serviceType}
                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                    placeholder="e.g., Consultation, Order Pickup"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="maxSize">Max Capacity</Label>
                    <Input
                      id="maxSize"
                      type="number"
                      value={formData.maxSize}
                      onChange={(e) => setFormData({ ...formData, maxSize: e.target.value })}
                      placeholder="Unlimited"
                      min="1"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="estimatedWaitTime">Est. Wait (min)</Label>
                    <Input
                      id="estimatedWaitTime"
                      type="number"
                      value={formData.estimatedWaitTime}
                      onChange={(e) => setFormData({ ...formData, estimatedWaitTime: e.target.value })}
                      placeholder="5"
                      min="1"
                    />
                  </div>
                </div>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateQueue} disabled={loading}>
                  {loading ? 'Creating...' : 'Create Queue'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Queues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {queues.map((queue) => (
          <Card key={queue.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{queue.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {queue.description || 'No description'}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant={queue.is_active ? "default" : "secondary"}>
                    {queue.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span>{queue.total_waiting || 0} waiting</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>{queue.estimated_wait_time || 0} min</span>
                  </div>
                </div>
                
                {queue.service_type && (
                  <div className="text-sm text-gray-600">
                    Service: {queue.service_type}
                  </div>
                )}
                
                {queue.max_size && (
                  <div className="text-sm text-gray-600">
                    Capacity: {queue.max_size} people
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex-1"
                    onClick={() => onQueueSelect(queue)}
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Manage
                  </Button>
                  
                  {userPermissions.canEditQueues && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => openEditDialog(queue)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {userPermissions.canDeleteQueues && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Queue</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{queue.name}"? This action cannot be undone and will remove all queue entries.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteQueue(queue.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>

                <div className="pt-2 border-t">
                  <Button 
                    size="sm" 
                    variant={queue.is_active ? "destructive" : "default"}
                    className="w-full"
                    onClick={() => handleToggleQueueStatus(queue.id, queue.is_active)}
                    disabled={loading}
                  >
                    {queue.is_active ? (
                      <>
                        <Pause className="h-4 w-4 mr-1" />
                        Close Queue
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-1" />
                        Open Queue
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {queues.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Queues Yet</h3>
            <p className="text-gray-600 mb-4">Create your first queue to start managing customer flow.</p>
            {userPermissions.canCreateQueues && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Queue
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Queue</DialogTitle>
            <DialogDescription>
              Update the queue settings.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Queue Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Customer Service, Coffee Shop"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description..."
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-serviceType">Service Type</Label>
              <Input
                id="edit-serviceType"
                value={formData.serviceType}
                onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                placeholder="e.g., Consultation, Order Pickup"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-maxSize">Max Capacity</Label>
                <Input
                  id="edit-maxSize"
                  type="number"
                  value={formData.maxSize}
                  onChange={(e) => setFormData({ ...formData, maxSize: e.target.value })}
                  placeholder="Unlimited"
                  min="1"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-estimatedWaitTime">Est. Wait (min)</Label>
                <Input
                  id="edit-estimatedWaitTime"
                  type="number"
                  value={formData.estimatedWaitTime}
                  onChange={(e) => setFormData({ ...formData, estimatedWaitTime: e.target.value })}
                  placeholder="5"
                  min="1"
                />
              </div>
            </div>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditQueue} disabled={loading}>
              {loading ? 'Updating...' : 'Update Queue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
