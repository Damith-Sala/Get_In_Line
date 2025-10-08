'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

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
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Available Queues</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Available Queues</h1>
          <div className="space-x-4">
            <Link 
              href="/my-queues" 
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              My Queues
            </Link>
            <Link 
              href="/dashboard" 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Dashboard
            </Link>
            <Link 
              href="/queues/create" 
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Create Queue
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {queues.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">No Queues Available</h2>
            <p className="text-gray-600 mb-6">There are no queues available at the moment.</p>
            <Link 
              href="/queues/create" 
              className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700"
            >
              Create the First Queue
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {queues.map((queue) => {
              const stats = getQueueStats(queue.id);
              const userInQueue = isUserInQueue(queue.id);
              const userPosition = getUserPosition(queue.id);

              return (
                <div key={queue.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{queue.name}</h3>
                    {queue.description && (
                      <p className="text-gray-600 mb-4">{queue.description}</p>
                    )}
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Total in line:</span>
                        <span className="font-medium">{stats.total}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Waiting:</span>
                        <span className="font-medium text-yellow-600">{stats.waiting}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Being served:</span>
                        <span className="font-medium text-blue-600">{stats.serving}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Completed:</span>
                        <span className="font-medium text-green-600">{stats.served}</span>
                      </div>
                      {queue.max_size && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Max capacity:</span>
                          <span className="font-medium">{queue.max_size}</span>
                        </div>
                      )}
                    </div>

                    {userInQueue ? (
                      <div className="space-y-3">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-green-800 text-sm">
                            ✅ You're in this queue!
                            {userPosition && (
                              <span className="block mt-1">
                                Your position: <strong>#{userPosition}</strong>
                              </span>
                            )}
                          </p>
                        </div>
                        <button
                          onClick={() => leaveQueue(queue.id)}
                          disabled={leavingQueue === queue.id}
                          className={`w-full px-4 py-2 rounded text-center block ${
                            leavingQueue === queue.id
                              ? 'bg-gray-400 text-white cursor-not-allowed'
                              : 'bg-red-600 text-white hover:bg-red-700'
                          }`}
                        >
                          {leavingQueue === queue.id ? 'Leaving...' : 'Leave Queue'}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {!user ? (
                          <Link 
                            href="/login" 
                            className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 text-center block"
                          >
                            Login to Join
                          </Link>
                        ) : (
                          <button
                            onClick={() => joinQueue(queue.id)}
                            disabled={joiningQueue === queue.id || (queue.max_size && stats.total >= queue.max_size)}
                            className={`w-full px-4 py-2 rounded text-center block ${
                              joiningQueue === queue.id
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : (queue.max_size && stats.total >= queue.max_size)
                                ? 'bg-red-400 text-white cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {joiningQueue === queue.id
                              ? 'Joining...'
                              : (queue.max_size && stats.total >= queue.max_size)
                              ? 'Queue Full'
                              : 'Join Queue'
                            }
                          </button>
                        )}
                      </div>
                    )}

                    <div className="text-xs text-gray-500 mt-4">
                      Created: {new Date(queue.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Queue Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{queues.length}</div>
              <div className="text-sm text-gray-600">Total Queues</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {queueEntries.filter(e => e.status === 'waiting').length}
              </div>
              <div className="text-sm text-gray-600">Waiting</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {queueEntries.filter(e => e.status === 'serving').length}
              </div>
              <div className="text-sm text-gray-600">Being Served</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {queueEntries.filter(e => e.status === 'served').length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
