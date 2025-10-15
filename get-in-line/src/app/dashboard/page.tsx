'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from "react";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Users, 
  Clock, 
  Plus, 
  BarChart3, 
  Settings, 
  LogOut, 
  Home, 
  List,
  UserCheck,
  TrendingUp,
  User
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUser() {
      try {
        setLoading(true);
        
        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.error('Auth error:', authError);
          router.push('/login');
          return;
        }
        
        setUser(user);
        
        // Get user role from database using new endpoint
        const response = await fetch('/api/users/me');
        if (response.ok) {
          const userData = await response.json();
          setUserRole(userData.role || 'user');
        } else {
          console.error('Failed to fetch user data');
          setUserRole('user'); // Default fallback
        }
      } catch (error) {
        console.error('Error loading user:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    getUser();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Sign out error:', error);
      // Force redirect even if sign out fails
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getUserInitials = (email: string) => {
    return email?.split('@')[0]?.slice(0, 2).toUpperCase() || 'U';
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'business_admin': return 'default';
      case 'staff': return 'secondary';
      case 'super_admin': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <List className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold">Get In Line</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <nav className="hidden md:flex items-center space-x-6">
                <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                  <Home className="h-4 w-4 mr-2 inline" />
                  Home
                </Link>
                <Link href="/queues" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                  <List className="h-4 w-4 mr-2 inline" />
                  View Queues
                </Link>
                <Link href="/my-queues" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                  <UserCheck className="h-4 w-4 mr-2 inline" />
                  My Queues
                </Link>
                {userRole === 'business_admin' && (
                  <Link href="/business-admin" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                    <BarChart3 className="h-4 w-4 mr-2 inline" />
                    Business Admin
                  </Link>
                )}
                {userRole === 'staff' && (
                  <Link href="/staff-dashboard" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                    <BarChart3 className="h-4 w-4 mr-2 inline" />
                    Staff Dashboard
                  </Link>
                )}
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
                        <Badge variant={getRoleBadgeVariant(userRole)} className="text-xs">
                          {userRole.replace('_', ' ')}
                        </Badge>
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/my-queues" className="cursor-pointer">
                      <UserCheck className="mr-2 h-4 w-4" />
                      <span>My Queues</span>
                    </Link>
                  </DropdownMenuItem>
                  {userRole === 'staff' && (
                    <DropdownMenuItem asChild>
                      <Link href="/staff-dashboard" className="cursor-pointer">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        <span>Staff Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {userRole === 'business_admin' && (
                    <DropdownMenuItem asChild>
                      <Link href="/business-admin" className="cursor-pointer">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        <span>Business Admin</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile Settings</span>
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
            <h2 className="text-3xl font-bold tracking-tight">Welcome back!</h2>
            <p className="text-muted-foreground">
              Here's what's happening with your queues today.
            </p>
          </div>

          {/* Dashboard Content - Only show customer view for regular users */}
          {userRole === 'user' ? (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* My Queue Entries */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">My Queue Entries</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">
                      You haven't joined any queues yet
                    </p>
                    <Button asChild className="mt-4 w-full">
                      <Link href="/queues">
                        <Plus className="mr-2 h-4 w-4" />
                        Browse Available Queues
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button asChild variant="outline" className="w-full justify-start">
                      <Link href="/queues">
                        <List className="mr-2 h-4 w-4" />
                        View All Queues
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start">
                      <Link href="/my-queues">
                        <UserCheck className="mr-2 h-4 w-4" />
                        My Queue Entries
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-6">
                      <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No recent activity</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Tabs defaultValue="business" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="customer">Customer View</TabsTrigger>
                <TabsTrigger value="business">Business View</TabsTrigger>
              </TabsList>

              <TabsContent value="customer" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {/* My Queue Entries */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">My Queue Entries</CardTitle>
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">
                        You haven't joined any queues yet
                      </p>
                      <Button asChild className="mt-4 w-full">
                        <Link href="/queues">
                          <Plus className="mr-2 h-4 w-4" />
                          Browse Available Queues
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button asChild variant="outline" className="w-full justify-start">
                        <Link href="/queues">
                          <List className="mr-2 h-4 w-4" />
                          View All Queues
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full justify-start">
                        <Link href="/my-queues">
                          <UserCheck className="mr-2 h-4 w-4" />
                          My Queue Entries
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Recent Activity */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-6">
                        <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No recent activity</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="business" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {/* Your Queues */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Your Queues</CardTitle>
                      <List className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">
                        No queues created yet
                      </p>
                      <Button asChild className="mt-4 w-full">
                        <Link href="/queues/create">
                          <Plus className="mr-2 h-4 w-4" />
                          Create New Queue
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Active Customers */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">
                        No active customers in queue
                      </p>
                    </CardContent>
                  </Card>

                  {/* Analytics */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Analytics</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-6">
                        <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No data available</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
    </div>
  );
}
