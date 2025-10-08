'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

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

export default function TestDatabase() {
  const [users, setUsers] = useState<User[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('Testing...');

  const supabase = createClient();

  useEffect(() => {
    async function testDatabaseConnection() {
      try {
        setLoading(true);
        setError(null);

        // Test Supabase connection
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          throw sessionError;
        }
        setConnectionStatus('✅ Connected to Supabase successfully!');

        // Fetch data from all tables
        const [usersResult, queuesResult, entriesResult] = await Promise.all([
          supabase.from('users').select('*'),
          supabase.from('queues').select('*'),
          supabase.from('queue_entries').select('*')
        ]);

        // Check for errors
        if (usersResult.error) throw usersResult.error;
        if (queuesResult.error) throw queuesResult.error;
        if (entriesResult.error) throw entriesResult.error;

        // Set the data
        setUsers(usersResult.data || []);
        setQueues(queuesResult.data || []);
        setQueueEntries(entriesResult.data || []);

      } catch (err: any) {
        setError(err.message);
        setConnectionStatus('❌ Connection failed');
      } finally {
        setLoading(false);
      }
    }

    testDatabaseConnection();
  }, []);

  const addTestData = async () => {
    try {
      setLoading(true);
      
      // Add a test user
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          email: `test-${Date.now()}@example.com`,
          name: 'Test User',
          password: 'hashed_password_here' // In real app, this would be hashed
        })
        .select()
        .single();

      if (userError) throw userError;

      // Add a test queue
      const { data: queueData, error: queueError } = await supabase
        .from('queues')
        .insert({
          name: `Test Queue ${Date.now()}`,
          description: 'This is a test queue',
          creator_id: userData.id,
          max_size: 10
        })
        .select()
        .single();

      if (queueError) throw queueError;

      // Add a test queue entry
      const { data: entryData, error: entryError } = await supabase
        .from('queue_entries')
        .insert({
          queue_id: queueData.id,
          user_id: userData.id,
          position: 1,
          status: 'waiting'
        })
        .select()
        .single();

      if (entryError) throw entryError;

      // Refresh data
      window.location.reload();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Database Test</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Database Test - Supabase Tables</h1>
        
        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
          <p className={`text-lg ${connectionStatus.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
            {connectionStatus}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Add Test Data Button */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Data</h2>
          <button
            onClick={addTestData}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Add Test Data (User + Queue + Entry)
          </button>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Users Table ({users.length} records)</h2>
          {users.length === 0 ? (
            <p className="text-gray-500">No users found in the database.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">ID</th>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-t">
                      <td className="px-4 py-2 text-sm font-mono">{user.id.slice(0, 8)}...</td>
                      <td className="px-4 py-2">{user.email}</td>
                      <td className="px-4 py-2">{user.name}</td>
                      <td className="px-4 py-2 text-sm">{new Date(user.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Queues Table */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Queues Table ({queues.length} records)</h2>
          {queues.length === 0 ? (
            <p className="text-gray-500">No queues found in the database.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">ID</th>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Description</th>
                    <th className="px-4 py-2 text-left">Max Size</th>
                    <th className="px-4 py-2 text-left">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {queues.map((queue) => (
                    <tr key={queue.id} className="border-t">
                      <td className="px-4 py-2 text-sm font-mono">{queue.id.slice(0, 8)}...</td>
                      <td className="px-4 py-2 font-medium">{queue.name}</td>
                      <td className="px-4 py-2">{queue.description || 'No description'}</td>
                      <td className="px-4 py-2">{queue.max_size || 'Unlimited'}</td>
                      <td className="px-4 py-2 text-sm">{new Date(queue.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Queue Entries Table */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Queue Entries Table ({queueEntries.length} records)</h2>
          {queueEntries.length === 0 ? (
            <p className="text-gray-500">No queue entries found in the database.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">ID</th>
                    <th className="px-4 py-2 text-left">Queue ID</th>
                    <th className="px-4 py-2 text-left">User ID</th>
                    <th className="px-4 py-2 text-left">Position</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Entered</th>
                  </tr>
                </thead>
                <tbody>
                  {queueEntries.map((entry) => (
                    <tr key={entry.id} className="border-t">
                      <td className="px-4 py-2 text-sm font-mono">{entry.id.slice(0, 8)}...</td>
                      <td className="px-4 py-2 text-sm font-mono">{entry.queue_id.slice(0, 8)}...</td>
                      <td className="px-4 py-2 text-sm font-mono">{entry.user_id.slice(0, 8)}...</td>
                      <td className="px-4 py-2 text-center">{entry.position}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          entry.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                          entry.status === 'serving' ? 'bg-blue-100 text-blue-800' :
                          entry.status === 'served' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm">{new Date(entry.entered_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Database Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Users:</span> {users.length}
            </div>
            <div>
              <span className="font-medium">Queues:</span> {queues.length}
            </div>
            <div>
              <span className="font-medium">Queue Entries:</span> {queueEntries.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
