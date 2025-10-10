'use client';

import { FormEvent, useState } from 'react';
import Link from "next/link";
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Use our custom login API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Check user role and redirect accordingly
      const usersResponse = await fetch('/api/users/me');
      if (usersResponse.ok) {
        const userData = await usersResponse.json();
        
        if (userData.role === 'super_admin') {
          // Super admin - redirect to super admin dashboard
          router.push('/super-admin');
        } else if (userData.role === 'staff') {
          // Staff user - redirect to business admin
          router.push('/business-admin');
        } else {
          // All other users (including business owners with admin role) - redirect to dashboard
          router.push('/dashboard');
        }
      } else {
        // Fallback to dashboard if we can't check role
        router.push('/dashboard');
      }
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white/70 dark:bg-black/60 backdrop-blur rounded-lg shadow-md p-8">
      <h1 className="text-2xl font-semibold mb-4">Log in</h1>
      <p className="text-sm mb-6">Sign in to view and manage your queues.</p>

      {error && (
        <div className="bg-red-50 text-red-500 px-4 py-2 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <input
          aria-label="Email"
          className="border rounded px-3 py-2"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          aria-label="Password"
          className="border rounded px-3 py-2"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button 
          className="mt-2 bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="mt-4 text-sm">
        Don't have an account?{' '}
        <Link href="/signup" className="text-blue-600">
          Sign up
        </Link>
      </p>

      <p className="mt-2 text-xs">
        <Link href="/" className="text-gray-500">
          Back home
        </Link>
      </p>

      <div className="mt-6 text-center">
        <Link 
          href="/super-admin/login" 
          className="text-purple-600 hover:text-purple-800 text-sm font-medium"
        >
          🔧 Super Admin Access
        </Link>
      </div>
    </div>
  );
}