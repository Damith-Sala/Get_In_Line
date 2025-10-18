'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Users, 
  List,
  Home,
  Plus,
  Eye,
  LogOut
} from 'lucide-react';

interface Queue {
  id: string;
  name: string;
  description: string | null;
  creator_id: string | null;
  max_size: number | null;
  created_at: string;
  updated_at: string;
}

interface QueueEntry {
  id: string;
  queue_id: string;
  user_id: string;
  position: number;
  status: string;
  entered_at: string;
  updated_at: string;
  served_at: string | null;
}

export default function MyQueuesPage() {
  const [user, setUser] = useState<any>(null);
  const [myEntries, setMyEntries] = useState<QueueEntry[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leavingQueue, setLeavingQueue] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('Please log in to view your queues');
          setLoading(false);
          return;
        }
        setUser(user);

        // Fetch all queues
        const { data: queuesData, error: queuesError } = await supabase
          .from('queues')
          .select('*');

        if (queuesError) throw queuesError;

        // Fetch user's queue entries
        const { data: entriesData, error: entriesError } = await supabase
          .from('queue_entries')
          .select('*')
          .eq('user_id', user.id);

        if (entriesError) throw entriesError;

        setQueues(queuesData || []);
        setMyEntries(entriesData || []);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const leaveQueue = async (queueId: string) => {
    if (!user) {
      setError('Please log in to leave a queue');
      return;
    }

    try {
      setLeavingQueue(queueId);
      setError(null);

      const response = await fetch(`/api/queues/${queueId}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to leave queue');
      }

      // Refresh the data
      window.location.reload();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLeavingQueue(null);
    }
  };

  const getQueueName = (queueId: string) => {
    const queue = queues.find(q => q.id === queueId);
    return queue ? queue.name : 'Unknown Queue';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Clock className="w-3 h-3 mr-1" />Waiting</Badge>;
      case 'serving':
        return <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-100"><Users className="w-3 h-3 mr-1" />Serving</Badge>;
      case 'served':
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" />Served</Badge>;
      case 'missed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Missed</Badge>;
      case 'cancelled':
        return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex space-x-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>My Queues</CardTitle>
              <CardDescription>View and manage your queue entries</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please log in to view your queues.
                </AlertDescription>
              </Alert>
              <Button asChild className="mt-4">
                <Link href="/login">
                  <LogOut className="h-4 w-4 mr-2" />
                  Go to Login
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">My Queues</h1>
            <p className="text-muted-foreground">
              View and manage your queue entries
            </p>
          </div>
          <div className="flex space-x-2">
            <Button asChild>
              <Link href="/queues">
                <Plus className="h-4 w-4 mr-2" />
                Browse All Queues
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Empty State */}
        {myEntries.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <List className="h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Active Queues</h2>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                You haven't joined any queues yet. Browse available queues to get started.
              </p>
              <Button asChild>
                <Link href="/queues">
                  <Plus className="h-4 w-4 mr-2" />
                  Browse Available Queues
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Queue Entries */}
            <div className="space-y-4">
              {myEntries.map((entry) => (
                <Card key={entry.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">{getQueueName(entry.queue_id)}</CardTitle>
                        <CardDescription>
                          Queue ID: {entry.queue_id.slice(0, 8)}...
                        </CardDescription>
                      </div>
                      {getStatusBadge(entry.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Queue Details Table */}
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Position</TableCell>
                          <TableCell>#{entry.position}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Joined</TableCell>
                          <TableCell>{new Date(entry.entered_at).toLocaleString()}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Last Updated</TableCell>
                          <TableCell>{new Date(entry.updated_at).toLocaleString()}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>

                    {/* Status-specific content */}
                    {entry.status === 'served' && entry.served_at && (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          Served at: {new Date(entry.served_at).toLocaleString()}
                        </AlertDescription>
                      </Alert>
                    )}

                    {entry.status === 'serving' && (
                      <Alert>
                        <Users className="h-4 w-4" />
                        <AlertDescription>
                          You're currently being served! Please wait for staff assistance.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Action Buttons */}
                    {entry.status === 'waiting' && (
                      <div className="flex space-x-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => leaveQueue(entry.queue_id)}
                          disabled={leavingQueue === entry.queue_id}
                        >
                          {leavingQueue === entry.queue_id ? (
                            <>
                              <Clock className="h-4 w-4 mr-2 animate-spin" />
                              Leaving...
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 mr-2" />
                              Leave Queue
                            </>
                          )}
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href="/queues">
                            <Eye className="h-4 w-4 mr-2" />
                            View Queue
                          </Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle>Queue Summary</CardTitle>
                <CardDescription>Overview of your queue activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{myEntries.length}</div>
                    <div className="text-sm text-muted-foreground">Total Entries</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {myEntries.filter(e => e.status === 'waiting').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Waiting</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {myEntries.filter(e => e.status === 'serving').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Being Served</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {myEntries.filter(e => e.status === 'served').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}