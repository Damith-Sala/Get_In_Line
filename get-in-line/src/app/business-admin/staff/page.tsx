'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Settings, Shield, BarChart3, Bell, Building2 } from 'lucide-react';
import { StaffPermissions } from '@/lib/permission-helpers';

interface StaffMember {
  id: string;
  userId: string;
  role: string;
  permissions: string;
  isActive: boolean;
  user: {
    name: string;
    email: string;
  };
}

export default function BusinessAdminStaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [permissions, setPermissions] = useState<StaffPermissions>({
    canCreateQueues: false,
    canEditQueues: false,
    canDeleteQueues: false,
    canManageQueueOperations: true,
    canViewAnalytics: false,
    canManageStaff: false,
    canSendNotifications: false,
    canViewStaff: true,
    canExportData: false,
    canEditBusinessSettings: false,
    canManageBranches: false,
    canManageNotifications: false,
  });
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('staff');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        
        // Get user's business ID
        const userResponse = await fetch('/api/users/me');
        if (!userResponse.ok) {
          throw new Error('Failed to get user data');
        }
        
        const userData = await userResponse.json();
        setBusinessId(userData.businessId);
        
        if (!userData.businessId) {
          throw new Error('No business associated with your account');
        }
        
        // Load staff members
        const staffResponse = await fetch(`/api/businesses/${userData.businessId}/staff`);
        if (!staffResponse.ok) {
          throw new Error('Failed to load staff members');
        }
        
        const staffData = await staffResponse.json();
        setStaff(staffData);
      } catch (error) {
        console.error('Error loading staff data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load staff data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleUpdatePermissions = async () => {
    if (!editingStaff || !businessId) return;

    try {
      setError(null);
      const response = await fetch(`/api/businesses/${businessId}/staff/${editingStaff.id}/permissions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permissions,
          role: editingStaff.role
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update permissions');
      }

      // Refresh staff list
      const staffResponse = await fetch(`/api/businesses/${businessId}/staff`);
      if (staffResponse.ok) {
        const staffData = await staffResponse.json();
        setStaff(staffData);
      }
      setEditingStaff(null);
    } catch (error) {
      console.error('Failed to update permissions:', error);
      setError(error instanceof Error ? error.message : 'Failed to update permissions');
    }
  };

  const handleAddStaff = async () => {
    if (!businessId || !newStaffEmail || !newStaffName) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setError(null);
      
      // First, create the user account via signup
      const signupResponse = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newStaffEmail,
          password: 'temp_password_123', // Temporary password
          name: newStaffName
        })
      });

      if (!signupResponse.ok) {
        const errorData = await signupResponse.json();
        throw new Error(errorData.error || 'Failed to create user account');
      }

      const signupData = await signupResponse.json();
      const userId = signupData.user.id;

      // Then add them as staff to the business
      const staffResponse = await fetch(`/api/businesses/${businessId}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          role: newStaffRole,
          permissions: JSON.stringify({
            canCreateQueues: true,
            canEditQueues: true,
            canDeleteQueues: true,
            canManageQueueOperations: true,
            canViewAnalytics: true,
            canManageStaff: false,
            canSendNotifications: true,
            canViewStaff: true,
            canExportData: false,
            canEditBusinessSettings: false,
            canManageBranches: false,
            canManageNotifications: true,
          })
        })
      });

      if (!staffResponse.ok) {
        const errorData = await staffResponse.json();
        throw new Error(errorData.error || 'Failed to add staff member');
      }

      // Refresh staff list
      const updatedStaffResponse = await fetch(`/api/businesses/${businessId}/staff`);
      if (updatedStaffResponse.ok) {
        const staffData = await updatedStaffResponse.json();
        setStaff(staffData);
      }

      // Reset form and close modal
      setNewStaffEmail('');
      setNewStaffName('');
      setNewStaffRole('staff');
      setShowAddStaffModal(false);
      
    } catch (error) {
      console.error('Failed to add staff member:', error);
      setError(error instanceof Error ? error.message : 'Failed to add staff member');
    }
  };

  const handleEditStaff = (member: StaffMember) => {
    setEditingStaff(member);
    try {
      const currentPermissions = member.permissions ? JSON.parse(member.permissions) : {};
      setPermissions({
        canCreateQueues: currentPermissions.canCreateQueues || false,
        canEditQueues: currentPermissions.canEditQueues || false,
        canDeleteQueues: currentPermissions.canDeleteQueues || false,
        canManageQueueOperations: currentPermissions.canManageQueueOperations !== false,
        canViewAnalytics: currentPermissions.canViewAnalytics || false,
        canManageStaff: currentPermissions.canManageStaff || false,
        canSendNotifications: currentPermissions.canSendNotifications || false,
        canViewStaff: currentPermissions.canViewStaff !== false,
        canExportData: currentPermissions.canExportData || false,
        canEditBusinessSettings: currentPermissions.canEditBusinessSettings || false,
        canManageBranches: currentPermissions.canManageBranches || false,
        canManageNotifications: currentPermissions.canManageNotifications || false,
      });
    } catch {
      setPermissions({
        canCreateQueues: false,
        canEditQueues: false,
        canDeleteQueues: false,
        canManageQueueOperations: true,
        canViewAnalytics: false,
        canManageStaff: false,
        canSendNotifications: false,
        canViewStaff: true,
        canExportData: false,
        canEditBusinessSettings: false,
        canManageBranches: false,
        canManageNotifications: false,
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'manager': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading staff management...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
              <p className="text-gray-600 mt-2">
                Manage your staff members and their permissions
              </p>
            </div>
            <Button 
              onClick={() => setShowAddStaffModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Users className="h-4 w-4 mr-2" />
              Add Staff Member
            </Button>
          </div>
        </div>

        {/* Staff List */}
        <div className="grid gap-6">
          {staff.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Staff Members</h3>
                <p className="text-gray-600">You haven't added any staff members yet.</p>
              </CardContent>
            </Card>
          ) : (
            staff.map((member) => (
              <Card key={member.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{member.user.name}</CardTitle>
                      <p className="text-gray-600">{member.user.email}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant={getRoleBadgeVariant(member.role)}>
                          {member.role.toUpperCase()}
                        </Badge>
                        <Badge variant={member.isActive ? 'default' : 'destructive'}>
                          {member.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleEditStaff(member)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Manage Permissions
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>

        {/* Permission Editor Modal */}
        {editingStaff && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Manage Permissions: {editingStaff.user.name}
                </CardTitle>
                <p className="text-gray-600">Set what this staff member can do</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                {/* Role Selection */}
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select 
                    value={editingStaff.role} 
                    onValueChange={(value) => 
                      setEditingStaff({...editingStaff, role: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff Member</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Queue Management Permissions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Queue Management
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="canCreateQueues"
                        checked={permissions.canCreateQueues}
                        onCheckedChange={(checked) => 
                          setPermissions({...permissions, canCreateQueues: !!checked})
                        }
                      />
                      <Label htmlFor="canCreateQueues">Create New Queues</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="canEditQueues"
                        checked={permissions.canEditQueues}
                        onCheckedChange={(checked) => 
                          setPermissions({...permissions, canEditQueues: !!checked})
                        }
                      />
                      <Label htmlFor="canEditQueues">Edit Existing Queues</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="canDeleteQueues"
                        checked={permissions.canDeleteQueues}
                        onCheckedChange={(checked) => 
                          setPermissions({...permissions, canDeleteQueues: !!checked})
                        }
                      />
                      <Label htmlFor="canDeleteQueues">Delete Queues</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="canManageQueueOperations"
                        checked={permissions.canManageQueueOperations}
                        onCheckedChange={(checked) => 
                          setPermissions({...permissions, canManageQueueOperations: !!checked})
                        }
                      />
                      <Label htmlFor="canManageQueueOperations">Manage Queue Operations</Label>
                    </div>
                  </div>
                </div>

                {/* Business Management Permissions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Business Management
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="canViewAnalytics"
                        checked={permissions.canViewAnalytics}
                        onCheckedChange={(checked) => 
                          setPermissions({...permissions, canViewAnalytics: !!checked})
                        }
                      />
                      <Label htmlFor="canViewAnalytics">View Analytics & Reports</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="canExportData"
                        checked={permissions.canExportData}
                        onCheckedChange={(checked) => 
                          setPermissions({...permissions, canExportData: !!checked})
                        }
                      />
                      <Label htmlFor="canExportData">Export Data</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="canManageStaff"
                        checked={permissions.canManageStaff}
                        onCheckedChange={(checked) => 
                          setPermissions({...permissions, canManageStaff: !!checked})
                        }
                      />
                      <Label htmlFor="canManageStaff">Manage Other Staff</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="canEditBusinessSettings"
                        checked={permissions.canEditBusinessSettings}
                        onCheckedChange={(checked) => 
                          setPermissions({...permissions, canEditBusinessSettings: !!checked})
                        }
                      />
                      <Label htmlFor="canEditBusinessSettings">Edit Business Settings</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="canManageBranches"
                        checked={permissions.canManageBranches}
                        onCheckedChange={(checked) => 
                          setPermissions({...permissions, canManageBranches: !!checked})
                        }
                      />
                      <Label htmlFor="canManageBranches">Manage Branches</Label>
                    </div>
                  </div>
                </div>

                {/* Notification Permissions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notifications
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="canSendNotifications"
                        checked={permissions.canSendNotifications}
                        onCheckedChange={(checked) => 
                          setPermissions({...permissions, canSendNotifications: !!checked})
                        }
                      />
                      <Label htmlFor="canSendNotifications">Send Notifications</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="canManageNotifications"
                        checked={permissions.canManageNotifications}
                        onCheckedChange={(checked) => 
                          setPermissions({...permissions, canManageNotifications: !!checked})
                        }
                      />
                      <Label htmlFor="canManageNotifications">Manage Notifications</Label>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button 
                    onClick={handleUpdatePermissions}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Save Changes
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setEditingStaff(null);
                      setError(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add Staff Modal */}
        {showAddStaffModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Add New Staff Member
                </CardTitle>
                <p className="text-gray-600">Create a new staff account for your business</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <div>
                  <Label htmlFor="staffName">Full Name *</Label>
                  <Input
                    id="staffName"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    placeholder="Enter staff member's full name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="staffEmail">Email Address *</Label>
                  <Input
                    id="staffEmail"
                    type="email"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    placeholder="Enter staff member's email"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="staffRole">Role</Label>
                  <Select value={newStaffRole} onValueChange={setNewStaffRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff Member</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-blue-800 text-sm">
                    <strong>Note:</strong> A temporary password will be set. The staff member should change it on first login.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={handleAddStaff}
                    className="bg-green-600 hover:bg-green-700 flex-1"
                  >
                    Add Staff Member
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowAddStaffModal(false);
                      setError(null);
                      setNewStaffEmail('');
                      setNewStaffName('');
                      setNewStaffRole('staff');
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

