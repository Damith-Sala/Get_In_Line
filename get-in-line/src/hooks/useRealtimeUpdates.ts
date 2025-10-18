'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { APP_CONFIG } from '@/lib/config';

interface RealtimeEvent {
  type: 'queue_update' | 'analytics_update' | 'branch_update' | 'staff_update';
  data: any;
  timestamp: string;
}

interface UseRealtimeUpdatesOptions {
  businessId: string;
  enabled?: boolean;
  onQueueUpdate?: (data: any) => void;
  onAnalyticsUpdate?: (data: any) => void;
  onBranchUpdate?: (data: any) => void;
  onStaffUpdate?: (data: any) => void;
}

interface UseRealtimeUpdatesReturn {
  isConnected: boolean;
  connectionError: string | null;
  reconnect: () => void;
  sendMessage: (message: any) => void;
}

export function useRealtimeUpdates({
  businessId,
  enabled = true,
  onQueueUpdate,
  onAnalyticsUpdate,
  onBranchUpdate,
  onStaffUpdate,
}: UseRealtimeUpdatesOptions): UseRealtimeUpdatesReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!enabled || !businessId || !isMountedRef.current) return;

    try {
      // Close existing connection
      if (wsRef.current) {
        wsRef.current.close();
      }

      const ws = new WebSocket(`${APP_CONFIG.REALTIME.WEBSOCKET_URL}?businessId=${businessId}`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (isMountedRef.current) {
          setIsConnected(true);
          setConnectionError(null);
          reconnectAttemptsRef.current = 0;
          console.log('WebSocket connected for business:', businessId);

          // Start heartbeat
          heartbeatIntervalRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping' }));
            }
          }, APP_CONFIG.REALTIME.HEARTBEAT_INTERVAL);
        }
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;

        try {
          const message: RealtimeEvent = JSON.parse(event.data);
          
          // Handle pong response
          if (message.type === 'pong') {
            return;
          }

          // Route events to appropriate handlers
          switch (message.type) {
            case 'queue_update':
              onQueueUpdate?.(message.data);
              break;
            case 'analytics_update':
              onAnalyticsUpdate?.(message.data);
              break;
            case 'branch_update':
              onBranchUpdate?.(message.data);
              break;
            case 'staff_update':
              onStaffUpdate?.(message.data);
              break;
            default:
              console.log('Unknown real-time event type:', message.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        if (isMountedRef.current) {
          setIsConnected(false);
          console.log('WebSocket disconnected:', event.code, event.reason);

          // Clear heartbeat
          if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
          }

          // Attempt to reconnect if not a manual close
          if (event.code !== 1000 && reconnectAttemptsRef.current < APP_CONFIG.REALTIME.RECONNECT_ATTEMPTS) {
            reconnectAttemptsRef.current++;
            console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${APP_CONFIG.REALTIME.RECONNECT_ATTEMPTS})`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              if (isMountedRef.current) {
                connect();
              }
            }, APP_CONFIG.REALTIME.RECONNECT_DELAY);
          } else if (reconnectAttemptsRef.current >= APP_CONFIG.REALTIME.RECONNECT_ATTEMPTS) {
            setConnectionError('Failed to reconnect after multiple attempts');
          }
        }
      };

      ws.onerror = (error) => {
        if (isMountedRef.current) {
          console.error('WebSocket error:', error);
          setConnectionError('Connection error occurred');
        }
      };

    } catch (error) {
      if (isMountedRef.current) {
        console.error('Failed to create WebSocket connection:', error);
        setConnectionError('Failed to establish connection');
      }
    }
  }, [enabled, businessId, onQueueUpdate, onAnalyticsUpdate, onBranchUpdate, onStaffUpdate]);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    setConnectionError(null);
    connect();
  }, [connect]);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Cannot send message:', message);
    }
  }, []);

  // Initialize connection
  useEffect(() => {
    if (enabled && businessId) {
      connect();
    }

    return () => {
      isMountedRef.current = false;
      
      // Clear timeouts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }

      // Close WebSocket
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
      }
    };
  }, [connect, enabled, businessId]);

  return {
    isConnected,
    connectionError,
    reconnect,
    sendMessage,
  };
}
