'use client'

import { useState } from 'react'
import RealTimeQueue from '@/components/RealTimeQueue'

export default function TestWebSocketPage() {
  const [queueId, setQueueId] = useState('test-queue-123')
  const [testUserId, setTestUserId] = useState('test-user-456')

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">WebSocket Real-Time Queue Test</h1>
          
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Queue ID
                </label>
                <input
                  type="text"
                  value={queueId}
                  onChange={(e) => setQueueId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter queue ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User ID
                </label>
                <input
                  type="text"
                  value={testUserId}
                  onChange={(e) => setTestUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter user ID"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Real-Time Queue Component</h2>
              <RealTimeQueue 
                queueId={queueId} 
                userId={testUserId}
                userPosition={5}
              />
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Test Instructions</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-800 mb-2">How to Test:</h3>
                <ol className="list-decimal list-inside text-blue-700 space-y-2 text-sm">
                  <li>Open this page in multiple browser tabs</li>
                  <li>Use the same Queue ID in all tabs</li>
                  <li>Watch the connection status indicator</li>
                  <li>Simulate "next" calls by calling the API endpoint</li>
                  <li>Observe real-time updates across all tabs</li>
                </ol>
              </div>

              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-800 mb-2">API Endpoints to Test:</h3>
                <div className="text-green-700 text-sm space-y-1">
                  <p><strong>POST</strong> /api/queues/{queueId}/next</p>
                  <p><strong>POST</strong> /api/queues/{queueId}/join</p>
                  <p><strong>POST</strong> /api/queues/{queueId}/leave</p>
                </div>
              </div>

              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-medium text-yellow-800 mb-2">Expected Behavior:</h3>
                <ul className="list-disc list-inside text-yellow-700 text-sm space-y-1">
                  <li>Green dot = Connected to WebSocket</li>
                  <li>Red dot = Disconnected</li>
                  <li>Real-time position updates</li>
                  <li>Live "Now Serving" notifications</li>
                  <li>Instant updates across all tabs</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Test Actions</h2>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  fetch(`/api/queues/${queueId}/next`, { method: 'POST' })
                    .then(res => res.json())
                    .then(data => console.log('Next called:', data))
                    .catch(err => console.error('Error:', err))
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Call Next (Test)
              </button>
              
              <button
                onClick={() => {
                  fetch(`/api/queues/${queueId}/join`, { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: testUserId })
                  })
                    .then(res => res.json())
                    .then(data => console.log('Joined queue:', data))
                    .catch(err => console.error('Error:', err))
                }}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Join Queue (Test)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
