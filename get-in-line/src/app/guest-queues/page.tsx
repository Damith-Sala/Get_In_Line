'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Queue {
  id: string;
  name: string;
  description: string | null;
  business_name: string;
  current_position: number;
  estimated_wait_time: number | null;
  is_active: boolean;
  created_at: string;
}

export default function GuestQueuesPage() {
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joiningQueue, setJoiningQueue] = useState<string | null>(null);
  const [creatingDemo, setCreatingDemo] = useState(false);

  useEffect(() => {
    async function fetchQueues() {
      try {
        const response = await fetch('/api/queues');
        if (response.ok) {
          const data = await response.json();
          setQueues(data.queues || []);
        } else {
          setError('Failed to load queues');
        }
      } catch (err) {
        setError('Failed to load queues');
      } finally {
        setLoading(false);
      }
    }

    fetchQueues();
  }, []);

  const handleGuestJoin = async (queueId: string) => {
    setJoiningQueue(queueId);
    try {
      const response = await fetch(`/api/queues/${queueId}/guest-join`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`Successfully joined queue! Your position: ${data.position}`);
        // Refresh queues to update current position
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert(`Failed to join queue: ${errorData.error}`);
      }
    } catch (err) {
      alert('Failed to join queue. Please try again.');
    } finally {
      setJoiningQueue(null);
    }
  };

  const handleCreateDemoQueue = async () => {
    setCreatingDemo(true);
    try {
      const response = await fetch('/api/demo/create-queue', {
        method: 'POST',
      });
      
      if (response.ok) {
        alert('Demo queue created successfully! You can now test joining it.');
        // Refresh queues to show the new demo queue
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert(`Failed to create demo queue: ${errorData.error}`);
      }
    } catch (err) {
      alert('Failed to create demo queue. Please try again.');
    } finally {
      setCreatingDemo(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-gray-600">Loading available queues...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header with enhanced styling */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Available Queues
              </h1>
              <p className="text-gray-600 mt-2 text-lg">Browse all available queues without signing up</p>
            </div>
            <div className="flex gap-3">
              <Link 
                href="/login" 
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Login
              </Link>
              <Link 
                href="/signup" 
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {queues.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
              <svg className="w-16 h-16 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">No Queues Available Yet</h3>
            <p className="text-gray-600 mb-12 max-w-lg mx-auto text-lg leading-relaxed">
              There are no active queues at the moment. Be the first to create a queue or check back later!
            </p>
            
            <div className="space-y-6 max-w-lg mx-auto">
              <button
                onClick={handleCreateDemoQueue}
                disabled={creatingDemo}
                className="block w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {creatingDemo ? 'Creating Demo Queue...' : '🚀 Create Demo Queue for Testing'}
              </button>
              
              <div className="flex items-center justify-center">
                <div className="flex-1 h-px bg-gray-300"></div>
                <span className="px-4 text-sm text-gray-500 font-medium">or</span>
                <div className="flex-1 h-px bg-gray-300"></div>
              </div>
              
              <Link 
                href="/signup/business"
                className="block w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-center"
              >
                🏢 Create Your Business Account
              </Link>
              
              <div className="flex items-center justify-center">
                <div className="flex-1 h-px bg-gray-300"></div>
                <span className="px-4 text-sm text-gray-500 font-medium">or</span>
                <div className="flex-1 h-px bg-gray-300"></div>
              </div>
              
              <div className="flex gap-4">
                <Link 
                  href="/signup"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-center"
                >
                  👤 Sign Up as Customer
                </Link>
                <Link 
                  href="/login"
                  className="flex-1 px-6 py-3 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-center border border-gray-200"
                >
                  🔑 Login
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {queues.map((queue) => (
              <div key={queue.id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-2xl hover:scale-105 transition-all duration-300 group">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{queue.name}</h3>
                    <p className="text-gray-600 font-medium flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      {queue.business_name}
                    </p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm ${
                    queue.is_active 
                      ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' 
                      : 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border border-gray-200'
                  }`}>
                    {queue.is_active ? '🟢 Active' : '⚫ Inactive'}
                  </div>
                </div>

                {queue.description && (
                  <p className="text-gray-600 mb-6 leading-relaxed">{queue.description}</p>
                )}

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
                    <span className="text-gray-600 font-medium flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      Current Position:
                    </span>
                    <span className="font-bold text-blue-600 text-lg">{queue.current_position}</span>
                  </div>
                  {queue.estimated_wait_time && (
                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded-xl">
                      <span className="text-gray-600 font-medium flex items-center">
                        <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                        Est. Wait Time:
                      </span>
                      <span className="font-bold text-orange-600 text-lg">{queue.estimated_wait_time} min</span>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <p className="text-xs text-gray-400 mb-4 flex items-center">
                    <span className="mr-1">📅</span>
                    Created: {new Date(queue.created_at).toLocaleDateString()}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleGuestJoin(queue.id)}
                      disabled={joiningQueue === queue.id}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center rounded-xl hover:from-blue-700 hover:to-blue-800 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 disabled:transform-none"
                    >
                      {joiningQueue === queue.id ? '⏳ Joining...' : '🚀 Join as Guest'}
                    </button>
                    <Link 
                      href={`/login?redirect=/queues/${queue.id}/join`}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white text-center rounded-xl hover:from-green-700 hover:to-green-800 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                      🔑 Login to Join
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="mt-16 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Ready to Create Your Own Queue?</h3>
            <p className="text-gray-600 mb-6">
              Join thousands of businesses using our platform to manage their customer queues efficiently.
            </p>
            <Link 
              href="/signup/business" 
              className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              🏢 Start Your Business Account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
