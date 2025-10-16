import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  getUserPermissions, 
  hasPermission, 
  isBusinessOwnerOrAdmin, 
  getDefaultPermissionsForRole,
  DEFAULT_STAFF_PERMISSIONS,
  MANAGER_PERMISSIONS,
  ADMIN_PERMISSIONS,
  QUEUE_MANAGER_PERMISSIONS,
  type StaffPermissions
} from './permission-helpers'

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

describe('permission-helpers', () => {
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

  describe('getUserPermissions', () => {
    it('should return admin permissions for business admin users', async () => {
      const mockUser = {
        id: 'user-1',
        role: 'business_admin',
        businessId: 'business-1'
      }

      const { db } = await import('@/lib/db')

      // Mock no staff record found
      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([]) // No staff record
          })
        })
      })

      // Mock user record found
      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([mockUser])
          })
        })
      })

      const result = await getUserPermissions('user-1', 'business-1')
      
      expect(result).toEqual(ADMIN_PERMISSIONS)
    })

    it('should return default permissions for users without staff records', async () => {
      const mockUser = {
        id: 'user-1',
        role: 'user',
        businessId: null
      }

      const { db } = await import('@/lib/db')

      // Mock no staff record found
      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([]) // No staff record
          })
        })
      })

      // Mock user record found
      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([mockUser])
          })
        })
      })

      const result = await getUserPermissions('user-1', 'business-1')
      
      expect(result).toEqual(DEFAULT_STAFF_PERMISSIONS)
    })

    it('should return admin permissions for staff with admin role', async () => {
      const mockStaff = {
        id: 'staff-1',
        userId: 'user-1',
        businessId: 'business-1',
        role: 'admin',
        permissions: null,
        isActive: true
      }

      const { db } = await import('@/lib/db')

      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([mockStaff])
          })
        })
      })

      const result = await getUserPermissions('user-1', 'business-1')
      
      expect(result).toEqual(ADMIN_PERMISSIONS)
    })

    it('should return manager permissions for staff with manager role', async () => {
      const mockStaff = {
        id: 'staff-1',
        userId: 'user-1',
        businessId: 'business-1',
        role: 'manager',
        permissions: null,
        isActive: true
      }

      const { db } = await import('@/lib/db')

      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([mockStaff])
          })
        })
      })

      const result = await getUserPermissions('user-1', 'business-1')
      
      expect(result).toEqual(MANAGER_PERMISSIONS)
    })

    it('should merge custom permissions with role defaults', async () => {
      const customPermissions = {
        canCreateQueues: false,
        canDeleteQueues: true
      }

      const mockStaff = {
        id: 'staff-1',
        userId: 'user-1',
        businessId: 'business-1',
        role: 'admin',
        permissions: JSON.stringify(customPermissions),
        isActive: true
      }

      const { db } = await import('@/lib/db')

      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([mockStaff])
          })
        })
      })

      const result = await getUserPermissions('user-1', 'business-1')
      
      expect(result.canCreateQueues).toBe(false) // Custom override
      expect(result.canDeleteQueues).toBe(true) // Custom override
      expect(result.canManageStaff).toBe(true) // From admin defaults
    })

    it('should handle invalid JSON permissions gracefully', async () => {
      const mockStaff = {
        id: 'staff-1',
        userId: 'user-1',
        businessId: 'business-1',
        role: 'staff',
        permissions: 'invalid-json',
        isActive: true
      }

      const { db } = await import('@/lib/db')

      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([mockStaff])
          })
        })
      })

      const result = await getUserPermissions('user-1', 'business-1')
      
      expect(result).toEqual(DEFAULT_STAFF_PERMISSIONS)
    })

    it('should return default permissions on database error', async () => {
      const { db } = await import('@/lib/db')

      db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockRejectedValue(new Error('Database error'))
          })
        })
      })

      const result = await getUserPermissions('user-1', 'business-1')
      
      expect(result).toEqual(DEFAULT_STAFF_PERMISSIONS)
    })
  })

  describe('hasPermission', () => {
    it('should return true when user has the permission', async () => {
      const mockStaff = {
        id: 'staff-1',
        userId: 'user-1',
        businessId: 'business-1',
        role: 'admin',
        permissions: null,
        isActive: true
      }

      const { db } = await import('@/lib/db')

      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([mockStaff])
          })
        })
      })

      const result = await hasPermission('user-1', 'business-1', 'canManageStaff')
      
      expect(result).toBe(true)
    })

    it('should return false when user does not have the permission', async () => {
      const mockStaff = {
        id: 'staff-1',
        userId: 'user-1',
        businessId: 'business-1',
        role: 'staff',
        permissions: null,
        isActive: true
      }

      const { db } = await import('@/lib/db')

      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([mockStaff])
          })
        })
      })

      const result = await hasPermission('user-1', 'business-1', 'canManageStaff')
      
      expect(result).toBe(false)
    })

    it('should return false on error', async () => {
      const { db } = await import('@/lib/db')

      db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockRejectedValue(new Error('Database error'))
          })
        })
      })

      const result = await hasPermission('user-1', 'business-1', 'canManageStaff')
      
      expect(result).toBe(false)
    })
  })

  describe('isBusinessOwnerOrAdmin', () => {
    it('should return true for super admin users', async () => {
      const mockUser = {
        id: 'user-1',
        role: 'super_admin',
        businessId: null
      }

      const { db } = await import('@/lib/db')

      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([mockUser])
          })
        })
      })

      const result = await isBusinessOwnerOrAdmin('user-1', 'business-1')
      
      expect(result).toBe(true)
    })

    it('should return true for business admin with matching business ID', async () => {
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

      const result = await isBusinessOwnerOrAdmin('user-1', 'business-1')
      
      expect(result).toBe(true)
    })

    it('should return false for business admin with different business ID', async () => {
      const mockUser = {
        id: 'user-1',
        role: 'business_admin',
        businessId: 'business-2'
      }

      const { db } = await import('@/lib/db')

      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([mockUser])
          })
        })
      })

      const result = await isBusinessOwnerOrAdmin('user-1', 'business-1')
      
      expect(result).toBe(false)
    })

    it('should return false for regular users', async () => {
      const mockUser = {
        id: 'user-1',
        role: 'user',
        businessId: null
      }

      const { db } = await import('@/lib/db')

      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([mockUser])
          })
        })
      })

      const result = await isBusinessOwnerOrAdmin('user-1', 'business-1')
      
      expect(result).toBe(false)
    })

    it('should return false when user not found', async () => {
      const { db } = await import('@/lib/db')

      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([])
          })
        })
      })

      const result = await isBusinessOwnerOrAdmin('user-1', 'business-1')
      
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

      const result = await isBusinessOwnerOrAdmin('user-1', 'business-1')
      
      expect(result).toBe(false)
    })
  })

  describe('getDefaultPermissionsForRole', () => {
    it('should return admin permissions for admin role', () => {
      const result = getDefaultPermissionsForRole('admin')
      expect(result).toEqual(ADMIN_PERMISSIONS)
    })

    it('should return manager permissions for manager role', () => {
      const result = getDefaultPermissionsForRole('manager')
      expect(result).toEqual(MANAGER_PERMISSIONS)
    })

    it('should return default staff permissions for unknown role', () => {
      const result = getDefaultPermissionsForRole('unknown')
      expect(result).toEqual(DEFAULT_STAFF_PERMISSIONS)
    })

    it('should return default staff permissions for staff role', () => {
      const result = getDefaultPermissionsForRole('staff')
      expect(result).toEqual(DEFAULT_STAFF_PERMISSIONS)
    })
  })

  describe('Permission constants', () => {
    it('should have correct default staff permissions', () => {
      expect(DEFAULT_STAFF_PERMISSIONS.canCreateQueues).toBe(true)
      expect(DEFAULT_STAFF_PERMISSIONS.canEditQueues).toBe(true)
      expect(DEFAULT_STAFF_PERMISSIONS.canDeleteQueues).toBe(true)
      expect(DEFAULT_STAFF_PERMISSIONS.canManageQueueOperations).toBe(true)
      expect(DEFAULT_STAFF_PERMISSIONS.canManageStaff).toBe(false)
      expect(DEFAULT_STAFF_PERMISSIONS.canViewStaff).toBe(true)
      expect(DEFAULT_STAFF_PERMISSIONS.canViewAnalytics).toBe(true)
      expect(DEFAULT_STAFF_PERMISSIONS.canExportData).toBe(false)
      expect(DEFAULT_STAFF_PERMISSIONS.canEditBusinessSettings).toBe(false)
      expect(DEFAULT_STAFF_PERMISSIONS.canManageBranches).toBe(false)
      expect(DEFAULT_STAFF_PERMISSIONS.canSendNotifications).toBe(true)
      expect(DEFAULT_STAFF_PERMISSIONS.canManageNotifications).toBe(true)
    })

    it('should have correct manager permissions', () => {
      expect(MANAGER_PERMISSIONS.canCreateQueues).toBe(true)
      expect(MANAGER_PERMISSIONS.canEditQueues).toBe(true)
      expect(MANAGER_PERMISSIONS.canDeleteQueues).toBe(false)
      expect(MANAGER_PERMISSIONS.canManageQueueOperations).toBe(true)
      expect(MANAGER_PERMISSIONS.canManageStaff).toBe(false)
      expect(MANAGER_PERMISSIONS.canViewStaff).toBe(true)
      expect(MANAGER_PERMISSIONS.canViewAnalytics).toBe(true)
      expect(MANAGER_PERMISSIONS.canExportData).toBe(true)
      expect(MANAGER_PERMISSIONS.canEditBusinessSettings).toBe(false)
      expect(MANAGER_PERMISSIONS.canManageBranches).toBe(true)
      expect(MANAGER_PERMISSIONS.canSendNotifications).toBe(true)
      expect(MANAGER_PERMISSIONS.canManageNotifications).toBe(true)
    })

    it('should have correct admin permissions', () => {
      expect(ADMIN_PERMISSIONS.canCreateQueues).toBe(true)
      expect(ADMIN_PERMISSIONS.canEditQueues).toBe(true)
      expect(ADMIN_PERMISSIONS.canDeleteQueues).toBe(true)
      expect(ADMIN_PERMISSIONS.canManageQueueOperations).toBe(true)
      expect(ADMIN_PERMISSIONS.canManageStaff).toBe(true)
      expect(ADMIN_PERMISSIONS.canViewStaff).toBe(true)
      expect(ADMIN_PERMISSIONS.canViewAnalytics).toBe(true)
      expect(ADMIN_PERMISSIONS.canExportData).toBe(true)
      expect(ADMIN_PERMISSIONS.canEditBusinessSettings).toBe(true)
      expect(ADMIN_PERMISSIONS.canManageBranches).toBe(true)
      expect(ADMIN_PERMISSIONS.canSendNotifications).toBe(true)
      expect(ADMIN_PERMISSIONS.canManageNotifications).toBe(true)
    })

    it('should have correct queue manager permissions', () => {
      expect(QUEUE_MANAGER_PERMISSIONS.canCreateQueues).toBe(true)
      expect(QUEUE_MANAGER_PERMISSIONS.canEditQueues).toBe(true)
      expect(QUEUE_MANAGER_PERMISSIONS.canDeleteQueues).toBe(false)
      expect(QUEUE_MANAGER_PERMISSIONS.canManageQueueOperations).toBe(true)
      expect(QUEUE_MANAGER_PERMISSIONS.canManageStaff).toBe(false)
      expect(QUEUE_MANAGER_PERMISSIONS.canViewStaff).toBe(true)
      expect(QUEUE_MANAGER_PERMISSIONS.canViewAnalytics).toBe(false)
      expect(QUEUE_MANAGER_PERMISSIONS.canExportData).toBe(false)
      expect(QUEUE_MANAGER_PERMISSIONS.canEditBusinessSettings).toBe(false)
      expect(QUEUE_MANAGER_PERMISSIONS.canManageBranches).toBe(false)
      expect(QUEUE_MANAGER_PERMISSIONS.canSendNotifications).toBe(false)
      expect(QUEUE_MANAGER_PERMISSIONS.canManageNotifications).toBe(false)
    })
  })
})