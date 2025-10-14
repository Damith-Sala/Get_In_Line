'use client'

import { useEffect, useState } from 'react'
import { useQueueRealtime } from '@/hooks/useSupabaseRealtime'

interface RealTimeQueueProps {
  queueId: string
  userId?: string
  userPosition?: number
}

export default function RealTimeQueue({ queueId, userId, userPosition }: RealTimeQueueProps) {
  const { isConnected, position, queueStatus, currentServing } = useQueueRealtime(queueId)
  const [notifications, setNotifications] = useState<string[]>([])

  useEffect(() => {
    if (currentServing) {
      const message = `Position ${currentServing} is now being served!`
      setNotifications(prev => [...prev, message])
      
      // Auto-remove notification after 5 seconds
      setTimeout(() => {
        setNotifications(prev => prev.slice(1))
      }, 5000)
    }
  }, [currentServing])

  const displayPosition = position || userPosition

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Live Queue Status</h3>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            {isConnected ? 'Live' : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="mb-4 space-y-2">
          {notifications.map((notification, index) => (
            <div key={index} className="bg-blue-100 border border-blue-300 rounded-lg p-3 animate-pulse">
              <p className="text-blue-800 font-medium text-sm">
                🎉 {notification}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Current Serving */}
      {currentServing && (
        <div className="bg-green-100 border border-green-300 rounded-lg p-4 mb-4">
          <p className="text-green-800 font-medium text-center">
            🎯 Now Serving: Position #{currentServing}
          </p>
        </div>
      )}

      {/* User Position */}
      {displayPosition && (
        <div className="text-center mb-6">
          <p className="text-2xl font-bold text-gray-800 mb-2">Your Position</p>
          <div className="text-6xl font-bold text-blue-600 mb-2">
            {displayPosition}
          </div>
          {currentServing && (
            <p className="text-gray-600">
              {displayPosition > currentServing 
                ? `You are ${displayPosition - currentServing} positions away`
                : displayPosition === currentServing
                ? '🎉 It\'s your turn!'
                : 'You have been served'
              }
            </p>
          )}
        </div>
      )}

      {/* Queue Status */}
      {queueStatus && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-2">Queue Information</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Waiting:</span>
              <span className="font-medium">{queueStatus.totalWaiting || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Estimated Wait:</span>
              <span className="font-medium">{queueStatus.estimatedWaitTime || 0} min</span>
            </div>
            {queueStatus.isActive !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${queueStatus.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {queueStatus.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Connection Info */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        {isConnected ? '🟢 Real-time updates enabled' : '🔴 Connecting to live updates...'}
      </div>
    </div>
  )
}
