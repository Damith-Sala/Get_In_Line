'use client';

import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';

export default function DebugQueueCreationPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  const testQueueCreation = async () => {
    setLoading(true);
    setError('');
    setTestResult(null);

    try {
      const testData = {
        name: `Test Queue ${Date.now()}`,
        description: 'This is a test queue created for debugging',
        maxSize: 10
      };

      console.log('Testing queue creation with data:', testData);

      const response = await fetch('/api/queues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      const responseData = await response.json();
      
      console.log('Response status:', response.status);
      console.log('Response data:', responseData);

      setTestResult({
        status: response.status,
        ok: response.ok,
        data: responseData,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        setError(`Queue creation failed: ${responseData.error || 'Unknown error'}`);
      }

    } catch (err: any) {
      console.error('Queue creation test error:', err);
      setError(`Network error: ${err.message}`);
      setTestResult({
        error: err.message,
        type: 'network_error'
      });
    } finally {
      setLoading(false);
    }
  };

  const testUserPermissions = async () => {
    setLoading(true);
    setError('');
    setTestResult(null);

    try {
      // Test 1: Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setError('Authentication failed');
        setTestResult({ step: 'auth', error: authError?.message || 'No user' });
        return;
      }

      // Test 2: Check user record
      const usersResponse = await fetch('/api/users');
      const users = await usersResponse.json();
      const userRecord = users.find((u: any) => u.id === user.id);

      if (!userRecord) {
        setError('User record not found');
        setTestResult({ step: 'user_record', error: 'User not found in database' });
        return;
      }

      // Test 3: Check role and business
      const hasValidRole = ['staff', 'business_admin', 'super_admin'].includes(userRecord.role);
      const hasBusiness = !!userRecord.businessId;

      setTestResult({
        step: 'permissions_check',
        user: {
          id: user.id,
          email: user.email
        },
        userRecord: {
          role: userRecord.role,
          businessId: userRecord.businessId,
          name: userRecord.name
        },
        checks: {
          hasValidRole,
          hasBusiness,
          canCreateQueues: hasValidRole && hasBusiness
        }
      });

    } catch (err: any) {
      setError(`Permission check failed: ${err.message}`);
      setTestResult({ step: 'permissions_check', error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Queue Creation Debug Tool</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Test User Permissions</h2>
            <p className="text-gray-600 mb-4">
              Check if your account has the right permissions to create queues.
            </p>
            <button
              onClick={testUserPermissions}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Testing...' : 'Test Permissions'}
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Test Queue Creation</h2>
            <p className="text-gray-600 mb-4">
              Try to create a test queue and see what happens.
            </p>
            <button
              onClick={testQueueCreation}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? 'Creating...' : 'Create Test Queue'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {testResult && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Test Results</h3>
            <div className="bg-gray-100 p-4 rounded">
              <pre className="text-sm overflow-auto whitespace-pre-wrap">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          </div>
        )}

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">What to Look For</h3>
          <ul className="text-blue-700 space-y-1">
            <li>• <strong>Status 201:</strong> Queue created successfully</li>
            <li>• <strong>Status 401:</strong> Not authenticated</li>
            <li>• <strong>Status 403:</strong> Permission denied (role or business issue)</li>
            <li>• <strong>Status 400:</strong> Bad request (validation error)</li>
            <li>• <strong>Status 500:</strong> Server error</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
