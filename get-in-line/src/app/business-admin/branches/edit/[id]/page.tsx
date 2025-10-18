'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, MapPin, Phone, Mail, User, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

interface Business {
  id: string;
  name: string;
  businessType: string;
  ownerId: string;
}

interface Branch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  managerId?: string;
  businessId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BusinessUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface BranchFormData {
  name: string;
  location: string;
  contact_number: string;
  email: string;
  managerId: string;
}

export default function EditBranchPage() {
  const router = useRouter();
  const params = useParams();
  const branchId = params.id as string;
  const supabase = createClient();
  
  const [business, setBusiness] = useState<Business | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [businessUsers, setBusinessUsers] = useState<BusinessUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState<BranchFormData>({
    name: '',
    location: '',
    contact_number: '',
    email: '',
    managerId: '',
  });

  useEffect(() => {
    loadData();
  }, [branchId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        router.push('/login');
        return;
      }

      // Get user's business
      const userResponse = await fetch('/api/users/me');
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data');
      }
      const userData = await userResponse.json();
      
      if (!userData.businessId) {
        throw new Error('User is not associated with a business');
      }

      // Get business details
      const businessResponse = await fetch(`/api/businesses/${userData.businessId}`);
      if (!businessResponse.ok) {
        throw new Error('Failed to fetch business data');
      }
      const businessData = await businessResponse.json();
      setBusiness(businessData);

      // Get branch details
      const branchesResponse = await fetch(`/api/businesses/${userData.businessId}/branches`);
      if (!branchesResponse.ok) {
        throw new Error('Failed to fetch branches data');
      }
      const branchesData = await branchesResponse.json();
      const currentBranch = branchesData.find((b: Branch) => b.id === branchId);
      
      if (!currentBranch) {
        throw new Error('Branch not found');
      }
      setBranch(currentBranch);

      // Populate form with current branch data
      setFormData({
        name: currentBranch.name || '',
        location: currentBranch.address || '',
        contact_number: currentBranch.phone || '',
        email: currentBranch.email || '',
        managerId: currentBranch.managerId || '',
      });

      // Get all business users for manager selection (owner, admins, staff)
      const usersResponse = await fetch(`/api/businesses/${userData.businessId}/users`);
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setBusinessUsers(usersData);
      }

    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof BranchFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Branch name is required');
      return;
    }

    if (!business?.id) {
      setError('Business information not available');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const branchData = {
        name: formData.name.trim(),
        location: formData.location.trim() || undefined,
        contact_number: formData.contact_number.trim() || undefined,
        email: formData.email.trim() || undefined,
        managerId: formData.managerId || undefined,
      };

      const response = await fetch(`/api/businesses/${business.id}/branches?branchId=${branchId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(branchData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update branch');
      }

      setSuccess(true);
      
      // Redirect back to business admin dashboard after 2 seconds
      setTimeout(() => {
        router.push('/business-admin');
      }, 2000);

    } catch (err: any) {
      console.error('Error updating branch:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!business || !branch) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto p-6">
          <Alert>
            <AlertDescription>
              Unable to load business or branch information. Please make sure you have access to this branch.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  if (success) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto p-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Save className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Branch Updated Successfully!</h2>
                <p className="text-gray-600 mb-4">
                  The branch "{formData.name}" has been updated successfully.
                </p>
                <p className="text-sm text-gray-500">
                  Redirecting you back to the business dashboard...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link 
            href="/business-admin"
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              Edit Branch
            </CardTitle>
            <CardDescription>
              Update the information for "{branch.name}" branch
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Branch Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center">
                  <Building2 className="h-4 w-4 mr-2" />
                  Branch Name *
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Downtown Location, Mall Branch"
                  required
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Location
                </Label>
                <Textarea
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Enter the full location/address of this branch"
                  rows={3}
                />
              </div>

              {/* Contact Number */}
              <div className="space-y-2">
                <Label htmlFor="contact_number" className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  Contact Number
                </Label>
                <Input
                  id="contact_number"
                  type="tel"
                  value={formData.contact_number}
                  onChange={(e) => handleInputChange('contact_number', e.target.value)}
                  placeholder="e.g., +1 (555) 123-4567"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="e.g., downtown@business.com"
                />
              </div>

              {/* Manager */}
              <div className="space-y-2">
                <Label htmlFor="managerId" className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Branch Manager
                </Label>
                <Select
                  value={formData.managerId || "none"}
                  onValueChange={(value) => handleInputChange('managerId', value === "none" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a manager (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No manager assigned</SelectItem>
                    {businessUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email}) - {user.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/business-admin')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? 'Updating...' : 'Update Branch'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
