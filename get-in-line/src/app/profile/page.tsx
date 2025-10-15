'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  User, 
  Phone, 
  Mail, 
  Bell, 
  Save, 
  Building2, 
  Calendar,
  Shield,
  Settings,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  notificationPreferences?: string;
}

interface Staff {
  id: string;
  role: string;
  permissions: any;
  isActive: boolean;
  joinedAt: string;
  business: {
    id: string;
    name: string;
    businessType: string;
    description: string;
  };
}

interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  queue_updates: boolean;
  position_changes: boolean;
  announcements: boolean;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    email: true,
    sms: false,
    push: true,
    queue_updates: true,
    position_changes: true,
    announcements: true
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users/me');
      
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }
      
      const data = await response.json();
      setUser(data.user);
      setName(data.user.name || '');
      setPhone(data.user.phone || '');
      
      // Parse notification preferences
      if (data.user.notificationPreferences) {
        try {
          const prefs = JSON.parse(data.user.notificationPreferences);
          setNotificationPrefs(prefs);
        } catch (e) {
          console.error('Error parsing notification preferences:', e);
        }
      }

      // If user is staff, fetch staff information
      if (data.user.role === 'staff') {
        try {
          const staffResponse = await fetch('/api/staff/profile');
          if (staffResponse.ok) {
            const staffData = await staffResponse.json();
            setStaff(staffData.staff);
          }
        } catch (e) {
          console.error('Error fetching staff profile:', e);
          // Don't set error here, just log it - staff info is optional
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          phone,
          notificationPreferences: notificationPrefs
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const data = await response.json();
      setUser(data.user);
      setSuccess('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationChange = (key: keyof NotificationPreferences, value: boolean) => {
    setNotificationPrefs(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'manager':
        return 'default';
      case 'staff':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertDescription>
            Failed to load profile data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${staff ? 'max-w-4xl' : 'max-w-2xl'}`}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {staff ? 'Staff Profile' : 'Profile Settings'}
          </h1>
          <p className="mt-2 text-gray-600">
            {staff 
              ? 'Manage your staff profile and business information.'
              : 'Manage your personal information and notification preferences.'
            }
          </p>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {staff ? (
          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Personal Info
              </TabsTrigger>
              <TabsTrigger value="staff" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Staff Details
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Personal Information</span>
                  </CardTitle>
                  <CardDescription>
                    Update your personal details and contact information.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>Email Address</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={user.email}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-sm text-gray-500">
                      Email cannot be changed. Contact support if you need to update your email.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center space-x-2">
                      <Phone className="h-4 w-4" />
                      <span>Phone Number</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter your phone number"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="staff" className="space-y-6">
              {/* Staff Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Staff Information</span>
                  </CardTitle>
                  <CardDescription>
                    Your staff role and business association details.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Business Information */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-5 w-5 text-gray-500" />
                      <h4 className="font-medium text-gray-900">Business Information</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Business Name</Label>
                        <p className="text-lg font-semibold">{staff.business.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Business Type</Label>
                        <p className="text-lg">{staff.business.businessType || 'Not specified'}</p>
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-sm font-medium text-gray-600">Description</Label>
                        <p className="text-gray-700">{staff.business.description || 'No description available'}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Staff Role & Status */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-5 w-5 text-gray-500" />
                      <h4 className="font-medium text-gray-900">Staff Details</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Role</Label>
                        <div className="mt-1">
                          <Badge variant={getRoleBadgeVariant(staff.role)} className="text-sm">
                            {staff.role.charAt(0).toUpperCase() + staff.role.slice(1)}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Status</Label>
                        <div className="mt-1 flex items-center space-x-2">
                          {staff.isActive ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-green-700 font-medium">Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span className="text-red-700 font-medium">Inactive</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Joined Date</Label>
                        <div className="mt-1 flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span>{formatDate(staff.joinedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Current Permissions */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Settings className="h-5 w-5 text-gray-500" />
                      <h4 className="font-medium text-gray-900">Current Permissions</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(staff.permissions).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-700">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </span>
                          <Badge variant={value ? 'default' : 'secondary'}>
                            {value ? 'Allowed' : 'Restricted'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500">
                      Permission changes must be requested from your business administrator.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              {/* Notification Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="h-5 w-5" />
                    <span>Notification Preferences</span>
                  </CardTitle>
                  <CardDescription>
                    Choose how you want to receive notifications about queue updates and announcements.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Notification Methods</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="email"
                            checked={notificationPrefs.email}
                            onCheckedChange={(checked) => 
                              handleNotificationChange('email', checked as boolean)
                            }
                          />
                          <Label htmlFor="email" className="text-sm font-medium">
                            Email notifications
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="sms"
                            checked={notificationPrefs.sms}
                            onCheckedChange={(checked) => 
                              handleNotificationChange('sms', checked as boolean)
                            }
                          />
                          <Label htmlFor="sms" className="text-sm font-medium">
                            SMS notifications
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="push"
                            checked={notificationPrefs.push}
                            onCheckedChange={(checked) => 
                              handleNotificationChange('push', checked as boolean)
                            }
                          />
                          <Label htmlFor="push" className="text-sm font-medium">
                            Push notifications
                          </Label>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">What to Notify Me About</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="queue_updates"
                            checked={notificationPrefs.queue_updates}
                            onCheckedChange={(checked) => 
                              handleNotificationChange('queue_updates', checked as boolean)
                            }
                          />
                          <Label htmlFor="queue_updates" className="text-sm font-medium">
                            Queue updates and changes
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="position_changes"
                            checked={notificationPrefs.position_changes}
                            onCheckedChange={(checked) => 
                              handleNotificationChange('position_changes', checked as boolean)
                            }
                          />
                          <Label htmlFor="position_changes" className="text-sm font-medium">
                            Position changes in queue
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="announcements"
                            checked={notificationPrefs.announcements}
                            onCheckedChange={(checked) => 
                              handleNotificationChange('announcements', checked as boolean)
                            }
                          />
                          <Label htmlFor="announcements" className="text-sm font-medium">
                            Business announcements
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Personal Information</span>
                </CardTitle>
                <CardDescription>
                  Update your personal details and contact information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>Email Address</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={user.email}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-sm text-gray-500">
                    Email cannot be changed. Contact support if you need to update your email.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>Phone Number</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your phone number"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Notification Preferences</span>
                </CardTitle>
                <CardDescription>
                  Choose how you want to receive notifications about queue updates and announcements.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Notification Methods</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="email"
                          checked={notificationPrefs.email}
                          onCheckedChange={(checked) => 
                            handleNotificationChange('email', checked as boolean)
                          }
                        />
                        <Label htmlFor="email" className="text-sm font-medium">
                          Email notifications
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="sms"
                          checked={notificationPrefs.sms}
                          onCheckedChange={(checked) => 
                            handleNotificationChange('sms', checked as boolean)
                          }
                        />
                        <Label htmlFor="sms" className="text-sm font-medium">
                          SMS notifications
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="push"
                          checked={notificationPrefs.push}
                          onCheckedChange={(checked) => 
                            handleNotificationChange('push', checked as boolean)
                          }
                        />
                        <Label htmlFor="push" className="text-sm font-medium">
                          Push notifications
                        </Label>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">What to Notify Me About</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="queue_updates"
                          checked={notificationPrefs.queue_updates}
                          onCheckedChange={(checked) => 
                            handleNotificationChange('queue_updates', checked as boolean)
                          }
                        />
                        <Label htmlFor="queue_updates" className="text-sm font-medium">
                          Queue updates and changes
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="position_changes"
                          checked={notificationPrefs.position_changes}
                          onCheckedChange={(checked) => 
                            handleNotificationChange('position_changes', checked as boolean)
                          }
                        />
                        <Label htmlFor="position_changes" className="text-sm font-medium">
                          Position changes in queue
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="announcements"
                          checked={notificationPrefs.announcements}
                          onCheckedChange={(checked) => 
                            handleNotificationChange('announcements', checked as boolean)
                          }
                        />
                        <Label htmlFor="announcements" className="text-sm font-medium">
                          Business announcements
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end mt-8">
          <Button 
            onClick={handleSave} 
            disabled={saving || !name.trim()}
            className="min-w-[120px]"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
