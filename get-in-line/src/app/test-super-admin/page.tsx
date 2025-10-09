'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function TestSuperAdmin() {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testSuperAdminLogin = async () => {
    try {
      addResult('Testing super admin login...');
      
      const response = await fetch('/api/auth/super-admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'superadmin@getinline.com',
          password: 'SuperAdmin123!'
        })
      });

      const data = await response.json();

      if (response.ok) {
        addResult('✅ Super admin login successful!');
        addResult(`User: ${data.user?.name || 'Unknown'}`);
        addResult(`Role: ${data.user?.role || 'Unknown'}`);
      } else {
        addResult(`❌ Super admin login failed: ${data.error}`);
      }
    } catch (error: any) {
      addResult(`❌ Super admin login error: ${error.message}`);
    }
  };

  const testSuperAdminStats = async () => {
    try {
      addResult('Testing super admin stats API...');
      
      const response = await fetch('/api/super-admin/stats');
      const data = await response.json();

      if (response.ok) {
        addResult('✅ Super admin stats API working!');
        addResult(`Total Users: ${data.totalUsers}`);
        addResult(`Total Businesses: ${data.totalBusinesses}`);
        addResult(`Total Queues: ${data.totalQueues}`);
        addResult(`Active Queues: ${data.activeQueues}`);
      } else {
        addResult(`❌ Super admin stats failed: ${data.error}`);
      }
    } catch (error: any) {
      addResult(`❌ Super admin stats error: ${error.message}`);
    }
  };

  const testUsersAPI = async () => {
    try {
      addResult('Testing users API...');
      
      const response = await fetch('/api/users');
      const data = await response.json();

      if (response.ok) {
        addResult('✅ Users API working!');
        addResult(`Found ${data.length} users`);
        
        const superAdmins = data.filter((user: any) => user.role === 'super_admin');
        addResult(`Super admins: ${superAdmins.length}`);
        
        if (superAdmins.length > 0) {
          addResult(`Super admin email: ${superAdmins[0].email}`);
        }
      } else {
        addResult(`❌ Users API failed: ${data.error}`);
      }
    } catch (error: any) {
      addResult(`❌ Users API error: ${error.message}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 Super Admin System Test
          </h1>
          <p className="text-gray-600">
            Test the super admin functionality and APIs
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Test Controls */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
            
            <div className="space-y-4">
              <button
                onClick={testSuperAdminLogin}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Test Super Admin Login
              </button>
              
              <button
                onClick={testSuperAdminStats}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Test Super Admin Stats API
              </button>
              
              <button
                onClick={testUsersAPI}
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Test Users API
              </button>
              
              <button
                onClick={clearResults}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Clear Results
              </button>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <h3 className="font-medium text-yellow-800 mb-2">🔐 Test Credentials</h3>
              <p className="text-sm text-yellow-700">
                <strong>Email:</strong> superadmin@getinline.com<br/>
                <strong>Password:</strong> SuperAdmin123!
              </p>
            </div>
          </div>

          {/* Test Results */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            
            <div className="bg-gray-100 rounded p-4 h-96 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-gray-500 text-center">No tests run yet. Click a test button to start.</p>
              ) : (
                <div className="space-y-1">
                  {testResults.map((result, index) => (
                    <div key={index} className="text-sm font-mono">
                      {result}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            href="/super-admin/login"
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 text-center"
          >
            🔧 Super Admin Login
          </Link>
          
          <Link 
            href="/super-admin"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 text-center"
          >
            📊 Super Admin Dashboard
          </Link>
          
          <Link 
            href="/login"
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 text-center"
          >
            🔑 Regular Login
          </Link>
        </div>
      </div>
    </div>
  );
}
