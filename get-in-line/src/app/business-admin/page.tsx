'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import RealTimeQueue from '@/components/RealTimeQueue';

interface Business {
  id: string;
  name: string;
  description: string | null;
  business_type: string | null;
  subscription_plan: string;
  is_active: boolean;
  created_at: string;
}

interface Branch {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
}

interface Queue {
  id: string;
  name: string;
  description: string | null;
  service_type: string | null;
  max_size: number | null;
  is_active: boolean;
  estimated_wait_time: number | null;
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

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (!user) {
          setError('Please log in to access business admin features');
          return;
        }

        // Get user's business using new efficient endpoint
        const usersResponse = await fetch('/api/users/me');
        if (!usersResponse.ok) {
          setError('Failed to fetch user data');
          return;
        }
        
        const userData = await usersResponse.json();
        
        if (!userData.businessId) {
          setError('No business associated with your account');
          return;
        }

        const businessId = userData.businessId;

        // Fetch business details using API
        const businessResponse = await fetch(`/api/businesses/${businessId}`);
        if (!businessResponse.ok) {
          setError('Failed to fetch business data');
          return;
        }
        const businessData = await businessResponse.json();
        setBusiness(businessData);

        // Fetch branches using API
        const branchesResponse = await fetch(`/api/businesses/${businessId}/branches`);
        if (branchesResponse.ok) {
          const branchesData = await branchesResponse.json();
          setBranches(branchesData || []);
        } else {
          setBranches([]);
        }

        // Fetch queues using API
        const queuesResponse = await fetch('/api/queues');
        if (queuesResponse.ok) {
          const queuesData = await queuesResponse.json();
          // Filter queues for this business
          const businessQueues = queuesData.queues.filter((queue: any) => 
            queue.businessId === businessId || queue.business_id === businessId
          );
          setQueues(businessQueues || []);
        } else {
          setQueues([]);
        }

        // Fetch analytics
        try {
          const analyticsResponse = await fetch(`/api/businesses/${businessId}/analytics?days=7`);
          if (analyticsResponse.ok) {
            const analyticsData = await analyticsResponse.json();
            setAnalytics(analyticsData);
          }
        } catch (analyticsError) {
          console.error('Analytics error:', analyticsError);
        }

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
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

  const handleDeleteQueue = async (queueId: string) => {
    if (!confirm('Are you sure you want to delete this queue? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/queues?id=${queueId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete queue');
      }

      // Refresh the page to update the queue list
      window.location.reload();
    } catch (err: any) {
      alert(`Failed to delete queue: ${err.message}`);
    }
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
                {business.business_type && `${business.business_type} • `}
                {business.subscription_plan} plan
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
              <button 
                onClick={handleSignOut}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* Quick Stats */}
        {analytics && (
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Queues Management */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Queue Management</h2>
                <Link 
                  href="/queues/create" 
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Create Queue
                </Link>
              </div>
            </div>
            <div className="p-6">
              {queues.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No queues created yet</p>
              ) : (
                <div className="space-y-4">
                  {queues.map((queue) => (
                    <div key={queue.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{queue.name}</h3>
                          {queue.service_type && (
                            <p className="text-sm text-gray-500">{queue.service_type}</p>
                          )}
                          <div className="flex gap-4 mt-2 text-sm">
                            <span className={`px-2 py-1 rounded ${
                              queue.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {queue.is_active ? 'Active' : 'Inactive'}
                            </span>
                            {queue.max_size && (
                              <span className="text-gray-500">Max: {queue.max_size}</span>
                            )}
                            {queue.estimated_wait_time && (
                              <span className="text-gray-500">~{queue.estimated_wait_time} min wait</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link 
                            href={`/business-admin/queues/${queue.id}`}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Manage
                          </Link>
                          <button
                            onClick={() => handleDeleteQueue(queue.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
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

          {/* Branches Management */}
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
                            branch.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {branch.is_active ? 'Active' : 'Inactive'}
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
        </div>

        {/* Real-time Queue Status */}
        {queues.length > 0 && (
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
          <Link 
            href="/business-admin/staff" 
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-lg font-semibold mb-2">Staff Management</h3>
            <p className="text-gray-600">Manage staff accounts and permissions</p>
          </Link>
          
          <Link 
            href="/business-admin/analytics" 
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-lg font-semibold mb-2">Analytics</h3>
            <p className="text-gray-600">View detailed analytics and reports</p>
          </Link>
          
          <Link 
            href="/business-admin/notifications" 
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-lg font-semibold mb-2">Notifications</h3>
            <p className="text-gray-600">Send announcements and manage notifications</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
