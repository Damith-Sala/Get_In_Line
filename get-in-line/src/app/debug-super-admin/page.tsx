'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DebugSuperAdmin() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function gatherDebugInfo() {
      const info: any = {
        timestamp: new Date().toISOString(),
        cookies: document.cookie,
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      // Test super admin login
      try {
        const loginResponse = await fetch('/api/auth/super-admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'superadmin@getinline.com',
            password: 'SuperAdmin123!'
          })
        });
        
        info.loginTest = {
          status: loginResponse.status,
          ok: loginResponse.ok,
          data: await loginResponse.json()
        };
      } catch (error: any) {
        info.loginTest = { error: error.message };
      }

      // Test super admin stats
      try {
        const statsResponse = await fetch('/api/super-admin/stats');
        info.statsTest = {
          status: statsResponse.status,
          ok: statsResponse.ok,
          data: statsResponse.ok ? await statsResponse.json() : await statsResponse.text()
        };
      } catch (error: any) {
        info.statsTest = { error: error.message };
      }

      // Test users API
      try {
        const usersResponse = await fetch('/api/users');
        info.usersTest = {
          status: usersResponse.status,
          ok: usersResponse.ok,
          data: usersResponse.ok ? await usersResponse.json() : await usersResponse.text()
        };
      } catch (error: any) {
        info.usersTest = { error: error.message };
      }

      setDebugInfo(info);
      setLoading(false);
    }

    gatherDebugInfo();
  }, []);

  const testLogin = async () => {
    try {
      const response = await fetch('/api/auth/super-admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'superadmin@getinline.com',
          password: 'SuperAdmin123!'
        })
      });

      const data = await response.json();
      alert(`Login test: ${response.ok ? 'SUCCESS' : 'FAILED'}\n${JSON.stringify(data, null, 2)}`);
      
      if (response.ok) {
        // Refresh the page to update debug info
        window.location.reload();
      }
    } catch (error: any) {
      alert(`Login test error: ${error.message}`);
    }
  };

  const testStats = async () => {
    try {
      const response = await fetch('/api/super-admin/stats');
      const data = await response.json();
      alert(`Stats test: ${response.ok ? 'SUCCESS' : 'FAILED'}\n${JSON.stringify(data, null, 2)}`);
    } catch (error: any) {
      alert(`Stats test error: ${error.message}`);
    }
  };

  const clearSession = () => {
    document.cookie = 'super-admin-session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    alert('Session cleared. Refresh the page to see updated debug info.');
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-gray-600">Gathering debug information...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🐛 Super Admin Debug Page
          </h1>
          <p className="text-gray-600">
            Debug information for super admin system
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Debug Information */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-700">Current Cookies:</h3>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                  {debugInfo.cookies || 'No cookies found'}
                </pre>
              </div>

              <div>
                <h3 className="font-medium text-gray-700">Login Test:</h3>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                  {JSON.stringify(debugInfo.loginTest, null, 2)}
                </pre>
              </div>

              <div>
                <h3 className="font-medium text-gray-700">Stats Test:</h3>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                  {JSON.stringify(debugInfo.statsTest, null, 2)}
                </pre>
              </div>

              <div>
                <h3 className="font-medium text-gray-700">Users Test:</h3>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                  {JSON.stringify(debugInfo.usersTest, null, 2)}
                </pre>
              </div>
            </div>
          </div>

          {/* Test Controls */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
            
            <div className="space-y-4">
              <button
                onClick={testLogin}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Test Super Admin Login
              </button>
              
              <button
                onClick={testStats}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Test Super Admin Stats
              </button>
              
              <button
                onClick={clearSession}
                className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
              >
                Clear Session
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Refresh Debug Info
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
        </div>

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
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
            href="/test-super-admin-fixed"
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 text-center"
          >
            🧪 Test Page
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
