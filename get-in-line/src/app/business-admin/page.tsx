'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import RealTimeQueue from '@/components/RealTimeQueue';
import QueueManagement from '@/components/QueueManagement';
import { APP_CONFIG } from '@/lib/config';
import { useRealtimeAnalytics } from '@/hooks/useRealtimeAnalytics';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
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

// Analytics interface is now imported from useRealtimeAnalytics hook

export default function BusinessAdminPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<StaffPermissions | null>(null);
  const [selectedQueue, setSelectedQueue] = useState<Queue | null>(null);

  // Real-time analytics hook
  const {
    analytics,
    loading: analyticsLoading,
    error: analyticsError,
    lastUpdated,
    refresh: refreshAnalytics,
  } = useRealtimeAnalytics({
    businessId: business?.id || '',
    enabled: !!business?.id && !!userPermissions?.canViewAnalytics,
  });

  const supabase = createClient();

  // Real-time updates hook
  const { isConnected, connectionError } = useRealtimeUpdates({
    businessId: business?.id || '',
    enabled: !!business?.id,
    onQueueUpdate: (data) => {
      console.log('Real-time queue update:', data);
      // Update queues state with real-time data
      setQueues(prevQueues => 
        prevQueues.map(queue => 
          queue.id === data.queueId 
            ? { ...queue, ...data.updates }
            : queue
        )
      );
    },
    onAnalyticsUpdate: () => {
      console.log('Real-time analytics update');
      refreshAnalytics();
    },
    onBranchUpdate: (data) => {
      console.log('Real-time branch update:', data);
      // Update branches state with real-time data
      if (data.action === 'delete') {
        setBranches(prevBranches => prevBranches.filter(branch => branch.id !== data.branchId));
      } else {
        setBranches(prevBranches => 
          prevBranches.map(branch => 
            branch.id === data.branchId 
              ? { ...branch, ...data.updates }
              : branch
          )
        );
      }
    },
  });

  // Add role-based access control - check after user role is loaded
  useEffect(() => {
    // Only redirect if we have a role and it's not allowed
    if (userRole && userRole !== APP_CONFIG.ROLES.DEFAULT_ROLE && !APP_CONFIG.ROLES.ALLOWED_BUSINESS_ROLES.includes(userRole as any)) {
      console.log('Business admin page: Redirecting user with role:', userRole);
      window.location.href = APP_CONFIG.ROUTES.DASHBOARD;
      return;
    }
  }, [userRole]);

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
            setError(APP_CONFIG.MESSAGES.LOADING.TIMEOUT);
            setLoading(false);
          }
        }, APP_CONFIG.TIMEOUTS.LOADING_TIMEOUT);

        // Get current user
        console.log('Business admin dashboard: Getting current user...');
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!isMounted) return; // Check again after async operation
        
        setUser(user);

        if (!user) {
          console.log('Business admin dashboard: No user found');
          setError(APP_CONFIG.MESSAGES.ERRORS.LOGIN_REQUIRED);
          return;
        }

        console.log('Business admin dashboard: User found:', user.id);

        // Get user's business using new efficient endpoint
        console.log('Business admin dashboard: Fetching user data...');
        const usersResponse = await fetch(APP_CONFIG.API_ENDPOINTS.USERS.ME);
        
        if (!isMounted) return; // Check again after async operation
        
        if (!usersResponse.ok) {
          const errorText = await usersResponse.text();
          console.error('Business admin dashboard: Failed to fetch user data:', usersResponse.status, errorText);
          setError(`Failed to fetch user data: ${usersResponse.status} ${errorText}`);
          return;
        }
        
        const userData = await usersResponse.json();
        console.log('Business admin dashboard: User data received:', userData);
        
        // Set user role for access control
        console.log('Business admin page: Setting user role to:', userData.role);
        setUserRole(userData.role || APP_CONFIG.ROLES.DEFAULT_ROLE);
        
        if (!userData.businessId) {
          console.log('Business admin dashboard: No business ID found');
          setError(APP_CONFIG.MESSAGES.ERRORS.NO_BUSINESS);
          return;
        }

        const businessId = userData.businessId;
        console.log('Business admin dashboard: Business ID:', businessId);

        // Get user permissions via API
        try {
          const permissionsResponse = await fetch(APP_CONFIG.API_ENDPOINTS.USERS.PERMISSIONS);
          if (permissionsResponse.ok) {
            const permissionsData = await permissionsResponse.json();
            setUserPermissions(permissionsData.permissions);
            console.log('User permissions:', permissionsData.permissions);
          } else {
            // Set default permissions for business admin
            setUserPermissions(APP_CONFIG.DEFAULT_BUSINESS_ADMIN_PERMISSIONS);
          }
        } catch (permError) {
          console.error('Error fetching permissions:', permError);
          // Set default permissions for business admin
          setUserPermissions(APP_CONFIG.DEFAULT_BUSINESS_ADMIN_PERMISSIONS);
        }

        // Fetch business details using API
        console.log('Business admin dashboard: Fetching business data...');
        const businessResponse = await fetch(APP_CONFIG.API_ENDPOINTS.BUSINESSES.BY_ID(businessId));
        
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
        const branchesResponse = await fetch(APP_CONFIG.API_ENDPOINTS.BUSINESSES.BRANCHES(businessId));
        if (!isMounted) return; // Check again after async operation
        
        if (branchesResponse.ok) {
          const branchesData = await branchesResponse.json();
          setBranches(branchesData || []);
        } else {
          setBranches([]);
        }

        // Fetch queues using API
        const queuesResponse = await fetch(APP_CONFIG.API_ENDPOINTS.QUEUES);
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

        // Analytics are now handled by the useRealtimeAnalytics hook

      } catch (err: any) {
        if (isMounted) {
          console.error('Business admin dashboard: Error in loadData:', err);
          setError(`${APP_CONFIG.MESSAGES.ERRORS.DASHBOARD_FAILED}: ${err.message}`);
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
      window.location.href = APP_CONFIG.ROUTES.LOGIN;
    } catch (error) {
      console.error('Sign out error:', error);
      // Force redirect even if sign out fails
      window.location.href = APP_CONFIG.ROUTES.LOGIN;
    }
  };

  const handleQueuesChange = (updatedQueues: Queue[]) => {
    setQueues(updatedQueues);
  };

  const handleQueueSelect = (queue: Queue) => {
    setSelectedQueue(queue);
    // Navigate to the detailed queue management page
    window.location.href = APP_CONFIG.ROUTES.BUSINESS_ADMIN.QUEUES(queue.id);
  };

  const handleDeleteBranch = async (branchId: string) => {
    if (!business?.id) return;
    
    if (!confirm(APP_CONFIG.MESSAGES.CONFIRMATIONS.DELETE_BRANCH)) {
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`${APP_CONFIG.API_ENDPOINTS.BUSINESSES.BRANCHES(business.id)}?branchId=${branchId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || APP_CONFIG.MESSAGES.ERRORS.DELETE_BRANCH_FAILED);
      }

      // Remove the branch from the local state
      setBranches(prevBranches => prevBranches.filter(branch => branch.id !== branchId));
      
      // Show success message
      alert(APP_CONFIG.MESSAGES.SUCCESS.BRANCH_DELETED);
      
    } catch (error: any) {
      console.error('Delete branch error:', error);
      alert(`${APP_CONFIG.MESSAGES.ERRORS.DELETE_BRANCH_FAILED}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Business Admin">
        <div className="text-center">
          <div className="text-gray-600">{APP_CONFIG.MESSAGES.LOADING.DASHBOARD}</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Business Admin">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
          <Link href={APP_CONFIG.ROUTES.DASHBOARD} className={`mt-4 inline-block ${APP_CONFIG.STYLES.BUTTONS.PRIMARY}`}>
            Back to Dashboard
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  if (!business) {
    return (
      <DashboardLayout title="Business Admin">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">No Business Found</h2>
          <p className="text-yellow-600 mb-4">You don't have a business account yet.</p>
          <Link href={APP_CONFIG.ROUTES.BUSINESS_ADMIN.CREATE} className={APP_CONFIG.STYLES.BUTTONS.SUCCESS}>
            Create Business Account
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Business Admin">
      <div className="space-y-6">
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
            <div className="flex gap-4 items-center">
              {/* Real-time connection status */}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Live' : 'Offline'}
                </span>
                {lastUpdated && (
                  <span className="text-xs text-gray-500">
                    Updated: {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </div>
              
              <Link 
                href={APP_CONFIG.ROUTES.DASHBOARD} 
                className={APP_CONFIG.STYLES.BUTTONS.SECONDARY}
              >
                User Dashboard
              </Link>
              <Link 
                href={APP_CONFIG.ROUTES.PROFILE} 
                className={APP_CONFIG.STYLES.BUTTONS.PRIMARY}
              >
                Profile Settings
              </Link>
              <button 
                onClick={handleSignOut}
                className={APP_CONFIG.STYLES.BUTTONS.DANGER}
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
                  href={APP_CONFIG.ROUTES.QUEUES.CREATE} 
                  className={`${APP_CONFIG.STYLES.BUTTONS.PRIMARY} flex items-center gap-2`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Queue
                </Link>
              )}
              {userPermissions?.canManageStaff && (
                <Link 
                  href={APP_CONFIG.ROUTES.BUSINESS_ADMIN.STAFF} 
                  className={`${APP_CONFIG.STYLES.BUTTONS.SUCCESS} flex items-center gap-2`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  Manage Staff
                </Link>
              )}
              {userPermissions?.canManageBranches && (
                <Link 
                  href={APP_CONFIG.ROUTES.BUSINESS_ADMIN.BRANCHES.CREATE} 
                  className={`${APP_CONFIG.STYLES.BUTTONS.PURPLE} flex items-center gap-2`}
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

        {/* Quick Stats - Real-time Analytics */}
        {userPermissions?.canViewAnalytics && (
          <div className={APP_CONFIG.STYLES.GRIDS.STATS}>
            {analyticsLoading ? (
              <div className="col-span-full text-center py-8">
                <div className="text-gray-600">Loading analytics...</div>
              </div>
            ) : analyticsError ? (
              <div className="col-span-full text-center py-8">
                <div className="text-red-600">Error loading analytics: {analyticsError}</div>
                <button 
                  onClick={refreshAnalytics}
                  className="mt-2 text-blue-600 hover:text-blue-800"
                >
                  Retry
                </button>
              </div>
            ) : analytics ? (
              <>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500">Total Queues</h3>
                  <p className="text-2xl font-bold text-blue-600">{analytics.summary.totalQueues}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500">Total Entries ({APP_CONFIG.ANALYTICS.DEFAULT_DAYS} days)</h3>
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
              </>
            ) : (
              <div className="col-span-full text-center py-8">
                <div className="text-gray-500">No analytics data available</div>
              </div>
            )}
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
        <div className={APP_CONFIG.STYLES.GRIDS.MAIN_CONTENT}>

          {/* Branches Management */}
          {userPermissions?.canManageBranches && (
            <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Branches</h2>
                <Link 
                  href={APP_CONFIG.ROUTES.BUSINESS_ADMIN.BRANCHES.CREATE} 
                  className={APP_CONFIG.STYLES.BUTTONS.SUCCESS}
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
                            branch.isActive ? APP_CONFIG.STYLES.STATUS.ACTIVE : APP_CONFIG.STYLES.STATUS.INACTIVE
                          }`}>
                            {branch.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Link 
                            href={APP_CONFIG.ROUTES.BUSINESS_ADMIN.BRANCHES.EDIT(branch.id)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDeleteBranch(branch.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                            disabled={loading}
                          >
                            Delete
                          </button>
                        </div>
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
            <div className={APP_CONFIG.STYLES.GRIDS.QUEUES}>
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
        <div className={`mt-8 ${APP_CONFIG.STYLES.GRIDS.MANAGEMENT_LINKS}`}>
          {userPermissions?.canManageStaff && (
            <Link 
              href={APP_CONFIG.ROUTES.BUSINESS_ADMIN.STAFF} 
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
              href={APP_CONFIG.ROUTES.BUSINESS_ADMIN.ANALYTICS} 
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
            <h3 className="text-lg font-semibold mb-2">Analytics</h3>
            <p className="text-gray-600">View detailed analytics and reports</p>
          </Link>
          )}
          
          {userPermissions?.canSendNotifications && (
            <Link 
              href={APP_CONFIG.ROUTES.BUSINESS_ADMIN.NOTIFICATIONS} 
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
            <h3 className="text-lg font-semibold mb-2">Notifications</h3>
            <p className="text-gray-600">Send announcements and manage notifications</p>
          </Link>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
