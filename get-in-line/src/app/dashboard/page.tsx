'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    }
    getUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
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
          <Link href="/business-admin" className="text-sm text-blue-600 hover:text-blue-800 font-medium">Business Admin</Link>
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
          <div className="p-6 bg-white shadow-sm rounded-lg border">
            <h2 className="text-lg font-medium mb-4">Your Queues</h2>
            <div className="space-y-4">
              <p className="text-gray-600">No queues created yet.</p>
              <Link 
                href="/queues/new" 
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
        </section>
      </main>
    </div>
  );
}
