import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getUserBusinessId, hasBusinessAccess } from './auth-helpers'

// Mock database
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
  }
}))

// Mock drizzle-orm
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((field, value) => ({ field, value, type: 'eq' })),
  and: vi.fn((...conditions) => ({ conditions, type: 'and' }))
}))

describe('Business Association Debug Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should identify when staff user has businessId in users table', async () => {
    const { db } = await import('@/lib/db')
    
    // Mock staff user WITH businessId in users table
    db.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValueOnce([{
            id: 'staff-user-1',
            role: 'staff',
            businessId: 'business-1'  // ✅ This is correct!
          }])
        })
      })
    })

    const businessId = await getUserBusinessId('staff-user-1')
    
    expect(businessId).toBe('business-1')
  })

  it('should identify when staff user has NO businessId in users table but has businessStaff record', async () => {
    const { db } = await import('@/lib/db')
    
    // Mock staff user with NO businessId in users table
    db.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValueOnce([{
            id: 'staff-user-1',
            role: 'staff',
            businessId: null  // ❌ Missing in users table
          }])
        })
      })
    })

    // Mock businessStaff table lookup - HAS RECORD
    db.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValueOnce([{
            userId: 'staff-user-1',
            businessId: 'business-1',
            isActive: true
          }])
        })
      })
    })

    const businessId = await getUserBusinessId('staff-user-1')
    
    // This should work because it falls back to businessStaff table
    expect(businessId).toBe('business-1')
  })

  it('should identify when staff user has NO business association at all', async () => {
    const { db } = await import('@/lib/db')
    
    // Mock staff user with NO businessId in users table
    db.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValueOnce([{
            id: 'staff-user-1',
            role: 'staff',
            businessId: null
          }])
        })
      })
    })

    // Mock businessStaff table lookup - NO RECORD FOUND
    db.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValueOnce([]) // ❌ No staff record!
        })
      })
    })

    const businessId = await getUserBusinessId('staff-user-1')
    
    // This will be null - causing queue creation to fail
    expect(businessId).toBeNull()
  })

  it('should identify when staff user is not found in users table', async () => {
    const { db } = await import('@/lib/db')
    
    // Mock user not found in users table
    db.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValueOnce([]) // ❌ User not found!
        })
      })
    })

    // Mock businessStaff table lookup - NO RECORD FOUND
    db.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValueOnce([])
        })
      })
    })

    const businessId = await getUserBusinessId('staff-user-1')
    
    expect(businessId).toBeNull()
  })

  it('should identify when businessStaff record exists but is inactive', async () => {
    const { db } = await import('@/lib/db')
    
    // Mock staff user with NO businessId in users table
    db.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValueOnce([{
            id: 'staff-user-1',
            role: 'staff',
            businessId: null
          }])
        })
      })
    })

    // Mock businessStaff table lookup - INACTIVE RECORD
    db.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValueOnce([{
            userId: 'staff-user-1',
            businessId: 'business-1',
            isActive: false  // ❌ Inactive record!
          }])
        })
      })
    })

    const businessId = await getUserBusinessId('staff-user-1')
    
    // This should still work because the query filters for isActive: true
    // But if the record is inactive, it won't be returned
    expect(businessId).toBeNull()
  })

  it('should test hasBusinessAccess for staff user with proper setup', async () => {
    const { db } = await import('@/lib/db')
    
    // Mock user record
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

    // Mock business record
    db.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValueOnce([{
            id: 'business-1',
            ownerId: 'owner-1',
            name: 'Test Business'
          }])
        })
      })
    })

    const hasAccess = await hasBusinessAccess('staff-user-1', 'business-1')
    
    expect(hasAccess).toBe(true)
  })

  it('should test hasBusinessAccess for staff user with businessStaff record', async () => {
    const { db } = await import('@/lib/db')
    
    // Mock user record - no direct business access
    db.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValueOnce([{
            id: 'staff-user-1',
            role: 'staff',
            businessId: null
          }])
        })
      })
    })

    // Mock business record
    db.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValueOnce([{
            id: 'business-1',
            ownerId: 'owner-1',
            name: 'Test Business'
          }])
        })
      })
    })

    // Mock businessStaff record lookup
    db.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValueOnce([{
            userId: 'staff-user-1',
            businessId: 'business-1',
            isActive: true
          }])
        })
      })
    })

    const hasAccess = await hasBusinessAccess('staff-user-1', 'business-1')
    
    expect(hasAccess).toBe(true)
  })

  it('should test hasBusinessAccess for staff user with NO access', async () => {
    const { db } = await import('@/lib/db')
    
    // Mock user record - no business access
    db.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValueOnce([{
            id: 'staff-user-1',
            role: 'staff',
            businessId: null
          }])
        })
      })
    })

    // Mock business record
    db.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValueOnce([{
            id: 'business-1',
            ownerId: 'owner-1',
            name: 'Test Business'
          }])
        })
      })
    })

    // Mock businessStaff record lookup - NO RECORD
    db.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValueOnce([]) // No staff record
        })
      })
    })

    const hasAccess = await hasBusinessAccess('staff-user-1', 'business-1')
    
    expect(hasAccess).toBe(false)
  })

  it('should identify database errors in getUserBusinessId', async () => {
    const { db } = await import('@/lib/db')
    
    // Mock database error
    db.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockRejectedValue(new Error('Database connection failed'))
        })
      })
    })

    const businessId = await getUserBusinessId('staff-user-1')
    
    // Should return null on error
    expect(businessId).toBeNull()
  })

  it('should identify database errors in hasBusinessAccess', async () => {
    const { db } = await import('@/lib/db')
    
    // Mock database error
    db.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockRejectedValue(new Error('Database connection failed'))
        })
      })
    })

    const hasAccess = await hasBusinessAccess('staff-user-1', 'business-1')
    
    // Should return false on error
    expect(hasAccess).toBe(false)
  })
})
