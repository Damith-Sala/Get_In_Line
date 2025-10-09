'use client';

import { FormEvent, useState } from 'react';
import Link from "next/link";
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SignupForm() {
  const [name, setName] = useState('');
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
      // Use our custom signup API that handles both Supabase Auth and custom database
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      // Show success message and redirect
      if (data.user && data.session) {
        // User is immediately logged in, redirect to dashboard
        router.push('/dashboard');
        router.refresh();
      } else {
        // Fallback - redirect to login
        router.push('/login');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white/70 dark:bg-black/60 backdrop-blur rounded-lg shadow-md p-8">
      <h1 className="text-2xl font-semibold mb-4">Create Customer Account</h1>
      <p className="text-sm mb-6">Join queues and track your position in real-time.</p>

      {error && (
        <div className="bg-red-50 text-red-500 px-4 py-2 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <input 
          className="border rounded px-3 py-2" 
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required 
        />
        <input 
          className="border rounded px-3 py-2" 
          placeholder="Email" 
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required 
        />
        <input 
          className="border rounded px-3 py-2" 
          placeholder="Password" 
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required 
        />
        <button 
          className="mt-2 bg-green-600 text-white rounded px-4 py-2 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Creating account...' : 'Sign up'}
        </button>
      </form>

      <p className="mt-4 text-sm">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-600">
          Log in
        </Link>
      </p>

      <p className="mt-2 text-sm">
        Want to manage a business?{' '}
        <Link href="/signup/business" className="text-blue-600">
          Business signup
        </Link>
      </p>

      <p className="mt-2 text-xs">
        <Link href="/" className="text-gray-500">
          Back home
        </Link>
      </p>
    </div>
  );
}