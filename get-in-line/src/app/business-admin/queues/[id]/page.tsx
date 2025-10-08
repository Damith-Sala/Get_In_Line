'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Queue {
  id: string;
  name: string;
  description: string | null;
  service_type: string | null;
  max_size: number | null;
  is_active: boolean;
  estimated_wait_time: number | null;
  business_id: string;
  branch_id: string | null;
}

interface QueueEntry {
  id: string;
  queue_id: string;
  user_id: string;
  position: number;
  status: string;
  is_walk_in: boolean;
  entered_at: string;
  updated_at: string;
  served_at: string | null;
  served_by: string | null;
  user: {
    name: string;
    email: string;
  };
}

export default function QueueManagementPage() {
  const params = useParams();
  const queueId = params.id as string;
  
  const [queue, setQueue] = useState<Queue | null>(null);
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
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
          setError('Please log in to access queue management');
          return;
        }

        // Get user's business
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('business_id')
          .eq('id', user.id)
          .single();

        if (userError || !userData?.business_id) {
          setError('No business associated with your account');
          return;
        }

        const businessId = userData.business_id;

        // Fetch queue details
        const { data: queueData, error: queueError } = await supabase
          .from('queues')
          .select('*')
          .eq('id', queueId)
          .eq('business_id', businessId)
          .single();

        if (queueError) throw queueError;
        setQueue(queueData);

        // Fetch queue entries with user details
        const { data: entriesData, error: entriesError } = await supabase
          .from('queue_entries')
          .select(`
            *,
            user:users(name, email)
          `)
          .eq('queue_id', queueId)
          .order('position');

        if (entriesError) throw entriesError;
        setEntries(entriesData || []);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [queueId]);

  const handleQueueAction = async (action: string, userId?: string) => {
    if (!queue) return;

    try {
      setActionLoading(action);
      setError(null);

      const response = await fetch(`/api/businesses/${queue.business_id}/queues/${queueId}/control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to perform action');
      }

      // Refresh the data
      window.location.reload();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      case 'serving': return 'bg-blue-100 text-blue-800';
      case 'served': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'missed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="text-gray-600">Loading queue management...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-600">{error}</p>
            <Link href="/business-admin" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Back to Business Admin
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!queue) {
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-yellow-800 mb-2">Queue Not Found</h2>
            <p className="text-yellow-600">The requested queue could not be found.</p>
            <Link href="/business-admin" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Back to Business Admin
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const waitingEntries = entries.filter(e => e.status === 'waiting');
  const servingEntries = entries.filter(e => e.status === 'serving');
  const servedEntries = entries.filter(e => e.status === 'served');

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{queue.name}</h1>
              {queue.service_type && (
                <p className="text-gray-600 mt-1">{queue.service_type}</p>
              )}
              {queue.description && (
                <p className="text-gray-500 mt-2">{queue.description}</p>
              )}
            </div>
            <div className="flex gap-4">
              <Link 
                href="/business-admin" 
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Back to Admin
              </Link>
            </div>
          </div>
        </header>

        {/* Queue Status and Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                queue.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {queue.is_active ? 'Active' : 'Inactive'}
              </span>
              {queue.max_size && (
                <span className="text-gray-600">
                  Capacity: {entries.length}/{queue.max_size}
                </span>
              )}
              {queue.estimated_wait_time && (
                <span className="text-gray-600">
                  Est. Wait: {queue.estimated_wait_time} min
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleQueueAction(queue.is_active ? 'close' : 'open')}
                disabled={actionLoading === 'close' || actionLoading === 'open'}
                className={`px-4 py-2 rounded text-sm font-medium ${
                  queue.is_active
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                } disabled:opacity-50`}
              >
                {actionLoading === 'close' || actionLoading === 'open' 
                  ? 'Updating...' 
                  : queue.is_active ? 'Close Queue' : 'Open Queue'
                }
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{waitingEntries.length}</div>
              <div className="text-sm text-yellow-800">Waiting</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{servingEntries.length}</div>
              <div className="text-sm text-blue-800">Being Served</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{servedEntries.length}</div>
              <div className="text-sm text-green-800">Completed</div>
            </div>
          </div>
        </div>

        {/* Queue Entries */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Queue Entries</h2>
              <button
                onClick={() => handleQueueAction('next')}
                disabled={actionLoading === 'next' || waitingEntries.length === 0}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading === 'next' ? 'Processing...' : 'Call Next'}
              </button>
            </div>
          </div>
          <div className="p-6">
            {entries.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No entries in this queue</p>
            ) : (
              <div className="space-y-3">
                {entries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-lg font-bold text-gray-600">#{entry.position}</div>
                      <div>
                        <div className="font-medium">{entry.user.name}</div>
                        <div className="text-sm text-gray-500">{entry.user.email}</div>
                        {entry.is_walk_in && (
                          <span className="inline-block mt-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                            Walk-in
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(entry.status)}`}>
                        {entry.status}
                      </span>
                      <div className="text-sm text-gray-500">
                        {new Date(entry.entered_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
