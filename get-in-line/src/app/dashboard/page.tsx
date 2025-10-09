'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUser() {
      try {
        setLoading(true);
        
        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.error('Auth error:', authError);
          router.push('/login');
          return;
        }
        
        setUser(user);
        
        // Get user role from database using new endpoint
        const response = await fetch('/api/users/me');
        if (response.ok) {
          const userData = await response.json();
          setUserRole(userData.role || 'user');
        } else {
          console.error('Failed to fetch user data');
          setUserRole('user'); // Default fallback
        }
      } catch (error) {
        console.error('Error loading user:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    getUser();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Sign out error:', error);
      // Force redirect even if sign out fails
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-gray-600">Welcome, {user?.email}</p>
        </div>
        <nav className="flex gap-4 items-center">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">Home</Link>
          <Link href="/queues" className="text-sm text-gray-600 hover:text-gray-900">View Queues</Link>
          <Link href="/my-queues" className="text-sm text-gray-600 hover:text-gray-900">My Queues</Link>
          {userRole !== 'user' && (
            <Link href="/business-admin" className="text-sm text-blue-600 hover:text-blue-800 font-medium">Business Admin</Link>
          )}
          <button 
            onClick={handleSignOut}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Sign out
          </button>
        </nav>
      </header>

      <main>
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {userRole === 'user' ? (
            // Customer Dashboard
            <>
              <div className="p-6 bg-white shadow-sm rounded-lg border">
                <h2 className="text-lg font-medium mb-4">My Queue Entries</h2>
                <div className="space-y-4">
                  <p className="text-gray-600">You haven't joined any queues yet.</p>
                  <Link 
                    href="/queues" 
                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Browse Available Queues
                  </Link>
                </div>
              </div>
              
              <div className="p-6 bg-white shadow-sm rounded-lg border">
                <h2 className="text-lg font-medium mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <Link 
                    href="/queues" 
                    className="block px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    View All Queues
                  </Link>
                  <Link 
                    href="/my-queues" 
                    className="block px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    My Queue Entries
                  </Link>
                </div>
              </div>
            </>
          ) : (
            // Business User Dashboard
            <>
              <div className="p-6 bg-white shadow-sm rounded-lg border">
                <h2 className="text-lg font-medium mb-4">Your Queues</h2>
                <div className="space-y-4">
                  <p className="text-gray-600">No queues created yet.</p>
                  <Link 
                    href="/queues/create" 
                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Create New Queue
                  </Link>
                </div>
              </div>
              
              <div className="p-6 bg-white shadow-sm rounded-lg border">
                <h2 className="text-lg font-medium mb-4">Active Customers</h2>
                <p className="text-gray-600">No active customers in queue.</p>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
