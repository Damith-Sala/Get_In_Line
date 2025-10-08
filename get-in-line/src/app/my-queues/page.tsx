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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      case 'serving':
        return 'bg-blue-100 text-blue-800';
      case 'served':
        return 'bg-green-100 text-green-800';
      case 'missed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">My Queues</h1>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">My Queues</h1>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-yellow-800">Please log in to view your queues.</p>
            <Link href="/login" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Queues</h1>
          <div className="space-x-4">
            <Link 
              href="/queues" 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Browse All Queues
            </Link>
            <Link 
              href="/dashboard" 
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Dashboard
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {myEntries.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">No Active Queues</h2>
            <p className="text-gray-600 mb-6">You haven't joined any queues yet.</p>
            <Link 
              href="/queues" 
              className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
            >
              Browse Available Queues
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {myEntries.map((entry) => (
              <div key={entry.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold">{getQueueName(entry.queue_id)}</h3>
                      <p className="text-gray-600">Queue ID: {entry.queue_id.slice(0, 8)}...</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(entry.status)}`}>
                      {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <span className="text-sm text-gray-500">Position:</span>
                      <p className="font-semibold">#{entry.position}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Joined:</span>
                      <p className="font-semibold">{new Date(entry.entered_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Last Updated:</span>
                      <p className="font-semibold">{new Date(entry.updated_at).toLocaleString()}</p>
                    </div>
                  </div>

                  {entry.status === 'served' && entry.served_at && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                      <p className="text-green-800 text-sm">
                        ✅ Served at: {new Date(entry.served_at).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {entry.status === 'waiting' && (
                    <div className="flex space-x-4">
                      <button
                        onClick={() => leaveQueue(entry.queue_id)}
                        disabled={leavingQueue === entry.queue_id}
                        className={`px-4 py-2 rounded text-sm font-medium ${
                          leavingQueue === entry.queue_id
                            ? 'bg-gray-400 text-white cursor-not-allowed'
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        {leavingQueue === entry.queue_id ? 'Leaving...' : 'Leave Queue'}
                      </button>
                      <Link
                        href="/queues"
                        className="px-4 py-2 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
                      >
                        View Queue
                      </Link>
                    </div>
                  )}

                  {entry.status === 'serving' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-blue-800 text-sm">
                        🎯 You're currently being served! Please wait for staff assistance.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Queue Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{myEntries.length}</div>
              <div className="text-sm text-gray-600">Total Entries</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {myEntries.filter(e => e.status === 'waiting').length}
              </div>
              <div className="text-sm text-gray-600">Waiting</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {myEntries.filter(e => e.status === 'serving').length}
              </div>
              <div className="text-sm text-gray-600">Being Served</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {myEntries.filter(e => e.status === 'served').length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
