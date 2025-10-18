/**
 * Application Configuration
 * Centralized configuration to replace hardcoded values
 */

export const APP_CONFIG = {
  // Timeout configurations
  TIMEOUTS: {
    LOADING_TIMEOUT: 30000, // 30 seconds
    API_TIMEOUT: 10000, // 10 seconds
    WEBSOCKET_RECONNECT_DELAY: 5000, // 5 seconds
  },

  // Analytics configurations
  ANALYTICS: {
    DEFAULT_DAYS: 7,
    REFRESH_INTERVAL: 30000, // 30 seconds
    REAL_TIME_UPDATE_INTERVAL: 5000, // 5 seconds
  },

  // User roles and permissions
  ROLES: {
    ALLOWED_BUSINESS_ROLES: ['business_admin', 'staff', 'super_admin'],
    DEFAULT_ROLE: 'user',
  },

  // Default permissions for business admin
  DEFAULT_BUSINESS_ADMIN_PERMISSIONS: {
    canCreateQueues: true,
    canEditQueues: true,
    canDeleteQueues: true,
    canManageQueueOperations: true,
    canManageStaff: true,
    canViewStaff: true,
    canViewAnalytics: true,
    canExportData: true,
    canEditBusinessSettings: true,
    canManageBranches: true,
    canSendNotifications: true,
    canManageNotifications: true,
  },

  // API endpoints
  API_ENDPOINTS: {
    USERS: {
      ME: '/api/users/me',
      PERMISSIONS: '/api/users/me/permissions',
    },
    BUSINESSES: {
      BY_ID: (id: string) => `/api/businesses/${id}`,
      BRANCHES: (id: string) => `/api/businesses/${id}/branches`,
      ANALYTICS: (id: string, days?: number) => `/api/businesses/${id}/analytics${days ? `?days=${days}` : ''}`,
    },
    QUEUES: '/api/queues',
  },

  // Navigation paths
  ROUTES: {
    DASHBOARD: '/dashboard',
    LOGIN: '/login',
    PROFILE: '/profile',
    QUEUES: {
      CREATE: '/queues/create',
    },
    BUSINESS_ADMIN: {
      STAFF: '/business-admin/staff',
      BRANCHES: {
        CREATE: '/business-admin/branches/create',
        EDIT: (id: string) => `/business-admin/branches/edit/${id}`,
      },
      QUEUES: (id: string) => `/business-admin/queues/${id}`,
      ANALYTICS: '/business-admin/analytics',
      NOTIFICATIONS: '/business-admin/notifications',
      CREATE: '/business-admin/create',
    },
  },

  // UI Messages
  MESSAGES: {
    LOADING: {
      DASHBOARD: 'Loading business dashboard...',
      TIMEOUT: 'Loading is taking longer than expected. Please check your connection and try again.',
    },
    ERRORS: {
      LOGIN_REQUIRED: 'Please log in to access business admin features',
      NO_BUSINESS: 'No business associated with your account',
      DASHBOARD_FAILED: 'Dashboard loading failed',
      DELETE_BRANCH_FAILED: 'Failed to delete branch',
    },
    SUCCESS: {
      BRANCH_DELETED: 'Branch deleted successfully',
    },
    CONFIRMATIONS: {
      DELETE_BRANCH: 'Are you sure you want to delete this branch? This action cannot be undone.',
    },
  },

  // UI Styling
  STYLES: {
    BUTTONS: {
      PRIMARY: 'bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700',
      SECONDARY: 'bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700',
      SUCCESS: 'bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700',
      DANGER: 'bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700',
      WARNING: 'bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700',
      PURPLE: 'bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700',
    },
    GRIDS: {
      STATS: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8',
      MAIN_CONTENT: 'grid grid-cols-1 lg:grid-cols-2 gap-8',
      QUEUES: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
      MANAGEMENT_LINKS: 'grid grid-cols-1 md:grid-cols-3 gap-6',
    },
    STATUS: {
      ACTIVE: 'bg-green-100 text-green-800',
      INACTIVE: 'bg-red-100 text-red-800',
    },
  },

  // Real-time configurations
  REALTIME: {
    WEBSOCKET_URL: process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001',
    RECONNECT_ATTEMPTS: 5,
    HEARTBEAT_INTERVAL: 30000, // 30 seconds
  },
} as const;

// Type definitions for better type safety
export type AppConfig = typeof APP_CONFIG;
export type TimeoutConfig = typeof APP_CONFIG.TIMEOUTS;
export type AnalyticsConfig = typeof APP_CONFIG.ANALYTICS;
export type RoleConfig = typeof APP_CONFIG.ROLES;
export type ApiEndpoints = typeof APP_CONFIG.API_ENDPOINTS;
export type Routes = typeof APP_CONFIG.ROUTES;
export type Messages = typeof APP_CONFIG.MESSAGES;
export type Styles = typeof APP_CONFIG.STYLES;
export type RealtimeConfig = typeof APP_CONFIG.REALTIME;
