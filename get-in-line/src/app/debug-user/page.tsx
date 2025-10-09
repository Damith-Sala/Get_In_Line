'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

interface UserStatus {
  isAuthenticated: boolean;
  user: any;
  userRecord: any;
  canCreateQueues: boolean;
  issues: string[];
  recommendations: string[];
}

export default function DebugUserPage() {
  const [status, setStatus] = useState<UserStatus>({
    isAuthenticated: false,
    user: null,
    userRecord: null,
    canCreateQueues: false,
    issues: [],
    recommendations: []
  });
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function checkUserStatus() {
      try {
        setLoading(true);
        const issues: string[] = [];
        const recommendations: string[] = [];

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          issues.push('Not authenticated - please log in');
          recommendations.push('Go to /login and sign in with your account');
          setStatus({
            isAuthenticated: false,
            user: null,
            userRecord: null,
            canCreateQueues: false,
            issues,
            recommendations
          });
          return;
        }

        // Get user record from database
        const response = await fetch('/api/users');
        let userRecord = null;
        
        if (response.ok) {
          const users = await response.json();
          userRecord = users.find((u: any) => u.id === user.id);
        }

        if (!userRecord) {
          issues.push('User not found in database');
          recommendations.push('Contact support - your account may not be properly set up');
        } else {
          // Check role
          const role = userRecord.role;
          if (!['staff', 'admin', 'super_admin'].includes(role)) {
            issues.push(`Invalid role: ${role}. Need: staff, admin, or super_admin`);
            recommendations.push('Sign up as a business user or contact your business admin to get proper permissions');
          }

          // Check business association
          if (!userRecord.businessId) {
            issues.push('No business association found');
            recommendations.push('Create a business account or join an existing business');
          }

          // Determine if can create queues
          const canCreateQueues = ['staff', 'admin', 'super_admin'].includes(role) && userRecord.businessId;
          
          setStatus({
            isAuthenticated: true,
            user,
            userRecord,
            canCreateQueues,
            issues,
            recommendations
          });
        }

      } catch (error) {
        console.error('Error checking user status:', error);
        setStatus(prev => ({
          ...prev,
          issues: [...prev.issues, `Error: ${error}`],
          recommendations: [...prev.recommendations, 'Try refreshing the page or contact support']
        }));
      } finally {
        setLoading(false);
      }
    }

    checkUserStatus();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Checking your account status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">User Account Diagnostic</h1>
        
        {/* Status Overview */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Account Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="font-medium">Authentication:</span>
              <span className={`ml-2 px-2 py-1 rounded text-sm ${
                status.isAuthenticated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {status.isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}
              </span>
            </div>
            <div>
              <span className="font-medium">Can Create Queues:</span>
              <span className={`ml-2 px-2 py-1 rounded text-sm ${
                status.canCreateQueues ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {status.canCreateQueues ? '✅ Yes' : '❌ No'}
              </span>
            </div>
          </div>
        </div>

        {/* User Details */}
        {status.user && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">User Details</h2>
            <div className="space-y-2">
              <div><span className="font-medium">Email:</span> {status.user.email}</div>
              <div><span className="font-medium">User ID:</span> {status.user.id}</div>
              {status.userRecord && (
                <>
                  <div><span className="font-medium">Role:</span> {status.userRecord.role}</div>
                  <div><span className="font-medium">Business ID:</span> {status.userRecord.businessId || 'None'}</div>
                  <div><span className="font-medium">Name:</span> {status.userRecord.name || 'Not set'}</div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Issues */}
        {status.issues.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-red-800 mb-4">Issues Found</h2>
            <ul className="space-y-2">
              {status.issues.map((issue, index) => (
                <li key={index} className="text-red-700">• {issue}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {status.recommendations.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">What to Do Next</h2>
            <ul className="space-y-2">
              {status.recommendations.map((rec, index) => (
                <li key={index} className="text-blue-700">• {rec}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a 
              href="/login" 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-center"
            >
              Login
            </a>
            <a 
              href="/signup/business" 
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-center"
            >
              Create Business Account
            </a>
            <a 
              href="/business-admin" 
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-center"
            >
              Business Admin
            </a>
          </div>
        </div>

        {/* Raw Data (for debugging) */}
        <details className="mt-6">
          <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
            Show Raw Data (for debugging)
          </summary>
          <div className="bg-gray-100 p-4 rounded mt-2">
            <pre className="text-sm overflow-auto">
              {JSON.stringify(status, null, 2)}
            </pre>
          </div>
        </details>
      </div>
    </div>
  );
}
