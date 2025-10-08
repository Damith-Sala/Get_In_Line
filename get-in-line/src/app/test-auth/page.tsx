'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export default function TestAuthUsers() {
  const [authUsers, setAuthUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('Testing...');

  const supabase = createClient();

  useEffect(() => {
    async function testAuthUsers() {
      try {
        setLoading(true);
        setError(null);

        // Test Supabase connection
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          throw sessionError;
        }
        setConnectionStatus('✅ Connected to Supabase successfully!');

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) {
          throw userError;
        }

        if (user) {
          setAuthUsers([user]);
        } else {
          setAuthUsers([]);
        }

      } catch (err: any) {
        setError(err.message);
        setConnectionStatus('❌ Connection failed');
      } finally {
        setLoading(false);
      }
    }

    testAuthUsers();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Supabase Auth Users Test</h1>
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
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Supabase Auth Users Test</h1>
        
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

        {/* Current User */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Authenticated User</h2>
          {authUsers.length === 0 ? (
            <div>
              <p className="text-gray-500 mb-4">No user is currently signed in.</p>
              <div className="space-x-4">
                <a href="/signup" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Sign Up
                </a>
                <a href="/login" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                  Sign In
                </a>
              </div>
            </div>
          ) : (
            <div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-green-800 mb-2">✅ User Found!</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>ID:</strong> {authUsers[0].id}</p>
                  <p><strong>Email:</strong> {authUsers[0].email}</p>
                  <p><strong>Name:</strong> {authUsers[0].user_metadata?.name || 'Not provided'}</p>
                  <p><strong>Created:</strong> {new Date(authUsers[0].created_at).toLocaleString()}</p>
                  <p><strong>Email Confirmed:</strong> {authUsers[0].email_confirmed_at ? 'Yes' : 'No'}</p>
                </div>
              </div>
              <button
                onClick={signOut}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>

        {/* Explanation */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">📝 Explanation</h3>
          <div className="text-blue-700 space-y-2">
            <p>• <strong>Supabase Auth</strong> stores users in the built-in <code>auth.users</code> table</p>
            <p>• <strong>Your custom tables</strong> (users, queues, queue_entries) are separate</p>
            <p>• <strong>When you sign up</strong>, the user goes to <code>auth.users</code>, not your custom <code>users</code> table</p>
            <p>• <strong>To sync them</strong>, you'd need to create a trigger or API endpoint</p>
          </div>
        </div>
      </div>
    </div>
  );
}
