'use client';

import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';

export default function TestJoinPage() {
  const [user, setUser] = useState<any>(null);
  const [queues, setQueues] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // Fetch queues
      const response = await fetch('/api/queues');
      const data = await response.json();
      setQueues(data);
    }
    loadData();
  }, []);

  const testJoinQueue = async (queueId: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/queues/${queueId}/join-simple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to join queue');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Test Join Queue</h1>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-yellow-800">Please log in to test join queue functionality.</p>
            <a href="/login" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
              Go to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Test Join Queue</h1>
        
        {/* User Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current User</h2>
          <div className="space-y-2">
            <p><strong>ID:</strong> {user.id}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Name:</strong> {user.user_metadata?.name || 'Not provided'}</p>
          </div>
        </div>

        {/* Available Queues */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Available Queues</h2>
          {queues.length === 0 ? (
            <p className="text-gray-500">No queues available. Create one first.</p>
          ) : (
            <div className="space-y-4">
              {queues.map((queue) => (
                <div key={queue.id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium">{queue.name}</h3>
                  <p className="text-sm text-gray-600">{queue.description}</p>
                  <p className="text-xs text-gray-500">ID: {queue.id}</p>
                  <button
                    onClick={() => testJoinQueue(queue.id)}
                    disabled={loading}
                    className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Testing...' : 'Test Join Queue'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-green-800">Success!</h2>
            <pre className="bg-white p-4 rounded border overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-red-800">Error</h2>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Instructions</h3>
          <ol className="text-blue-700 space-y-1 list-decimal list-inside">
            <li>Make sure you're logged in</li>
            <li>Create a queue first if none exist</li>
            <li>Click "Test Join Queue" on any queue</li>
            <li>Check the results to see what happened</li>
            <li>Check your database at <code>/test-db</code> to see the entry</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
