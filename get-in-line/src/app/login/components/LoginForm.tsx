'use client';

import { FormEvent } from 'react';
import Link from "next/link";

export default function LoginForm() {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // TODO: Add login logic here
    console.log('Login form submitted');
  };

  return (
    <div className="w-full max-w-md bg-white/70 dark:bg-black/60 backdrop-blur rounded-lg shadow-md p-8">
      <h1 className="text-2xl font-semibold mb-4">Log in</h1>
      <p className="text-sm mb-6">Sign in to view and manage your queues.</p>

      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <input
          aria-label="Email"
          className="border rounded px-3 py-2"
          placeholder="Email"
          type="email"
        />
        <input
          aria-label="Password"
          className="border rounded px-3 py-2"
          placeholder="Password"
          type="password"
        />
        <button className="mt-2 bg-blue-600 text-white rounded px-4 py-2">Sign in</button>
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
    </div>
  );
}