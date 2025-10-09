'use client';

import { createClient } from '@/lib/supabase/client';
import { FormEvent, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateQueuePage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [maxSize, setMaxSize] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      
      // Check if user is a business user
      const response = await fetch('/api/users');
      if (response.ok) {
        const users = await response.json();
        const currentUser = users.find((u: any) => u.id === user.id);
        
        if (!currentUser || !['staff', 'admin', 'super_admin'].includes(currentUser.role)) {
          // Redirect regular users to queues page
          setError('Only business accounts can create queues');
          setTimeout(() => {
            router.push('/queues');
          }, 2000);
          return;
        }
      }
      
      setUser(user);
    }
    getUser();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/queues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description: description || null,
          maxSize: maxSize ? Number(maxSize) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create queue');
      }

      // Redirect to the queues page
      router.push('/queues');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen p-8 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link 
            href="/queues" 
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← Back to Queues
          </Link>
          <h1 className="text-3xl font-bold">Create New Queue</h1>
          <p className="text-gray-600 mt-2">Set up a new queue for customers to join.</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Queue Name *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Coffee Shop, Customer Service, etc."
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Optional description of what this queue is for..."
              />
            </div>

            <div>
              <label htmlFor="maxSize" className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Capacity
              </label>
              <input
                type="number"
                id="maxSize"
                value={maxSize}
                onChange={(e) => setMaxSize(e.target.value ? Number(e.target.value) : '')}
                min="1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Leave empty for unlimited"
              />
              <p className="text-sm text-gray-500 mt-1">
                Maximum number of people allowed in the queue. Leave empty for unlimited capacity.
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className={`flex-1 px-6 py-3 rounded-lg font-medium ${
                  loading || !name.trim()
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {loading ? 'Creating Queue...' : 'Create Queue'}
              </button>
              <Link
                href="/queues"
                className="flex-1 px-6 py-3 rounded-lg font-medium bg-gray-200 text-gray-800 hover:bg-gray-300 text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>

        {/* Preview */}
        {name && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Preview</h3>
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-lg">{name}</h4>
              {description && (
                <p className="text-gray-600 mt-2">{description}</p>
              )}
              <div className="mt-3 text-sm text-gray-500">
                <p>Capacity: {maxSize ? `${maxSize} people` : 'Unlimited'}</p>
                <p>Status: Ready to accept customers</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
