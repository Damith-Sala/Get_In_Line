'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, 
  Building2, 
  BarChart3, 
  Settings, 
  LogOut, 
  Home, 
  Shield,
  UserCheck,
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';

interface SystemStats {
  totalUsers: number;
  totalBusinesses: number;
  totalQueues: number;
  totalQueueEntries: number;
  activeQueues: number;
  recentActivity: any[];
  
  // Enhanced analytics
  queueAnalytics: {
    averageWaitTime: number;
    peakHour: number;
    busiestDay: string;
    queueEfficiency: number;
    customerSatisfaction: number;
  };
  
  customerFlow: {
    totalCustomersToday: number;
    customersServedToday: number;
    averageServiceTime: number;
    peakHours: number[];
    dailyFlow: Array<{
      hour: number;
      entries: number;
      exits: number;
    }>;
  };
  
  waitTimeAnalytics: {
    averageWaitTime: number;
    longestWaitTime: number;
    shortestWaitTime: number;
    waitTimeDistribution: Array<{
      range: string;
      count: number;
    }>;
    queueBottlenecks: Array<{
      queueId: string;
      queueName: string;
      averageWaitTime: number;
      currentWaiting: number;
    }>;
  };
  
  businessComparison: Array<{
    businessId: string;
    businessName: string;
    totalQueues: number;
    activeQueues: number;
    totalEntries: number;
    averageWaitTime: number;
    efficiency: number;
  }>;
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

interface UserCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  count: number;
  users: User[];
}

interface CategorizedUsers {
  customers: UserCategory;
  businessUsers: UserCategory;
  platformAdmins: UserCategory;
  suspended: UserCategory;
  inactive: UserCategory;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [categorizedUsers, setCategorizedUsers] = useState<CategorizedUsers | null>(null);
  const [allQueues, setAllQueues] = useState<any[]>([]);
  const [filteredQueues, setFilteredQueues] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [editingQueue, setEditingQueue] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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
          setCategorizedUsers(categorizeUsers(allUsers));
        }
        
        // Load businesses
        const businessesResponse = await fetch('/api/businesses');
        if (businessesResponse.ok) {
          const businessesData = await businessesResponse.json();
          setBusinesses(businessesData || []);
        }
        
        // Load all queues
        const queuesResponse = await fetch('/api/super-admin/queues');
        if (queuesResponse.ok) {
          const queuesData = await queuesResponse.json();
          setAllQueues(queuesData.queues || []);
        }

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Filter queues based on search and filter criteria
  useEffect(() => {
    let filtered = allQueues;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(queue => 
        queue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        queue.business?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        queue.serviceType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        queue.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Business filter
    if (selectedBusiness) {
      filtered = filtered.filter(queue => queue.business?.id === selectedBusiness);
    }

    // Status filter
    if (selectedStatus) {
      if (selectedStatus === 'active') {
        filtered = filtered.filter(queue => queue.isActive);
      } else if (selectedStatus === 'inactive') {
        filtered = filtered.filter(queue => !queue.isActive);
      }
    }

    setFilteredQueues(filtered);
  }, [allQueues, searchTerm, selectedBusiness, selectedStatus]);

  const categorizeUsers = (users: User[]): CategorizedUsers => {
    const categories: CategorizedUsers = {
      customers: {
        id: 'customers',
        name: 'Customers',
        description: 'Regular users who join queues',
        icon: '👥',
        color: 'blue',
        count: 0,
        users: []
      },
      businessUsers: {
        id: 'business-users',
        name: 'Business Users',
        description: 'Staff and business administrators',
        icon: '🏢',
        color: 'green',
        count: 0,
        users: []
      },
      platformAdmins: {
        id: 'platform-admins',
        name: 'Platform Admins',
        description: 'Super administrators',
        icon: '👑',
        color: 'purple',
        count: 0,
        users: []
      },
      suspended: {
        id: 'suspended',
        name: 'Suspended Users',
        description: 'Users with restricted access',
        icon: '⚠️',
        color: 'orange',
        count: 0,
        users: []
      },
      inactive: {
        id: 'inactive',
        name: 'Inactive Users',
        description: 'Users who haven\'t logged in recently',
        icon: '😴',
        color: 'gray',
        count: 0,
        users: []
      }
    };

    // Categorize users
    users.forEach(user => {
      switch (user.role) {
        case 'user':
          categories.customers.users.push(user);
          categories.customers.count++;
          break;
        case 'staff':
        case 'business_admin':
          categories.businessUsers.users.push(user);
          categories.businessUsers.count++;
          break;
        case 'super_admin':
          categories.platformAdmins.users.push(user);
          categories.platformAdmins.count++;
          break;
        case 'suspended':
          categories.suspended.users.push(user);
          categories.suspended.count++;
          break;
        default:
          categories.inactive.users.push(user);
          categories.inactive.count++;
      }
    });

    return categories;
  };

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
    try {
      // Call server-side logout API
      await fetch('/api/auth/super-admin/logout', {
        method: 'POST',
      });
      
      // Also try to sign out from Supabase if there's a session
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.log('Supabase signout failed, but continuing with super admin signout');
      }
      
      // Redirect to login
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if logout fails
      window.location.href = '/login';
    }
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

  const handleQueueToggle = async (queueId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/super-admin/queues/${queueId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });

      if (response.ok) {
        alert(`Queue ${isActive ? 'activated' : 'deactivated'} successfully`);
        // Update the local state
        setAllQueues(prevQueues => 
          prevQueues.map(queue => 
            queue.id === queueId ? { ...queue, isActive } : queue
          )
        );
      } else {
        const errorData = await response.json();
        alert(`Failed to ${isActive ? 'activate' : 'deactivate'} queue: ${errorData.error}`);
      }
    } catch (err: any) {
      alert(`Failed to ${isActive ? 'activate' : 'deactivate'} queue: ${err.message}`);
    }
  };

  const handleEditQueue = (queue: any) => {
    setEditingQueue(queue);
    setIsEditModalOpen(true);
  };

  const handleSaveQueue = async () => {
    try {
      const response = await fetch(`/api/super-admin/queues/${editingQueue.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingQueue.name,
          description: editingQueue.description,
          serviceType: editingQueue.serviceType,
          maxSize: editingQueue.maxSize,
          estimatedWaitTime: editingQueue.estimatedWaitTime,
          isActive: editingQueue.isActive,
          businessId: editingQueue.business?.id
        })
      });

      if (response.ok) {
        alert('Queue updated successfully');
        setIsEditModalOpen(false);
        // Refresh the queue list
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert(`Failed to update queue: ${errorData.error}`);
      }
    } catch (err: any) {
      alert(`Failed to update queue: ${err.message}`);
    }
  };

  const handleDeleteQueue = async (queueId: string) => {
    if (confirm('Are you sure you want to delete this queue? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/super-admin/queues/${queueId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          alert('Queue deleted successfully');
          // Remove from local state
          setAllQueues(prevQueues => prevQueues.filter(q => q.id !== queueId));
        } else {
          const errorData = await response.json();
          alert(`Failed to delete queue: ${errorData.error}`);
        }
      } catch (err: any) {
        alert(`Failed to delete queue: ${err.message}`);
      }
    }
  };

  const getUserInitials = (email: string) => {
    return email?.split('@')[0]?.slice(0, 2).toUpperCase() || 'SA';
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin': return 'destructive';
      case 'business_admin': return 'default';
      case 'staff': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading super admin dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Access Denied</p>
                  <p className="text-sm">{error}</p>
                  <Button asChild className="mt-4">
                    <Link href="/login">Back to Login</Link>
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold">Super Admin</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <nav className="hidden md:flex items-center space-x-6">
                <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                  <Home className="h-4 w-4 mr-2 inline" />
                  Home
                </Link>
                <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                  <UserCheck className="h-4 w-4 mr-2 inline" />
                  User Dashboard
                </Link>
              </nav>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt={user?.email} />
                      <AvatarFallback>{getUserInitials(user?.email)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.email}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        <Badge variant={getRoleBadgeVariant(user?.role)} className="text-xs">
                          Super Admin
                        </Badge>
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                      <UserCheck className="mr-2 h-4 w-4" />
                      <span>User Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">System Administration</h2>
            <p className="text-muted-foreground">
              Manage users, businesses, and monitor system performance.
            </p>
          </div>

          {/* System Stats */}
          {stats && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    Registered users in the system
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Businesses</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalBusinesses}</div>
                  <p className="text-xs text-muted-foreground">
                    Registered businesses
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Queues</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalQueues}</div>
                  <p className="text-xs text-muted-foreground">
                    All queues created
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Queues</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeQueues}</div>
                  <p className="text-xs text-muted-foreground">
                    Currently active queues
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Enhanced Queue Analytics Section */}
          {stats && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Wait Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.queueAnalytics?.averageWaitTime || 0} min</div>
                  <p className="text-xs text-muted-foreground">
                    System-wide average
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Peak Hour</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.queueAnalytics?.peakHour || 0}:00</div>
                  <p className="text-xs text-muted-foreground">
                    Busiest time of day
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Customers Today</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.customerFlow?.totalCustomersToday || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Total entries today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Queue Efficiency</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.queueAnalytics?.queueEfficiency || 0}%</div>
                  <p className="text-xs text-muted-foreground">
                    System efficiency
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Customer Flow Analytics */}
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Customer Flow Analytics
                </CardTitle>
                <CardDescription>
                  Real-time customer movement and patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {stats.customerFlow?.totalCustomersToday || 0}
                    </div>
                    <div className="text-sm text-gray-600">Total Customers Today</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {stats.customerFlow?.customersServedToday || 0}
                    </div>
                    <div className="text-sm text-gray-600">Customers Served</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {stats.customerFlow?.averageServiceTime || 0} min
                    </div>
                    <div className="text-sm text-gray-600">Avg Service Time</div>
                  </div>
                </div>
                
                {/* Peak Hours Chart */}
                {stats.customerFlow?.dailyFlow && (
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold mb-4">Peak Hours Today</h4>
                    <div className="flex items-end space-x-2 h-32">
                      {stats.customerFlow.dailyFlow.map((hour, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div 
                            className="bg-blue-500 rounded-t w-full mb-2"
                            style={{ 
                              height: `${Math.max(10, (hour.entries / Math.max(...stats.customerFlow.dailyFlow.map(h => h.entries), 1)) * 100)}px` 
                            }}
                          ></div>
                          <span className="text-xs text-gray-600">{hour.hour}:00</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Wait Time Analytics */}
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Wait Time Analytics
                </CardTitle>
                <CardDescription>
                  Queue performance and wait time insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {stats.waitTimeAnalytics?.averageWaitTime || 0} min
                    </div>
                    <div className="text-sm text-gray-600">Average Wait Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">
                      {stats.waitTimeAnalytics?.longestWaitTime || 0} min
                    </div>
                    <div className="text-sm text-gray-600">Longest Wait</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {stats.waitTimeAnalytics?.shortestWaitTime || 0} min
                    </div>
                    <div className="text-sm text-gray-600">Shortest Wait</div>
                  </div>
                </div>
                
                {/* Queue Bottlenecks */}
                {stats.waitTimeAnalytics?.queueBottlenecks && stats.waitTimeAnalytics.queueBottlenecks.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold mb-4">Queue Bottlenecks</h4>
                    <div className="space-y-3">
                      {stats.waitTimeAnalytics.queueBottlenecks.slice(0, 5).map((bottleneck, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium">{bottleneck.queueName}</div>
                            <div className="text-sm text-gray-600">{bottleneck.currentWaiting} waiting</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-red-600">{bottleneck.averageWaitTime} min</div>
                            <div className="text-sm text-gray-600">avg wait</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Business Comparison */}
          {stats && stats.businessComparison && stats.businessComparison.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Business Performance Comparison
                </CardTitle>
                <CardDescription>
                  Queue performance across all businesses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.businessComparison.slice(0, 10).map((business, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{business.businessName}</div>
                          <div className="text-sm text-gray-600">
                            {business.activeQueues}/{business.totalQueues} active queues
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-600">{business.efficiency}%</div>
                        <div className="text-sm text-gray-600">efficiency</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">{business.averageWaitTime || 0} min</div>
                        <div className="text-sm text-gray-600">avg wait</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Management Tabs */}
          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="businesses">Business Management</TabsTrigger>
              <TabsTrigger value="queues">Queue Management</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    User Management
                  </CardTitle>
                  <CardDescription>
                    Manage user accounts by category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Category Overview Cards */}
                  {categorizedUsers && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                      {Object.values(categorizedUsers).map((category) => (
                        <Card key={category.id} className="cursor-pointer hover:shadow-md transition-shadow">
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl mb-2">{category.icon}</div>
                            <div className={`text-2xl font-bold text-${category.color}-600`}>
                              {category.count}
                            </div>
                            <div className="text-sm text-gray-600">{category.name}</div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Category Tabs */}
                  {categorizedUsers && (
                    <Tabs defaultValue="customers" className="space-y-4">
                      <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="customers" className="flex items-center gap-2">
                          👥 Customers ({categorizedUsers.customers.count})
                        </TabsTrigger>
                        <TabsTrigger value="business-users" className="flex items-center gap-2">
                          🏢 Business ({categorizedUsers.businessUsers.count})
                        </TabsTrigger>
                        <TabsTrigger value="platform-admins" className="flex items-center gap-2">
                          👑 Admins ({categorizedUsers.platformAdmins.count})
                        </TabsTrigger>
                        <TabsTrigger value="suspended" className="flex items-center gap-2">
                          ⚠️ Suspended ({categorizedUsers.suspended.count})
                        </TabsTrigger>
                        <TabsTrigger value="inactive" className="flex items-center gap-2">
                          😴 Inactive ({categorizedUsers.inactive.count})
                        </TabsTrigger>
                      </TabsList>

                      {/* Customer Users Tab */}
                      <TabsContent value="customers" className="space-y-4">
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                          {categorizedUsers.customers.users.map((user) => (
                            <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex items-center space-x-4">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback>{user.name?.slice(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{user.name}</p>
                                  <p className="text-sm text-muted-foreground">{user.email}</p>
                                  <div className="flex gap-2 mt-1">
                                    <Badge variant="secondary" className="text-xs">
                                      Customer
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      Queue User
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUserAction(user.id, 'suspend')}
                                  className="text-orange-600 hover:text-orange-800"
                                >
                                  Suspend
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUserAction(user.id, 'delete')}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>

                      {/* Business Users Tab */}
                      <TabsContent value="business-users" className="space-y-4">
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                          {categorizedUsers.businessUsers.users.map((user) => (
                            <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex items-center space-x-4">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback>{user.name?.slice(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{user.name}</p>
                                  <p className="text-sm text-muted-foreground">{user.email}</p>
                                  <div className="flex gap-2 mt-1">
                                    <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                                      {user.role.replace('_', ' ')}
                                    </Badge>
                                    {user.businessId && (
                                      <Badge variant="outline" className="text-xs">
                                        Business User
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUserAction(user.id, 'suspend')}
                                  className="text-orange-600 hover:text-orange-800"
                                >
                                  Suspend
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUserAction(user.id, 'delete')}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>

                      {/* Platform Admins Tab */}
                      <TabsContent value="platform-admins" className="space-y-4">
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                          {categorizedUsers.platformAdmins.users.map((user) => (
                            <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex items-center space-x-4">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback>{user.name?.slice(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{user.name}</p>
                                  <p className="text-sm text-muted-foreground">{user.email}</p>
                                  <div className="flex gap-2 mt-1">
                                    <Badge variant="destructive" className="text-xs">
                                      Super Admin
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      Platform Owner
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Badge variant="outline" className="text-xs">
                                  Protected
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>

                      {/* Suspended Users Tab */}
                      <TabsContent value="suspended" className="space-y-4">
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                          {categorizedUsers.suspended.users.map((user) => (
                            <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg bg-orange-50">
                              <div className="flex items-center space-x-4">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback>{user.name?.slice(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{user.name}</p>
                                  <p className="text-sm text-muted-foreground">{user.email}</p>
                                  <div className="flex gap-2 mt-1">
                                    <Badge variant="destructive" className="text-xs">
                                      Suspended
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUserAction(user.id, 'activate')}
                                  className="text-green-600 hover:text-green-800"
                                >
                                  Activate
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUserAction(user.id, 'delete')}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>

                      {/* Inactive Users Tab */}
                      <TabsContent value="inactive" className="space-y-4">
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                          {categorizedUsers.inactive.users.map((user) => (
                            <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                              <div className="flex items-center space-x-4">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback>{user.name?.slice(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{user.name}</p>
                                  <p className="text-sm text-muted-foreground">{user.email}</p>
                                  <div className="flex gap-2 mt-1">
                                    <Badge variant="secondary" className="text-xs">
                                      Inactive
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUserAction(user.id, 'suspend')}
                                  className="text-orange-600 hover:text-orange-800"
                                >
                                  Suspend
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUserAction(user.id, 'delete')}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    </Tabs>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="businesses" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Business Management
                  </CardTitle>
                  <CardDescription>
                    Manage business accounts and their status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {businesses.map((business) => (
                      <div key={business.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>{business.name?.slice(0, 2).toUpperCase() || 'B'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{business.name}</p>
                            {business.businessType && (
                              <p className="text-sm text-muted-foreground">{business.businessType}</p>
                            )}
                            <div className="flex gap-2 mt-1">
                              <Badge variant={business.isActive ? "default" : "secondary"} className="text-xs">
                                {business.isActive ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Active
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Inactive
                                  </>
                                )}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBusinessAction(business.id, business.isActive ? 'deactivate' : 'activate')}
                            className={business.isActive ? "text-orange-600 hover:text-orange-800" : "text-green-600 hover:text-green-800"}
                          >
                            {business.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBusinessAction(business.id, 'delete')}
                            className="text-red-600 hover:text-red-800"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="queues" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Queue Management
                  </CardTitle>
                  <CardDescription>
                    Manage all queues across the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">
                        All Platform Queues ({filteredQueues.length} of {allQueues.length})
                      </h3>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => window.open('/queues/create', '_blank')}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create Queue
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => window.location.reload()}
                        >
                          <Activity className="h-4 w-4 mr-2" />
                          Refresh
                        </Button>
                      </div>
                    </div>
                    
                    {/* Queue Statistics Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{filteredQueues.length}</div>
                        <div className="text-sm text-gray-600">Filtered Queues</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {filteredQueues.filter(q => q.isActive).length}
                        </div>
                        <div className="text-sm text-gray-600">Active Queues</div>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">
                          {filteredQueues.reduce((sum, q) => sum + (q.statistics?.waitingEntries || 0), 0)}
                        </div>
                        <div className="text-sm text-gray-600">Waiting Customers</div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {filteredQueues.reduce((sum, q) => sum + (q.statistics?.totalEntries || 0), 0)}
                        </div>
                        <div className="text-sm text-gray-600">Total Entries</div>
                      </div>
                    </div>
                    
                    {/* Search and Filter */}
                    <div className="flex gap-4 mb-4">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Search queues by name, business, or service type..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <select 
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedBusiness}
                        onChange={(e) => setSelectedBusiness(e.target.value)}
                      >
                        <option value="">All Businesses</option>
                        {businesses.map((business) => (
                          <option key={business.id} value={business.id}>
                            {business.name}
                          </option>
                        ))}
                      </select>
                      <select 
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                      >
                        <option value="">All Status</option>
                        <option value="active">Active Only</option>
                        <option value="inactive">Inactive Only</option>
                      </select>
                    </div>

                    {/* Individual Queue List - All Queues from All Businesses */}
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {filteredQueues.map((queue) => (
                        <div key={queue.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${queue.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-semibold text-lg">{queue.name}</h4>
                                  <Badge variant={queue.isActive ? "default" : "secondary"} className="text-xs">
                                    {queue.isActive ? 'Active' : 'Inactive'}
                                  </Badge>
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                  <div className="flex items-center space-x-1">
                                    <Building2 className="h-4 w-4 text-blue-600" />
                                    <span className="font-medium">{queue.business?.name}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <span>•</span>
                                    <span>{queue.serviceType || 'General Service'}</span>
                                  </div>
                                  {queue.business?.businessType && (
                                    <div className="flex items-center space-x-1">
                                      <span>•</span>
                                      <span>{queue.business.businessType}</span>
                                    </div>
                                  )}
                                </div>
                                {queue.description && (
                                  <p className="text-sm text-gray-500 mt-2">{queue.description}</p>
                                )}
                              </div>
                            </div>
                            
                            {/* Queue Statistics */}
                            <div className="flex items-center space-x-6">
                              <div className="text-center">
                                <div className="text-lg font-bold text-yellow-600">{queue.statistics?.waitingEntries || 0}</div>
                                <div className="text-xs text-gray-600">Waiting</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-blue-600">{queue.statistics?.servingEntries || 0}</div>
                                <div className="text-xs text-gray-600">Serving</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-green-600">{queue.statistics?.servedEntries || 0}</div>
                                <div className="text-xs text-gray-600">Served</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-purple-600">{queue.statistics?.totalEntries || 0}</div>
                                <div className="text-xs text-gray-600">Total</div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Queue Details and Actions */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-6 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>Est. {queue.estimatedWaitTime || 0} min wait</span>
                              </div>
                              {queue.maxSize && (
                                <div className="flex items-center space-x-1">
                                  <Users className="h-4 w-4" />
                                  <span>Max {queue.maxSize} customers</span>
                                </div>
                              )}
                              <div className="flex items-center space-x-1">
                                <Activity className="h-4 w-4" />
                                <span>Created {new Date(queue.createdAt).toLocaleDateString()}</span>
                              </div>
                              {queue.statistics?.lastActivity && (
                                <div className="flex items-center space-x-1">
                                  <span>Last activity: {new Date(queue.statistics.lastActivity).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditQueue(queue)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteQueue(queue.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(`/business-admin/queues/${queue.id}`, '_blank')}
                                className="text-green-600 hover:text-green-800"
                              >
                                <Settings className="h-4 w-4 mr-2" />
                                Manage
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(`/queues/${queue.id}`, '_blank')}
                                className="text-purple-600 hover:text-purple-800"
                              >
                                <Users className="h-4 w-4 mr-2" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleQueueToggle(queue.id, !queue.isActive)}
                                className={queue.isActive ? "text-orange-600 hover:text-orange-800" : "text-green-600 hover:text-green-800"}
                              >
                                {queue.isActive ? 'Deactivate' : 'Activate'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {filteredQueues.length === 0 && allQueues.length > 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>No queues match your current filters</p>
                          <p className="text-sm">Try adjusting your search or filter criteria</p>
                        </div>
                      )}
                      
                      {allQueues.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                          <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                          <h3 className="text-lg font-semibold mb-2">No Queues Found</h3>
                          <p>No queues have been created in the system yet.</p>
                          <p className="text-sm mt-1">Create your first queue to get started</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Queue Edit Modal */}
          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Queue: {editingQueue?.name}</DialogTitle>
                <DialogDescription>
                  Update queue settings and configuration. Changes will be applied immediately.
                </DialogDescription>
              </DialogHeader>
              
              {editingQueue && (
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="queue-name">Queue Name *</Label>
                      <Input
                        id="queue-name"
                        value={editingQueue.name || ''}
                        onChange={(e) => setEditingQueue({...editingQueue, name: e.target.value})}
                        placeholder="Enter queue name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="service-type">Service Type</Label>
                      <Input
                        id="service-type"
                        value={editingQueue.serviceType || ''}
                        onChange={(e) => setEditingQueue({...editingQueue, serviceType: e.target.value})}
                        placeholder="e.g., Customer Service, Technical Support"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={editingQueue.description || ''}
                      onChange={(e) => setEditingQueue({...editingQueue, description: e.target.value})}
                      placeholder="Describe what this queue is for..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="max-size">Max Size</Label>
                      <Input
                        id="max-size"
                        type="number"
                        min="1"
                        value={editingQueue.maxSize || ''}
                        onChange={(e) => setEditingQueue({...editingQueue, maxSize: e.target.value ? parseInt(e.target.value) : null})}
                        placeholder="No limit"
                      />
                    </div>
                    <div>
                      <Label htmlFor="wait-time">Est. Wait Time (min)</Label>
                      <Input
                        id="wait-time"
                        type="number"
                        min="0"
                        value={editingQueue.estimatedWaitTime || ''}
                        onChange={(e) => setEditingQueue({...editingQueue, estimatedWaitTime: e.target.value ? parseInt(e.target.value) : null})}
                        placeholder="0"
                      />
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <Checkbox
                        id="is-active"
                        checked={editingQueue.isActive || false}
                        onCheckedChange={(checked) => setEditingQueue({...editingQueue, isActive: checked})}
                      />
                      <Label htmlFor="is-active">Queue is Active</Label>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="business">Business Assignment</Label>
                    <Select
                      value={editingQueue.business?.id || ''}
                      onValueChange={(value) => {
                        const business = businesses.find(b => b.id === value);
                        setEditingQueue({...editingQueue, business: business});
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select business" />
                      </SelectTrigger>
                      <SelectContent>
                        {businesses.map((business) => (
                          <SelectItem key={business.id} value={business.id}>
                            <div className="flex items-center space-x-2">
                              <Building2 className="h-4 w-4" />
                              <span>{business.name}</span>
                              <Badge variant={business.isActive ? "default" : "secondary"} className="text-xs">
                                {business.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Current Queue Statistics */}
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold mb-3">Current Queue Statistics</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="text-lg font-bold text-yellow-600">{editingQueue.statistics?.waitingEntries || 0}</div>
                        <div className="text-xs text-gray-600">Waiting</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">{editingQueue.statistics?.servingEntries || 0}</div>
                        <div className="text-xs text-gray-600">Serving</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-bold text-green-600">{editingQueue.statistics?.servedEntries || 0}</div>
                        <div className="text-xs text-gray-600">Served</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-lg font-bold text-purple-600">{editingQueue.statistics?.totalEntries || 0}</div>
                        <div className="text-xs text-gray-600">Total</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveQueue} className="bg-blue-600 hover:bg-blue-700">
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* System Actions */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  System Analytics
                </CardTitle>
                <CardDescription>View comprehensive system analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/super-admin/analytics">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    View Analytics
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Logs
                </CardTitle>
                <CardDescription>View system activity and error logs</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/super-admin/system-logs">
                    <Activity className="mr-2 h-4 w-4" />
                    View Logs
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  System Settings
                </CardTitle>
                <CardDescription>Configure system-wide settings</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/super-admin/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Configure
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
