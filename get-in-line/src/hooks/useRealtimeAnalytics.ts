'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { APP_CONFIG } from '@/lib/config';

interface AnalyticsData {
  summary: {
    totalQueues: number;
    totalEntries: number;
    averageWaitTime: number;
    peakHour: number;
    completedServices: number;
    cancelledServices: number;
  };
  dailyStats: Array<{
    date: string;
    totalEntries: number;
    completedServices: number;
    cancelledServices: number;
  }>;
  queueStats: Array<{
    queueId: string;
    queueName: string;
    serviceType: string | null;
    totalEntries: number;
    completedServices: number;
    cancelledServices: number;
    averageWaitTime: number;
  }>;
}

interface UseRealtimeAnalyticsOptions {
  businessId: string;
  enabled?: boolean;
  refreshInterval?: number;
}

interface UseRealtimeAnalyticsReturn {
  analytics: AnalyticsData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}

export function useRealtimeAnalytics({
  businessId,
  enabled = true,
  refreshInterval = APP_CONFIG.ANALYTICS.REAL_TIME_UPDATE_INTERVAL,
}: UseRealtimeAnalyticsOptions): UseRealtimeAnalyticsReturn {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const fetchAnalytics = useCallback(async () => {
    if (!businessId || !enabled || !isMountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        APP_CONFIG.API_ENDPOINTS.BUSINESSES.ANALYTICS(businessId, APP_CONFIG.ANALYTICS.DEFAULT_DAYS)
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.status}`);
      }

      const data = await response.json();
      
      if (isMountedRef.current) {
        setAnalytics(data);
        setLastUpdated(new Date());
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err.message);
        console.error('Analytics fetch error:', err);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [businessId, enabled]);

  const refresh = useCallback(async () => {
    await fetchAnalytics();
  }, [fetchAnalytics]);

  // Initial fetch
  useEffect(() => {
    if (enabled && businessId) {
      fetchAnalytics();
    }
  }, [fetchAnalytics, enabled, businessId]);

  // Set up real-time updates
  useEffect(() => {
    if (!enabled || !businessId) return;

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up new interval
    intervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        fetchAnalytics();
      }
    }, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchAnalytics, enabled, businessId, refreshInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    analytics,
    loading,
    error,
    lastUpdated,
    refresh,
  };
}
