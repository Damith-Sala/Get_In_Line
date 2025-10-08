'use client';

import { FormEvent } from 'react';
import Link from "next/link";

export default function SignupForm() {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // TODO: Add signup logic here
    console.log('Form submitted');
  };

  return (
    <div className="w-full max-w-md bg-white/70 dark:bg-black/60 backdrop-blur rounded-lg shadow-md p-8">
      <h1 className="text-2xl font-semibold mb-4">Create account</h1>
      <p className="text-sm mb-6">Create an account to start checking in customers.</p>

      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <input className="border rounded px-3 py-2" placeholder="Full name" />
        <input className="border rounded px-3 py-2" placeholder="Email" type="email" />
        <input className="border rounded px-3 py-2" placeholder="Password" type="password" />
        <button className="mt-2 bg-green-600 text-white rounded px-4 py-2">Sign up</button>
      </form>

      <p className="mt-4 text-sm">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-600">
          Log in
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