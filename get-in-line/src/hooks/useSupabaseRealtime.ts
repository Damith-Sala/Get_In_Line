'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

export const useSupabaseRealtime = () => {
  const [isConnected, setIsConnected] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Test connection
    const testConnection = async () => {
      try {
        const { data, error } = await supabase
          .from('queues')
          .select('id')
          .limit(1)
        
        if (!error) {
          setIsConnected(true)
        }
      } catch (err) {
        setIsConnected(false)
      }
    }

    testConnection()
  }, [supabase])

  return { supabase, isConnected }
}

export const useQueueRealtime = (queueId: string) => {
  const { supabase, isConnected } = useSupabaseRealtime()
  const [position, setPosition] = useState<number | null>(null)
  const [queueStatus, setQueueStatus] = useState<any>(null)
  const [currentServing, setCurrentServing] = useState<number | null>(null)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!queueId || !supabase) return

    // Subscribe to queue_entries changes for this specific queue
    const queueChannel = supabase
      .channel(`queue-${queueId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'queue_entries',
          filter: `queue_id=eq.${queueId}`
        },
        (payload) => {
          console.log('Queue entry change:', payload)
          
          // Handle different event types
          switch (payload.eventType) {
            case 'INSERT':
              // New person joined queue
              setQueueStatus(prev => ({
                ...prev,
                totalWaiting: (prev?.totalWaiting || 0) + 1
              }))
              break
            case 'UPDATE':
              // Position or status changed
              if (payload.new.status === 'serving') {
                setCurrentServing(payload.new.position)
              }
              break
            case 'DELETE':
              // Person left queue
              setQueueStatus(prev => ({
                ...prev,
                totalWaiting: Math.max((prev?.totalWaiting || 0) - 1, 0)
              }))
              break
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'queues',
          filter: `id=eq.${queueId}`
        },
        (payload) => {
          console.log('Queue status change:', payload)
          setQueueStatus(payload.new)
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status)
      })

    setChannel(queueChannel)

    return () => {
      queueChannel.unsubscribe()
    }
  }, [queueId, supabase])

  return {
    isConnected,
    position,
    queueStatus,
    currentServing,
    channel
  }
}
