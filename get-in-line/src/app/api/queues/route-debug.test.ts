import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'

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
        data: { user: { id: 'staff-user-1', email: 'staff@test.com' } },
        error: null
      }),
    },
  })),
}))

// Mock database
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
    insert: vi.fn(),
  }
}))

// Mock drizzle-orm
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((field, value) => ({ field, value, type: 'eq' })),
}))

// Mock permission helpers - but allow access to constants
vi.mock('@/lib/permission-helpers', async () => {
  const actual = await vi.importActual('@/lib/permission-helpers')
  return {
    ...actual,
    hasPermission: vi.fn(),
    getUserPermissions: vi.fn(),
  }
})

// Mock validation
vi.mock('@/lib/validation', () => ({
  queueSchema: {
    parse: vi.fn((data) => data) // Just return the data as-is for testing
  }
}))

describe('Queue Creation API Debug Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should identify when staff user has no businessId', async () => {
    const { db } = await import('@/lib/db')
    
    // Mock user lookup - staff with NO businessId
    db.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValueOnce([{
            id: 'staff-user-1',
            role: 'staff',
            businessId: null  // ❌ This will cause the error!
          }])
        })
      })
    })

    const request = new NextRequest('http://localhost:3000/api/queues', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Queue',
        description: 'Test Description',
        isActive: true
      })
    })

    const response = await POST(request)
    const responseData = await response.json()
    
    console.log('Response status:', response.status)
    console.log('Response data:', responseData)
    
    // This should return 403 with the specific error
    expect(response.status).toBe(403)
    expect(responseData.error).toBe('User must be associated with a business to create queues')
  })

  it('should identify when staff user lacks create permission', async () => {
    const { db } = await import('@/lib/db')
    const { hasPermission } = await import('@/lib/permission-helpers')
    
    // Mock user lookup - staff with businessId
    db.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValueOnce([{
            id: 'staff-user-1',
            role: 'staff',
            businessId: 'business-1'
          }])
        })
      })
    })

    // Mock permission check - DENIED
    vi.mocked(hasPermission).mockResolvedValueOnce(false)

    const request = new NextRequest('http://localhost:3000/api/queues', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Queue',
        description: 'Test Description',
        isActive: true
      })
    })

    const response = await POST(request)
    const responseData = await response.json()
    
    console.log('Response status:', response.status)
    console.log('Response data:', responseData)
    
    // This should return 403 with permission error
    expect(response.status).toBe(403)
    expect(responseData.error).toBe('You do not have permission to create queues. Contact your business admin.')
  })

  it('should succeed when staff user has proper setup', async () => {
    const { db } = await import('@/lib/db')
    const { hasPermission } = await import('@/lib/permission-helpers')
    
    // Mock user lookup - staff with businessId
    db.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValueOnce([{
            id: 'staff-user-1',
            role: 'staff',
            businessId: 'business-1'
          }])
        })
      })
    })

    // Mock permission check - ALLOWED
    vi.mocked(hasPermission).mockResolvedValueOnce(true)

    // Mock queue creation
    db.insert.mockReturnValueOnce({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValueOnce([{
          id: 'queue-1',
          name: 'Test Queue',
          description: 'Test Description',
          businessId: 'business-1',
          creatorId: 'staff-user-1',
          isActive: true
        }])
      })
    })

    const request = new NextRequest('http://localhost:3000/api/queues', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Queue',
        description: 'Test Description',
        isActive: true
      })
    })

    const response = await POST(request)
    const responseData = await response.json()
    
    console.log('Response status:', response.status)
    console.log('Response data:', responseData)
    
    // This should succeed
    expect(response.status).toBe(201)
    expect(responseData.name).toBe('Test Queue')
    expect(responseData.businessId).toBe('business-1')
    expect(responseData.creatorId).toBe('staff-user-1')
  })

  it('should identify when user is not authenticated', async () => {
    const { createServerClient } = await import('@supabase/ssr')
    
    // Mock authentication failure
    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Invalid token' }
        }),
      },
    } as any)

    const request = new NextRequest('http://localhost:3000/api/queues', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Queue',
        description: 'Test Description',
        isActive: true
      })
    })

    const response = await POST(request)
    const responseData = await response.json()
    
    console.log('Response status:', response.status)
    console.log('Response data:', responseData)
    
    expect(response.status).toBe(401)
    expect(responseData.error).toBe('Not authenticated')
  })

  it('should identify when user is not found in database', async () => {
    const { db } = await import('@/lib/db')
    
    // Mock user lookup - user not found
    db.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValueOnce([]) // No user found
        })
      })
    })

    const request = new NextRequest('http://localhost:3000/api/queues', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Queue',
        description: 'Test Description',
        isActive: true
      })
    })

    const response = await POST(request)
    const responseData = await response.json()
    
    console.log('Response status:', response.status)
    console.log('Response data:', responseData)
    
    expect(response.status).toBe(404)
    expect(responseData.error).toBe('User not found')
  })

  it('should identify when user role is not allowed to create queues', async () => {
    const { db } = await import('@/lib/db')
    
    // Mock user lookup - regular user (not staff/admin)
    db.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValueOnce([{
            id: 'regular-user-1',
            role: 'user',  // ❌ Regular user can't create queues
            businessId: null
          }])
        })
      })
    })

    const request = new NextRequest('http://localhost:3000/api/queues', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Queue',
        description: 'Test Description',
        isActive: true
      })
    })

    const response = await POST(request)
    const responseData = await response.json()
    
    console.log('Response status:', response.status)
    console.log('Response data:', responseData)
    
    expect(response.status).toBe(403)
    expect(responseData.error).toBe('Only business accounts can create queues')
  })

  it('should identify when business admin creates queue successfully', async () => {
    const { db } = await import('@/lib/db')
    
    // Mock user lookup - business admin
    db.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValueOnce([{
            id: 'admin-user-1',
            role: 'business_admin',
            businessId: 'business-1'
          }])
        })
      })
    })

    // Mock queue creation
    db.insert.mockReturnValueOnce({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValueOnce([{
          id: 'queue-1',
          name: 'Test Queue',
          description: 'Test Description',
          businessId: 'business-1',
          creatorId: 'admin-user-1',
          isActive: true
        }])
      })
    })

    const request = new NextRequest('http://localhost:3000/api/queues', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Queue',
        description: 'Test Description',
        isActive: true
      })
    })

    const response = await POST(request)
    const responseData = await response.json()
    
    console.log('Response status:', response.status)
    console.log('Response data:', responseData)
    
    // Business admin should succeed without permission check
    expect(response.status).toBe(201)
    expect(responseData.name).toBe('Test Queue')
    expect(responseData.businessId).toBe('business-1')
  })

  it('should identify when super admin creates queue successfully', async () => {
    const { db } = await import('@/lib/db')
    
    // Mock user lookup - super admin
    db.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValueOnce([{
            id: 'super-admin-1',
            role: 'super_admin',
            businessId: null  // Super admin might not have businessId
          }])
        })
      })
    })

    const request = new NextRequest('http://localhost:3000/api/queues', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Queue',
        description: 'Test Description',
        isActive: true
      })
    })

    const response = await POST(request)
    const responseData = await response.json()
    
    console.log('Response status:', response.status)
    console.log('Response data:', responseData)
    
    // Super admin should fail if no businessId (this might be a bug!)
    expect(response.status).toBe(403)
    expect(responseData.error).toBe('User must be associated with a business to create queues')
  })

  it('should identify validation errors', async () => {
    const { queueSchema } = await import('@/lib/validation')
    
    // Mock validation failure
    vi.mocked(queueSchema.parse).mockImplementationOnce(() => {
      throw new Error('Validation failed: name is required')
    })

    const request = new NextRequest('http://localhost:3000/api/queues', {
      method: 'POST',
      body: JSON.stringify({
        // Missing required name field
        description: 'Test Description',
        isActive: true
      })
    })

    const response = await POST(request)
    const responseData = await response.json()
    
    console.log('Response status:', response.status)
    console.log('Response data:', responseData)
    
    expect(response.status).toBe(400)
    expect(responseData.error).toBe('Failed to create queue')
  })

  it('should identify database errors during queue creation', async () => {
    const { db } = await import('@/lib/db')
    const { hasPermission } = await import('@/lib/permission-helpers')
    
    // Mock user lookup - staff with businessId
    db.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValueOnce([{
            id: 'staff-user-1',
            role: 'staff',
            businessId: 'business-1'
          }])
        })
      })
    })

    // Mock permission check - ALLOWED
    vi.mocked(hasPermission).mockResolvedValueOnce(true)

    // Mock queue creation - DATABASE ERROR
    db.insert.mockReturnValueOnce({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockRejectedValue(new Error('Database connection failed'))
      })
    })

    const request = new NextRequest('http://localhost:3000/api/queues', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Queue',
        description: 'Test Description',
        isActive: true
      })
    })

    const response = await POST(request)
    const responseData = await response.json()
    
    console.log('Response status:', response.status)
    console.log('Response data:', responseData)
    
    expect(response.status).toBe(400)
    expect(responseData.error).toBe('Failed to create queue')
    expect(responseData.details).toBe('Database connection failed')
  })
})
