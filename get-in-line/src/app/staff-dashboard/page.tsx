'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import QueueManagement from '@/components/QueueManagement';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { 
  Users, 
  Clock, 
  Play, 
  Pause, 
  UserPlus, 
  CheckCircle, 
  AlertCircle,
  BarChart3,
  Settings,
  LogOut,
  Plus,
  List,
  User
} from 'lucide-react';

interface Business {
  id: string;
  name: string;
  description: string | null;
  business_type: string | null;
  subscription_plan: string;
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
  current_position?: number;
  total_waiting?: number;
  created_at: string;
  updated_at: string;
}

interface QueueEntry {
  id: string;
  position: number;
  status: 'waiting' | 'serving' | 'served' | 'missed' | 'cancelled';
  user: {
    name: string;
    email: string;
  };
  entered_at: string;
  is_walk_in: boolean;
}

export default function StaffDashboard() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [selectedQueue, setSelectedQueue] = useState<Queue | null>(null);
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [todayStats, setTodayStats] = useState({
    customersServed: 0,
    activeQueues: 0,
    totalWaiting: 0
  });
  const [userPermissions, setUserPermissions] = useState({
    canCreateQueues: false,
    canEditQueues: false,
    canDeleteQueues: false,
    canManageQueueOperations: true,
  });

  const router = useRouter();
  const supabase = createClient();
  const { supabase: realtimeSupabase, isConnected } = useSupabaseRealtime();

  // Add role-based access control - check after user role is loaded
  useEffect(() => {
    // Only redirect if we have a role and it's not allowed
    if (userRole && userRole !== 'user' && !['staff', 'business_admin', 'super_admin'].includes(userRole)) {
      console.log('Staff dashboard: Redirecting user with role:', userRole);
      window.location.href = '/dashboard';
      return;
    }
  }, [userRole]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (!user) {
          setError('Please log in to access staff features');
          return;
        }

        // Get user's business data
        const usersResponse = await fetch('/api/users/me');
        if (!usersResponse.ok) {
          setError('Failed to fetch user data');
          return;
        }
        
        const userData = await usersResponse.json();
        
        // Set user role for access control
        console.log('Staff dashboard: Setting user role to:', userData.role);
        setUserRole(userData.role || 'user');
        
        if (!userData.businessId) {
          setError('No business associated with your account');
          return;
        }

        const businessId = userData.businessId;

        // Fetch business details
        const businessResponse = await fetch(`/api/businesses/${businessId}`);
        if (!businessResponse.ok) {
          setError('Failed to fetch business data');
          return;
        }
        const businessData = await businessResponse.json();
        setBusiness(businessData);

        // Fetch business queues
        const queuesResponse = await fetch(`/api/businesses/${businessId}/queues`);
        if (queuesResponse.ok) {
          const queuesData = await queuesResponse.json();
          setQueues(queuesData);
          setTodayStats(prev => ({ ...prev, activeQueues: queuesData.filter((q: Queue) => q.is_active).length }));
        }

        // Calculate today's stats
        const today = new Date().toISOString().split('T')[0];
        const statsResponse = await fetch(`/api/businesses/${businessId}/analytics?days=1`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setTodayStats(prev => ({
            ...prev,
            customersServed: statsData.summary?.completedServices || 0,
            totalWaiting: statsData.summary?.totalEntries || 0
          }));
        }

        // Load user permissions
        const permissionsResponse = await fetch(`/api/users/me/permissions`);
        if (permissionsResponse.ok) {
          const permissionsData = await permissionsResponse.json();
          setUserPermissions(permissionsData.permissions);
        } else {
          // Fallback to basic permissions if API fails
          setUserPermissions({
            canCreateQueues: false,
            canEditQueues: false,
            canDeleteQueues: false,
            canManageQueueOperations: true,
          });
        }

      } catch (error) {
        console.error('Error loading staff dashboard:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [supabase]);

  // Real-time subscription for queue updates
  useEffect(() => {
    if (!business?.id || !realtimeSupabase) return

    let isMounted = true
    let channel: any = null

    const setupSubscription = async () => {
      // Get current queues for subscription
      try {
        const response = await fetch(`/api/businesses/${business.id}/queues`)
        if (!response.ok || !isMounted) return
        
        const queuesData = await response.json()
        if (!isMounted || !queuesData || queuesData.length === 0) return

        const queueIds = queuesData.map((q: any) => q.id).join(',')
        
        channel = realtimeSupabase
          .channel('staff-dashboard')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'queue_entries',
              filter: `queue_id=in.(${queueIds})`
            },
            (payload) => {
              if (!isMounted) return
              
              console.log('Queue entry change detected:', payload)
              // Refresh queue data when entries change
              if (business?.id) {
                // Refresh queues
                fetch(`/api/businesses/${business.id}/queues`)
                  .then(res => res.ok ? res.json() : null)
                  .then(data => {
                    if (isMounted && data) {
                      setQueues(data)
                    }
                  })
                  .catch(console.error)
                
                // Refresh queue entries if viewing a specific queue
                if (selectedQueue) {
                  loadQueueEntries(selectedQueue.id)
                }
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'queues',
              filter: `business_id=eq.${business.id}`
            },
            (payload) => {
              if (!isMounted) return
              
              console.log('Queue status change detected:', payload)
              // Update specific queue in the list
              setQueues(prev => prev.map(q => 
                q.id === payload.new.id ? { ...q, ...payload.new } : q
              ))
            }
          )
          .subscribe((status) => {
            if (isMounted) {
              console.log('Staff dashboard subscription status:', status)
            }
          })
      } catch (error) {
        console.error('Error setting up realtime subscription:', error)
      }
    }

    setupSubscription()

    return () => {
      isMounted = false
      if (channel) {
        channel.unsubscribe()
        channel = null
      }
    }
  }, [business?.id, realtimeSupabase]) // Removed queues and selectedQueue from dependencies

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Sign out error:', error);
      router.push('/login');
    }
  };

  const handleQueueAction = async (queueId: string, action: string, userId?: string) => {
    try {
      const response = await fetch(`/api/businesses/${business?.id}/queues/${queueId}/control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to perform action');
      }

      // Refresh queue data
      const queuesResponse = await fetch(`/api/businesses/${business?.id}/queues`);
      if (queuesResponse.ok) {
        const queuesData = await queuesResponse.json();
        setQueues(queuesData);
      }

      // Refresh queue entries if viewing a specific queue
      if (selectedQueue) {
        loadQueueEntries(selectedQueue.id);
      }

    } catch (error) {
      console.error('Queue action error:', error);
      setError(error instanceof Error ? error.message : 'Failed to perform action');
    }
  };

  const loadQueueEntries = async (queueId: string) => {
    try {
      const response = await fetch(`/api/queues/${queueId}/entries`);
      if (response.ok) {
        const entries = await response.json();
        setQueueEntries(entries);
      }
    } catch (error) {
      console.error('Error loading queue entries:', error);
    }
  };

  const handleQueueSelect = (queue: Queue) => {
    setSelectedQueue(queue);
    loadQueueEntries(queue.id);
  };

  if (loading) {
    return (
      <DashboardLayout title="Staff Dashboard">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading staff dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Staff Dashboard">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex gap-2">
              <Button onClick={() => window.location.reload()} variant="outline">
                Retry
              </Button>
              <Button onClick={handleSignOut} variant="destructive">
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (!business) {
    return (
      <DashboardLayout title="Staff Dashboard">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>No Business Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">You don't have a business account yet.</p>
            <Button onClick={handleSignOut} variant="outline">
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Staff Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <header className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Staff Dashboard</h1>
              <p className="text-gray-600 mt-1">
                {business.name} • {business.business_type}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Welcome back, {user?.email}
              </p>
            </div>
            <div className="flex gap-3 items-center">
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-gray-600">
                  {isConnected ? 'Live Updates' : 'Connecting...'}
                </span>
              </div>
              <Link 
                href="/dashboard" 
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                User Dashboard
              </Link>
              <Link 
                href="/profile" 
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                Profile Settings
              </Link>
              <button 
                onClick={handleSignOut}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* Today's Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customers Served Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayStats.customersServed}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Queues</CardTitle>
              <Play className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayStats.activeQueues}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Waiting</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayStats.totalWaiting}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content with Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="queues" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Queue Management
            </TabsTrigger>
            <TabsTrigger value="operations" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Operations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Active Queues Overview */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Active Queues</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {queues.filter(queue => queue.is_active).map((queue) => (
                  <Card key={queue.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleQueueSelect(queue)}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{queue.name}</CardTitle>
                          <CardDescription>{queue.description}</CardDescription>
                        </div>
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Active
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Waiting:</span>
                          <span className="font-medium">{queue.total_waiting || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Est. Wait:</span>
                          <span className="font-medium">{queue.estimated_wait_time || 0} min</span>
                        </div>
                        <div className="pt-2">
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQueueSelect(queue);
                            }}
                          >
                            Manage Queue
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {queues.filter(queue => queue.is_active).length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Queues</h3>
                    <p className="text-gray-600">There are no active queues at the moment.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="queues" className="space-y-6">
            <QueueManagement
              businessId={business?.id || ''}
              queues={queues}
              onQueuesChange={setQueues}
              onQueueSelect={handleQueueSelect}
              userPermissions={userPermissions}
            />
          </TabsContent>

          <TabsContent value="operations" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-6">Queue Operations</h2>
              <p className="text-gray-600 mb-6">Manage active queue operations and customer flow.</p>
              
              {selectedQueue ? (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Currently Managing: {selectedQueue.name}</CardTitle>
                      <CardDescription>Real-time queue operations</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Queue Controls */}
                        <div className="space-y-4">
                          <h4 className="font-medium">Queue Controls</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <Button 
                              onClick={() => handleQueueAction(selectedQueue.id, 'next')}
                              className="flex items-center gap-2"
                            >
                              <Users className="h-4 w-4" />
                              Call Next
                            </Button>
                            <Button 
                              variant="outline"
                              onClick={() => handleQueueAction(selectedQueue.id, 'close')}
                              className="flex items-center gap-2"
                            >
                              <Pause className="h-4 w-4" />
                              Close Queue
                            </Button>
                          </div>
                          
                          <div className="pt-4 border-t">
                            <h4 className="font-medium mb-3">Quick Actions</h4>
                            <div className="space-y-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full justify-start"
                                onClick={() => handleQueueAction(selectedQueue.id, 'open')}
                              >
                                <Play className="h-4 w-4 mr-2" />
                                Open Queue
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full justify-start"
                                onClick={() => {
                                  const name = prompt('Enter walk-in customer name:');
                                  if (name) {
                                    handleQueueAction(selectedQueue.id, 'walkin');
                                  }
                                }}
                              >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Add Walk-in
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Current Queue Status */}
                        <div className="space-y-4">
                          <h4 className="font-medium">Current Status</h4>
                          {queueEntries.length > 0 ? (
                            <div className="space-y-3">
                              {queueEntries.slice(0, 5).map((entry) => (
                                <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
                                      {entry.position}
                                    </div>
                                    <div>
                                      <p className="font-medium">{entry.user.name}</p>
                                      <p className="text-sm text-gray-600">
                                        {entry.is_walk_in ? 'Walk-in' : 'Registered'}
                                      </p>
                                    </div>
                                  </div>
                                  <Badge variant={entry.status === 'serving' ? 'default' : 'secondary'}>
                                    {entry.status}
                                  </Badge>
                                </div>
                              ))}
                              {queueEntries.length > 5 && (
                                <p className="text-sm text-gray-600 text-center">
                                  +{queueEntries.length - 5} more waiting
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                              <p className="text-gray-600">No one waiting in this queue</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Queue</h3>
                    <p className="text-gray-600">Choose a queue from the Queue Management tab to start operations.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>


        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link 
            href="/queues" 
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-lg font-semibold mb-2">Browse All Queues</h3>
            <p className="text-gray-600">View all available queues in the system</p>
          </Link>
          
          <Link 
            href="/my-queues" 
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-lg font-semibold mb-2">My Queue Entries</h3>
            <p className="text-gray-600">View your personal queue entries</p>
          </Link>
          
          <Link 
            href="/dashboard" 
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-lg font-semibold mb-2">User Dashboard</h3>
            <p className="text-gray-600">Switch to regular user view</p>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
