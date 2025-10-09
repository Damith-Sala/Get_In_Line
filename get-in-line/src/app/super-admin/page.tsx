'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface SystemStats {
  totalUsers: number;
  totalBusinesses: number;
  totalQueues: number;
  totalQueueEntries: number;
  activeQueues: number;
  recentActivity: any[];
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  businessId: string | null;
  createdAt: string;
}

interface Business {
  id: string;
  name: string;
  businessType: string | null;
  ownerId: string;
  isActive: boolean;
  createdAt: string;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // Check if we have a super admin session by testing the stats API
        try {
          const statsResponse = await fetch('/api/super-admin/stats');
          if (statsResponse.ok) {
            // Super admin session is valid
            const statsData = await statsResponse.json();
            setStats(statsData);
            
            // Create a mock user object for super admin
            setUser({
              id: 'super-admin',
              email: 'superadmin@getinline.com',
              name: 'Super Administrator',
              role: 'super_admin'
            });
            
            console.log('Super admin session verified via stats API');
          } else {
            setError('Super admin session required. Please log in first.');
            return;
          }
        } catch (error) {
          setError('Failed to verify super admin access. Please log in first.');
          return;
        }

        // Stats already loaded above
        
        // Load users
        const usersResponse = await fetch('/api/users');
        if (usersResponse.ok) {
          const allUsers = await usersResponse.json();
          setUsers(allUsers);
        }
        
        // Load businesses
        const businessesResponse = await fetch('/api/businesses');
        if (businessesResponse.ok) {
          const businessesData = await businessesResponse.json();
          setBusinesses(businessesData || []);
        }

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const loadSystemStats = async () => {
    try {
      const response = await fetch('/api/super-admin/stats');
      if (response.ok) {
        const statsData = await response.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error('Failed to load system stats:', err);
    }
  };

  const handleSignOut = async () => {
    // Clear super admin session cookie
    document.cookie = 'super-admin-session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Also try to sign out from Supabase if there's a session
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.log('Supabase signout failed, but continuing with super admin signout');
    }
    
    window.location.href = '/login';
  };

  const handleUserAction = async (userId: string, action: string) => {
    try {
      const response = await fetch(`/api/super-admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        alert(`User ${action} successful`);
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert(`Failed to ${action} user: ${errorData.error}`);
      }
    } catch (err: any) {
      alert(`Failed to ${action} user: ${err.message}`);
    }
  };

  const handleBusinessAction = async (businessId: string, action: string) => {
    try {
      const response = await fetch(`/api/super-admin/businesses/${businessId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        alert(`Business ${action} successful`);
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert(`Failed to ${action} business: ${errorData.error}`);
      }
    } catch (err: any) {
      alert(`Failed to ${action} business: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="text-gray-600">Loading super admin dashboard...</div>
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
            <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
            <p className="text-red-600">{error}</p>
            <Link href="/login" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                🔧 Super Admin Dashboard
              </h1>
              <p className="text-gray-600 text-lg">
                System Administration & Management
              </p>
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

        {/* System Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
              <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
              <h3 className="text-sm font-medium text-gray-500">Total Businesses</h3>
              <p className="text-3xl font-bold text-green-600">{stats.totalBusinesses}</p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
              <h3 className="text-sm font-medium text-gray-500">Total Queues</h3>
              <p className="text-3xl font-bold text-purple-600">{stats.totalQueues}</p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-orange-500">
              <h3 className="text-sm font-medium text-gray-500">Active Queues</h3>
              <p className="text-3xl font-bold text-orange-600">{stats.activeQueues}</p>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Users Management */}
          <div className="bg-white rounded-lg shadow-lg">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">👥 User Management</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {users.map((user) => (
                  <div key={user.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{user.name}</h3>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <div className="flex gap-2 mt-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            user.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                            user.role === 'staff' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role}
                          </span>
                          {user.businessId && (
                            <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">
                              Business User
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {user.role !== 'super_admin' && (
                          <>
                            <button
                              onClick={() => handleUserAction(user.id, 'suspend')}
                              className="text-orange-600 hover:text-orange-800 text-sm"
                            >
                              Suspend
                            </button>
                            <button
                              onClick={() => handleUserAction(user.id, 'delete')}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Businesses Management */}
          <div className="bg-white rounded-lg shadow-lg">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">🏢 Business Management</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {businesses.map((business) => (
                  <div key={business.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{business.name}</h3>
                        {business.businessType && (
                          <p className="text-sm text-gray-500">{business.businessType}</p>
                        )}
                        <div className="flex gap-2 mt-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            business.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {business.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleBusinessAction(business.id, business.isActive ? 'deactivate' : 'activate')}
                          className={`text-sm ${
                            business.isActive ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'
                          }`}
                        >
                          {business.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleBusinessAction(business.id, 'delete')}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* System Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link 
            href="/super-admin/system-logs" 
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <h3 className="text-lg font-semibold mb-2">📊 System Logs</h3>
            <p className="text-gray-600">View system activity and error logs</p>
          </Link>
          
          <Link 
            href="/super-admin/analytics" 
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <h3 className="text-lg font-semibold mb-2">📈 System Analytics</h3>
            <p className="text-gray-600">View comprehensive system analytics</p>
          </Link>
          
          <Link 
            href="/super-admin/settings" 
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <h3 className="text-lg font-semibold mb-2">⚙️ System Settings</h3>
            <p className="text-gray-600">Configure system-wide settings</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
