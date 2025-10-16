import { describe, it, expect, vi, beforeEach } from 'vitest'
import { hasBusinessAccess, getUserBusinessId } from './auth-helpers'

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

describe('auth-helpers', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    // Reset the mock chain
    const { db } = await import('@/lib/db')
    db.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([])
        })
      })
    })
  })

  describe('hasBusinessAccess', () => {
    it('should return true when user is the business owner', async () => {
      const mockUser = {
        id: 'user-1',
        role: 'user',
        businessId: null
      }

      const mockBusiness = {
        id: 'business-1',
        ownerId: 'user-1',
        name: 'Test Business'
      }

      const { db } = await import('@/lib/db')
      
      // Mock user record
      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([mockUser])
          })
        })
      })

      // Mock business record
      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([mockBusiness])
          })
        })
      })

      const result = await hasBusinessAccess('user-1', 'business-1')
      
      expect(result).toBe(true)
    })

    it('should return true when user is a super admin', async () => {
      const mockUser = {
        id: 'user-1',
        role: 'super_admin',
        businessId: null
      }

      const mockBusiness = {
        id: 'business-1',
        ownerId: 'other-user',
        name: 'Test Business'
      }

      const { db } = await import('@/lib/db')
      
      // Mock user record
      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([mockUser])
          })
        })
      })

      // Mock business record
      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([mockBusiness])
          })
        })
      })

      const result = await hasBusinessAccess('user-1', 'business-1')
      
      expect(result).toBe(true)
    })

    it('should return true when user is business admin with matching business ID', async () => {
      const mockUser = {
        id: 'user-1',
        role: 'business_admin',
        businessId: 'business-1'
      }

      const mockBusiness = {
        id: 'business-1',
        ownerId: 'other-user',
        name: 'Test Business'
      }

      const { db } = await import('@/lib/db')
      
      // Mock user record
      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([mockUser])
          })
        })
      })

      // Mock business record
      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([mockBusiness])
          })
        })
      })

      const result = await hasBusinessAccess('user-1', 'business-1')
      
      expect(result).toBe(true)
    })

    it('should return true when user is staff with matching business ID', async () => {
      const mockUser = {
        id: 'user-1',
        role: 'staff',
        businessId: 'business-1'
      }

      const mockBusiness = {
        id: 'business-1',
        ownerId: 'other-user',
        name: 'Test Business'
      }

      const { db } = await import('@/lib/db')
      
      // Mock user record
      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([mockUser])
          })
        })
      })

      // Mock business record
      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([mockBusiness])
          })
        })
      })

      const result = await hasBusinessAccess('user-1', 'business-1')
      
      expect(result).toBe(true)
    })

    it('should return true when user is associated through businessStaff table', async () => {
      const mockUser = {
        id: 'user-1',
        role: 'user',
        businessId: null
      }

      const mockBusiness = {
        id: 'business-1',
        ownerId: 'other-user',
        name: 'Test Business'
      }

      const mockStaffRecord = {
        id: 'staff-1',
        userId: 'user-1',
        businessId: 'business-1',
        isActive: true
      }

      const { db } = await import('@/lib/db')
      
      // Mock user record
      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([mockUser])
          })
        })
      })

      // Mock business record
      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([mockBusiness])
          })
        })
      })

      // Mock staff record
      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([mockStaffRecord])
          })
        })
      })

      const result = await hasBusinessAccess('user-1', 'business-1')
      
      expect(result).toBe(true)
    })

    it('should return false when user has no access to business', async () => {
      const mockUser = {
        id: 'user-1',
        role: 'user',
        businessId: 'business-2'
      }

      const mockBusiness = {
        id: 'business-1',
        ownerId: 'other-user',
        name: 'Test Business'
      }

      const { db } = await import('@/lib/db')
      
      // Mock user record
      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([mockUser])
          })
        })
      })

      // Mock business record
      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([mockBusiness])
          })
        })
      })

      // Mock no staff record
      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([])
          })
        })
      })

      const result = await hasBusinessAccess('user-1', 'business-1')
      
      expect(result).toBe(false)
    })

    it('should return false when user not found', async () => {
      const mockBusiness = {
        id: 'business-1',
        ownerId: 'other-user',
        name: 'Test Business'
      }

      const { db } = await import('@/lib/db')
      
      // Mock no user record
      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([])
          })
        })
      })

      // Mock business record
      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([mockBusiness])
          })
        })
      })

      const result = await hasBusinessAccess('user-1', 'business-1')
      
      expect(result).toBe(false)
    })

    it('should return false when business not found', async () => {
      const mockUser = {
        id: 'user-1',
        role: 'user',
        businessId: null
      }

      const { db } = await import('@/lib/db')
      
      // Mock user record
      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([mockUser])
          })
        })
      })

      // Mock no business record
      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([])
          })
        })
      })

      const result = await hasBusinessAccess('user-1', 'business-1')
      
      expect(result).toBe(false)
    })

    it('should return false on database error', async () => {
      const { db } = await import('@/lib/db')
      
      db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockRejectedValue(new Error('Database error'))
          })
        })
      })

      const result = await hasBusinessAccess('user-1', 'business-1')
      
      expect(result).toBe(false)
    })
  })

  describe('getUserBusinessId', () => {
    it('should return business ID from users table', async () => {
      const mockUser = {
        id: 'user-1',
        role: 'business_admin',
        businessId: 'business-1'
      }

      const { db } = await import('@/lib/db')
      
      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([mockUser])
          })
        })
      })

      const result = await getUserBusinessId('user-1')
      
      expect(result).toBe('business-1')
    })

    it('should return business ID from businessStaff table when not in users table', async () => {
      const mockUser = {
        id: 'user-1',
        role: 'user',
        businessId: null
      }

      const mockStaffRecord = {
        id: 'staff-1',
        userId: 'user-1',
        businessId: 'business-1',
        isActive: true
      }

      const { db } = await import('@/lib/db')
      
      // Mock user record with no businessId
      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([mockUser])
          })
        })
      })

      // Mock staff record
      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([mockStaffRecord])
          })
        })
      })

      const result = await getUserBusinessId('user-1')
      
      expect(result).toBe('business-1')
    })

    it('should return null when user has no business association', async () => {
      const mockUser = {
        id: 'user-1',
        role: 'user',
        businessId: null
      }

      const { db } = await import('@/lib/db')
      
      // Mock user record with no businessId
      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([mockUser])
          })
        })
      })

      // Mock no staff record
      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([])
          })
        })
      })

      const result = await getUserBusinessId('user-1')
      
      expect(result).toBe(null)
    })

    it('should return null when user not found', async () => {
      const { db } = await import('@/lib/db')
      
      // Mock no user record
      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([])
          })
        })
      })

      // Mock no staff record
      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([])
          })
        })
      })

      const result = await getUserBusinessId('user-1')
      
      expect(result).toBe(null)
    })

    it('should return null on database error', async () => {
      const { db } = await import('@/lib/db')
      
      db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockRejectedValue(new Error('Database error'))
          })
        })
      })

      const result = await getUserBusinessId('user-1')
      
      expect(result).toBe(null)
    })

    it('should prioritize users table over businessStaff table', async () => {
      const mockUser = {
        id: 'user-1',
        role: 'business_admin',
        businessId: 'business-from-users'
      }

      const mockStaffRecord = {
        id: 'staff-1',
        userId: 'user-1',
        businessId: 'business-from-staff',
        isActive: true
      }

      const { db } = await import('@/lib/db')
      
      // Mock user record
      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([mockUser])
          })
        })
      })

      // Mock staff record (should not be called)
      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([mockStaffRecord])
          })
        })
      })

      const result = await getUserBusinessId('user-1')
      
      expect(result).toBe('business-from-users')
    })
  })
})