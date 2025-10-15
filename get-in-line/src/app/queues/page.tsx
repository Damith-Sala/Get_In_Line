'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import RealTimeQueue from '@/components/RealTimeQueue';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Users, Clock, CheckCircle, AlertCircle, Plus, Home } from 'lucide-react';

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

export default function QueuesPage() {
  const [queues, setQueues] = useState<Queue[]>([]);
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joiningQueue, setJoiningQueue] = useState<string | null>(null);
  const [leavingQueue, setLeavingQueue] = useState<string | null>(null);
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

        // Fetch all queues
        const { data: queuesData, error: queuesError } = await supabase
          .from('queues')
          .select('*')
          .order('created_at', { ascending: false });

        if (queuesError) throw queuesError;

        // Fetch all queue entries
        const { data: entriesData, error: entriesError } = await supabase
          .from('queue_entries')
          .select('*');

        if (entriesError) throw entriesError;

        setQueues(queuesData || []);
        setQueueEntries(entriesData || []);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const joinQueue = async (queueId: string) => {
    if (!user) {
      setError('Please log in to join a queue');
      return;
    }

    try {
      setJoiningQueue(queueId);
      setError(null);

      const response = await fetch(`/api/queues/${queueId}/join-simple`, {
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
        throw new Error(data.error || 'Failed to join queue');
      }

      // Refresh the data to show updated queue entries
      window.location.reload();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setJoiningQueue(null);
    }
  };

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

      // Refresh the data to show updated queue entries
      window.location.reload();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLeavingQueue(null);
    }
  };

  const getQueueStats = (queueId: string) => {
    const entries = queueEntries.filter(entry => entry.queue_id === queueId);
    const waitingCount = entries.filter(entry => entry.status === 'waiting').length;
    const servingCount = entries.filter(entry => entry.status === 'serving').length;
    const servedCount = entries.filter(entry => entry.status === 'served').length;
    
    return { total: entries.length, waiting: waitingCount, serving: servingCount, served: servedCount };
  };

  const isUserInQueue = (queueId: string) => {
    if (!user) return false;
    return queueEntries.some(entry => 
      entry.queue_id === queueId && 
      entry.user_id === user.id && 
      (entry.status === 'waiting' || entry.status === 'serving')
    );
  };

  const getUserPosition = (queueId: string) => {
    if (!user) return null;
    const userEntry = queueEntries.find(entry => 
      entry.queue_id === queueId && 
      entry.user_id === user.id && 
      entry.status === 'waiting'
    );
    return userEntry ? userEntry.position : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-8 w-48" />
            <div className="flex space-x-4">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Available Queues</h1>
          <div className="flex space-x-4">
            <Button asChild variant="secondary">
              <Link href="/my-queues">
                <Users className="w-4 h-4 mr-2" />
                My Queues
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard">
                Dashboard
              </Link>
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {queues.length === 0 ? (
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-xl">No Queues Available</CardTitle>
              <CardDescription>
                There are no queues available at the moment.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="lg">
                <Link href="/dashboard">
                  <Home className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {queues.map((queue) => {
              const stats = getQueueStats(queue.id);
              const userInQueue = isUserInQueue(queue.id);
              const userPosition = getUserPosition(queue.id);

              return (
                <Card key={queue.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-xl">{queue.name}</CardTitle>
                    {queue.description && (
                      <CardDescription>{queue.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total in line:</span>
                        <Badge variant="secondary">{stats.total}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Waiting:</span>
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                          <Clock className="w-3 h-3 mr-1" />
                          {stats.waiting}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Being served:</span>
                        <Badge variant="outline" className="text-blue-600 border-blue-600">
                          {stats.serving}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Completed:</span>
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {stats.served}
                        </Badge>
                      </div>
                      {queue.max_size && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Max capacity:</span>
                          <Badge variant="outline">{queue.max_size}</Badge>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {userInQueue ? (
                      <div className="space-y-3">
                        <Alert>
                          <CheckCircle className="h-4 w-4" />
                          <AlertDescription>
                            You're in this queue!
                            {userPosition && (
                              <span className="block mt-1 font-semibold">
                                Your position: #{userPosition}
                              </span>
                            )}
                          </AlertDescription>
                        </Alert>
                        <Button
                          onClick={() => leaveQueue(queue.id)}
                          disabled={leavingQueue === queue.id}
                          variant="destructive"
                          className="w-full"
                        >
                          {leavingQueue === queue.id ? 'Leaving...' : 'Leave Queue'}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {!user ? (
                          <Button asChild variant="outline" className="w-full">
                            <Link href="/login">
                              Login to Join
                            </Link>
                          </Button>
                        ) : (
                          <Button
                            onClick={() => joinQueue(queue.id)}
                            disabled={joiningQueue === queue.id || (queue.max_size ? stats.total >= queue.max_size : false)}
                            variant={queue.max_size && stats.total >= queue.max_size ? "destructive" : "default"}
                            className="w-full"
                          >
                            {joiningQueue === queue.id
                              ? 'Joining...'
                              : (queue.max_size && stats.total >= queue.max_size)
                              ? 'Queue Full'
                              : 'Join Queue'
                            }
                          </Button>
                        )}
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Created: {new Date(queue.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Real-time Queue Status for User's Queues */}
        {user && queueEntries.filter(e => e.user_id === user.id && e.status === 'waiting').length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-6">Your Live Queue Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {queueEntries
                .filter(e => e.user_id === user.id && e.status === 'waiting')
                .map((entry) => {
                  const queue = queues.find(q => q.id === entry.queue_id);
                  return queue ? (
                    <Card key={entry.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{queue.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <RealTimeQueue 
                          queueId={entry.queue_id} 
                          userId={user.id}
                          userPosition={entry.position}
                        />
                      </CardContent>
                    </Card>
                  ) : null;
                })}
            </div>
          </div>
        )}

        {/* Summary */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Queue Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{queues.length}</div>
                <div className="text-sm text-muted-foreground">Total Queues</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {queueEntries.filter(e => e.status === 'waiting').length}
                </div>
                <div className="text-sm text-muted-foreground">Waiting</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {queueEntries.filter(e => e.status === 'serving').length}
                </div>
                <div className="text-sm text-muted-foreground">Being Served</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {queueEntries.filter(e => e.status === 'served').length}
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
