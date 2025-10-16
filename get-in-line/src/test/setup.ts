import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  usePathname: () => '/',
}))

// Mock Next.js headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn((name: string) => ({ value: 'mock-cookie-value' })),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}))

// Mock global fetch
global.fetch = vi.fn()

// Mock Supabase
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null
      }),
    },
  })),
  createBrowserClient: vi.fn(() => ({
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null
      }),
      signUp: vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      insert: vi.fn(() => ({
        values: vi.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    }))
  })),
}))

// Mock database
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([]))
      }))
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([]))
      }))
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([]))
        }))
      }))
    }))
  }
}))

// Mock auth helpers
vi.mock('@/lib/auth-helpers', () => ({
  getUserBusinessId: vi.fn(() => Promise.resolve(null)),
  hasBusinessAccess: vi.fn(() => Promise.resolve(false)),
}))

// Mock permission helpers
vi.mock('@/lib/permission-helpers', () => ({
  getUserPermissions: vi.fn(() => Promise.resolve({
    canCreateQueues: false,
    canEditQueues: false,
    canDeleteQueues: false,
    canManageQueueOperations: false,
    canManageStaff: false,
    canViewStaff: false,
    canViewAnalytics: false,
    canExportData: false,
    canEditBusinessSettings: false,
    canManageBranches: false,
    canSendNotifications: false,
    canManageNotifications: false,
  })),
  hasPermission: vi.fn(() => Promise.resolve(false)),
}))

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    }))
  }))
}))

// Mock Supabase realtime hook
vi.mock('@/hooks/useSupabaseRealtime', () => ({
  useSupabaseRealtime: vi.fn(() => ({
    subscribe: vi.fn(),
    unsubscribe: vi.fn()
  }))
}))

