import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from './route'

// Mock Next.js cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn((name: string) => ({ value: 'mock-cookie-value' })),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}))

// Mock Supabase SSR
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: null // This will make the test return 401 as expected
        },
        error: null
      }),
    },
  })),
}))

// Mock database
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          leftJoin: vi.fn(() => ({
            leftJoin: vi.fn(() => Promise.resolve([]))
          }))
        }))
      }))
    }))
  }
}))

// Mock auth helpers
vi.mock('@/lib/auth-helpers', () => ({
  getUserBusinessId: vi.fn(() => 'mock-business-id'),
}))

describe('/api/users/me', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 when no user is authenticated', async () => {
    const response = await GET()
    
    expect(response.status).toBe(401)
    
    const responseData = await response.json()
    expect(responseData.error).toBe('Not authenticated')
  })

  it('should return 401 when authentication fails', async () => {
    // Mock authentication error
    const { createServerClient } = await import('@supabase/ssr')
    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Invalid token' }
        }),
      },
    } as any)

    const response = await GET()
    
    expect(response.status).toBe(401)
    
    const responseData = await response.json()
    expect(responseData.error).toBe('Authentication error')
  })

  it('should return user data when valid authentication is provided', async () => {
    // Mock successful authentication
    const { createServerClient } = await import('@supabase/ssr')
    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: 'test-user-id',
              email: 'test@example.com'
            }
          },
          error: null
        }),
      },
    } as any)

    const response = await GET()
    
    expect(response.status).toBe(200)
  })
})
