'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

export const useSupabaseRealtime = () => {
  const [isConnected, setIsConnected] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true
    
    // Test connection
    const testConnection = async () => {
      try {
        const { data, error } = await supabase
          .from('queues')
          .select('id')
          .limit(1)
        
        if (isMounted) {
          setIsConnected(!error)
        }
      } catch (err) {
        if (isMounted) {
          setIsConnected(false)
        }
      }
    }

    testConnection()
    
    return () => {
      isMounted = false
    }
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

    let isMounted = true
    let queueChannel: RealtimeChannel | null = null

    const setupSubscription = () => {
      // Unsubscribe from any existing channel first
      if (queueChannel) {
        queueChannel.unsubscribe()
      }

      // Subscribe to queue_entries changes for this specific queue
      queueChannel = supabase
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
            if (!isMounted) return
            
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
            if (!isMounted) return
            
            console.log('Queue status change:', payload)
            setQueueStatus(payload.new)
          }
        )
        .subscribe((status) => {
          if (isMounted) {
            console.log('Subscription status:', status)
          }
        })

      if (isMounted) {
        setChannel(queueChannel)
      }
    }

    setupSubscription()

    return () => {
      isMounted = false
      if (queueChannel) {
        queueChannel.unsubscribe()
        queueChannel = null
      }
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
