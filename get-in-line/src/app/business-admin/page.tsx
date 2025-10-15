'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import RealTimeQueue from '@/components/RealTimeQueue';
import QueueManagement from '@/components/QueueManagement';
// import { getUserPermissions, StaffPermissions } from '@/lib/permission-helpers';

interface StaffPermissions {
  canCreateQueues: boolean;
  canEditQueues: boolean;
  canDeleteQueues: boolean;
  canManageQueueOperations: boolean;
  canManageStaff: boolean;
  canViewStaff: boolean;
  canViewAnalytics: boolean;
  canExportData: boolean;
  canEditBusinessSettings: boolean;
  canManageBranches: boolean;
  canSendNotifications: boolean;
  canManageNotifications: boolean;
}

interface Business {
  id: string;
  name: string;
  description: string | null;
  businessType: string | null;
  subscriptionPlan: string;
  isActive: boolean;
  createdAt: string;
}

interface Branch {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
}

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

interface Analytics {
  summary: {
    totalQueues: number;
    totalEntries: number;
    averageWaitTime: number;
    peakHour: number;
    completedServices: number;
    cancelledServices: number;
  };
  dailyStats: Array<{
    date: string;
    totalEntries: number;
    completedServices: number;
    cancelledServices: number;
  }>;
  queueStats: Array<{
    queueId: string;
    queueName: string;
    serviceType: string | null;
    totalEntries: number;
    completedServices: number;
    cancelledServices: number;
    averageWaitTime: number;
  }>;
}

export default function BusinessAdminPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [userPermissions, setUserPermissions] = useState<StaffPermissions | null>(null);
  const [selectedQueue, setSelectedQueue] = useState<Queue | null>(null);

  const supabase = createClient();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isMounted = true; // Add this guard
    
    async function loadData() {
      // Add guard to prevent double execution
      if (!isMounted) {
        console.log('Business admin dashboard: Component unmounted, skipping loadData');
        return;
      }
      
      try {
        setLoading(true);
        setError(null);

        console.log('Business admin dashboard: Starting data load...');

        // Set a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (isMounted) {
            console.log('Business admin dashboard: Timeout reached');
            setError('Loading is taking longer than expected. Please check your connection and try again.');
            setLoading(false);
          }
        }, 30000); // 30 second timeout

        // Get current user
        console.log('Business admin dashboard: Getting current user...');
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!isMounted) return; // Check again after async operation
        
        setUser(user);

        if (!user) {
          console.log('Business admin dashboard: No user found');
          setError('Please log in to access business admin features');
          return;
        }

        console.log('Business admin dashboard: User found:', user.id);

        // Get user's business using new efficient endpoint
        console.log('Business admin dashboard: Fetching user data...');
        const usersResponse = await fetch('/api/users/me');
        
        if (!isMounted) return; // Check again after async operation
        
        if (!usersResponse.ok) {
          const errorText = await usersResponse.text();
          console.error('Business admin dashboard: Failed to fetch user data:', usersResponse.status, errorText);
          setError(`Failed to fetch user data: ${usersResponse.status} ${errorText}`);
          return;
        }
        
        const userData = await usersResponse.json();
        console.log('Business admin dashboard: User data received:', userData);
        
        if (!userData.businessId) {
          console.log('Business admin dashboard: No business ID found');
          setError('No business associated with your account');
          return;
        }

        const businessId = userData.businessId;
        console.log('Business admin dashboard: Business ID:', businessId);

        // Get user permissions via API
        try {
          const permissionsResponse = await fetch('/api/users/me/permissions');
          if (permissionsResponse.ok) {
            const permissionsData = await permissionsResponse.json();
            setUserPermissions(permissionsData.permissions);
            console.log('User permissions:', permissionsData.permissions);
          } else {
            // Set default permissions for business admin
            setUserPermissions({
              canCreateQueues: true,
              canEditQueues: true,
              canDeleteQueues: true,
              canManageQueueOperations: true,
              canManageStaff: true,
              canViewStaff: true,
              canViewAnalytics: true,
              canExportData: true,
              canEditBusinessSettings: true,
              canManageBranches: true,
              canSendNotifications: true,
              canManageNotifications: true,
            });
          }
        } catch (permError) {
          console.error('Error fetching permissions:', permError);
          // Set default permissions for business admin
          setUserPermissions({
            canCreateQueues: true,
            canEditQueues: true,
            canDeleteQueues: true,
            canManageQueueOperations: true,
            canManageStaff: true,
            canViewStaff: true,
            canViewAnalytics: true,
            canExportData: true,
            canEditBusinessSettings: true,
            canManageBranches: true,
            canSendNotifications: true,
            canManageNotifications: true,
          });
        }

        // Fetch business details using API
        console.log('Business admin dashboard: Fetching business data...');
        const businessResponse = await fetch(`/api/businesses/${businessId}`);
        
        if (!isMounted) return; // Check again after async operation
        
        if (!businessResponse.ok) {
          const errorText = await businessResponse.text();
          console.error('Business admin dashboard: Failed to fetch business data:', businessResponse.status, errorText);
          setError(`Failed to fetch business data: ${businessResponse.status} ${errorText}`);
          return;
        }
        
        const businessData = await businessResponse.json();
        console.log('Business admin dashboard: Business data received:', businessData);
        setBusiness(businessData);

        // Fetch branches using API
        const branchesResponse = await fetch(`/api/businesses/${businessId}/branches`);
        if (!isMounted) return; // Check again after async operation
        
        if (branchesResponse.ok) {
          const branchesData = await branchesResponse.json();
          setBranches(branchesData || []);
        } else {
          setBranches([]);
        }

        // Fetch queues using API
        const queuesResponse = await fetch('/api/queues');
        if (!isMounted) return; // Check again after async operation
        
        if (queuesResponse.ok) {
          const queuesData = await queuesResponse.json();
          console.log('All queues data:', queuesData);
          console.log('Looking for businessId:', businessId);
          
          // Filter queues for this business
          const businessQueues = queuesData.queues.filter((queue: any) => {
            const matches = queue.businessId === businessId;
            console.log(`Queue ${queue.id} (${queue.name}): businessId=${queue.businessId}, matches=${matches}`);
            return matches;
          });
          
          console.log('Filtered business queues:', businessQueues);
          setQueues(businessQueues || []);
        } else {
          console.error('Failed to fetch queues:', queuesResponse.status, queuesResponse.statusText);
          setQueues([]);
        }

        // Fetch analytics
        try {
          const analyticsResponse = await fetch(`/api/businesses/${businessId}/analytics?days=7`);
          if (!isMounted) return; // Check again after async operation
          
          if (analyticsResponse.ok) {
            const analyticsData = await analyticsResponse.json();
            setAnalytics(analyticsData);
          }
        } catch (analyticsError) {
          console.error('Analytics error:', analyticsError);
        }

      } catch (err: any) {
        if (isMounted) {
          console.error('Business admin dashboard: Error in loadData:', err);
          setError(`Dashboard loading failed: ${err.message}`);
        }
      } finally {
        if (isMounted) {
          clearTimeout(timeoutId);
          setLoading(false);
          console.log('Business admin dashboard: Data loading completed');
        }
      }
    }

    loadData();

    // Cleanup function to clear timeout and set unmounted flag
    return () => {
      isMounted = false; // Set unmounted flag
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Sign out error:', error);
      // Force redirect even if sign out fails
      window.location.href = '/login';
    }
  };

  const handleQueuesChange = (updatedQueues: Queue[]) => {
    setQueues(updatedQueues);
  };

  const handleQueueSelect = (queue: Queue) => {
    setSelectedQueue(queue);
    // Navigate to the detailed queue management page
    window.location.href = `/business-admin/queues/${queue.id}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="text-gray-600">Loading business dashboard...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-600">{error}</p>
            <Link href="/dashboard" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-yellow-800 mb-2">No Business Found</h2>
            <p className="text-yellow-600 mb-4">You don't have a business account yet.</p>
            <Link href="/business-admin/create" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              Create Business Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{business.name}</h1>
              <p className="text-gray-600 mt-1">
                {business.businessType && `${business.businessType} • `}
                {business.subscriptionPlan} plan
              </p>
              {business.description && (
                <p className="text-gray-500 mt-2">{business.description}</p>
              )}
            </div>
            <div className="flex gap-4">
              <Link 
                href="/dashboard" 
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                User Dashboard
              </Link>
              <Link 
                href="/profile" 
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Profile Settings
              </Link>
              <button 
                onClick={handleSignOut}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* Quick Navigation */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-3">
              {userPermissions?.canCreateQueues && (
                <Link 
                  href="/queues/create" 
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Queue
                </Link>
              )}
              {userPermissions?.canManageStaff && (
                <Link 
                  href="/business-admin/staff" 
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  Manage Staff
                </Link>
              )}
              {userPermissions?.canManageBranches && (
                <Link 
                  href="/business-admin/branches/create" 
                  className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Add Branch
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        {analytics && userPermissions?.canViewAnalytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Queues</h3>
              <p className="text-2xl font-bold text-blue-600">{analytics.summary.totalQueues}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Entries (7 days)</h3>
              <p className="text-2xl font-bold text-green-600">{analytics.summary.totalEntries}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Avg Wait Time</h3>
              <p className="text-2xl font-bold text-yellow-600">{analytics.summary.averageWaitTime} min</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Peak Hour</h3>
              <p className="text-2xl font-bold text-purple-600">{analytics.summary.peakHour}:00</p>
            </div>
          </div>
        )}

        {/* Queue Management Section */}
        {userPermissions && (
          <div className="mb-8">
            <QueueManagement
              businessId={business.id}
              queues={queues}
              onQueuesChange={handleQueuesChange}
              onQueueSelect={handleQueueSelect}
              userPermissions={{
                canCreateQueues: userPermissions.canCreateQueues,
                canEditQueues: userPermissions.canEditQueues,
                canDeleteQueues: userPermissions.canDeleteQueues,
              }}
            />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Branches Management */}
          {userPermissions?.canManageBranches && (
            <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Branches</h2>
                <Link 
                  href="/business-admin/branches/create" 
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Add Branch
                </Link>
              </div>
            </div>
            <div className="p-6">
              {branches.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No branches added yet</p>
              ) : (
                <div className="space-y-4">
                  {branches.map((branch) => (
                    <div key={branch.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{branch.name}</h3>
                          {branch.address && (
                            <p className="text-sm text-gray-500">{branch.address}</p>
                          )}
                          {branch.phone && (
                            <p className="text-sm text-gray-500">{branch.phone}</p>
                          )}
                          <span className={`inline-block mt-2 px-2 py-1 rounded text-sm ${
                            branch.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {branch.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <Link 
                          href={`/business-admin/branches/${branch.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          )}
        </div>

        {/* Real-time Queue Status */}
        {queues.length > 0 && userPermissions?.canManageQueueOperations && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-6">Live Queue Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {queues.map((queue) => (
                <div key={queue.id}>
                  <h3 className="text-lg font-semibold mb-2">{queue.name}</h3>
                  <RealTimeQueue 
                    queueId={queue.id} 
                    userId={user?.id}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Management Links */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {userPermissions?.canManageStaff && (
            <Link 
              href="/business-admin/staff" 
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border-l-4 border-blue-500"
            >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">Staff Management</h3>
            </div>
            <p className="text-gray-600">Manage staff accounts and permissions</p>
            <div className="mt-3 text-sm text-blue-600 font-medium">
              Control who can create queues, view analytics, and manage operations
            </div>
          </Link>
          )}
          
          {userPermissions?.canViewAnalytics && (
            <Link 
              href="/business-admin/analytics" 
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
            <h3 className="text-lg font-semibold mb-2">Analytics</h3>
            <p className="text-gray-600">View detailed analytics and reports</p>
          </Link>
          )}
          
          {userPermissions?.canSendNotifications && (
            <Link 
              href="/business-admin/notifications" 
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
            <h3 className="text-lg font-semibold mb-2">Notifications</h3>
            <p className="text-gray-600">Send announcements and manage notifications</p>
          </Link>
          )}
        </div>
      </div>
    </div>
  );
}
