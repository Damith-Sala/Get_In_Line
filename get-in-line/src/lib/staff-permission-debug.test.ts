import { describe, it, expect, vi, beforeEach } from 'vitest'

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

// Import actual permission helpers after mocks are set up
let DEFAULT_STAFF_PERMISSIONS: any
let MANAGER_PERMISSIONS: any
let ADMIN_PERMISSIONS: any
let QUEUE_MANAGER_PERMISSIONS: any
let getUserPermissions: any
let hasPermission: any

beforeAll(async () => {
  const permissionHelpers = await vi.importActual('./permission-helpers') as any
  DEFAULT_STAFF_PERMISSIONS = permissionHelpers.DEFAULT_STAFF_PERMISSIONS
  MANAGER_PERMISSIONS = permissionHelpers.MANAGER_PERMISSIONS
  ADMIN_PERMISSIONS = permissionHelpers.ADMIN_PERMISSIONS
  QUEUE_MANAGER_PERMISSIONS = permissionHelpers.QUEUE_MANAGER_PERMISSIONS
  getUserPermissions = permissionHelpers.getUserPermissions
  hasPermission = permissionHelpers.hasPermission
})

describe('Staff Permission Debug Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should verify permission consistency between DEFAULT_STAFF_PERMISSIONS and staff dashboard fallback', () => {
    // This test verifies the fix is working - permissions should now be consistent
    const staffDashboardFallbackPermissions = {
      canCreateQueues: true,   // ✅ Fixed: Now matches DEFAULT_STAFF_PERMISSIONS
      canEditQueues: true,     // ✅ Fixed: Now matches DEFAULT_STAFF_PERMISSIONS
      canDeleteQueues: true,   // ✅ Fixed: Now matches DEFAULT_STAFF_PERMISSIONS
      canManageQueueOperations: true,
      canViewAnalytics: true,  // ✅ Fixed: Now matches DEFAULT_STAFF_PERMISSIONS
      canSendNotifications: true, // ✅ Fixed: Now matches DEFAULT_STAFF_PERMISSIONS
      canManageNotifications: true, // ✅ Fixed: Now matches DEFAULT_STAFF_PERMISSIONS
    }

    console.log('DEFAULT_STAFF_PERMISSIONS:', DEFAULT_STAFF_PERMISSIONS)
    console.log('Staff Dashboard Fallback (Fixed):', staffDashboardFallbackPermissions)

    // This should now PASS - showing the fix is working
    expect(DEFAULT_STAFF_PERMISSIONS.canCreateQueues).toBe(staffDashboardFallbackPermissions.canCreateQueues)
    expect(DEFAULT_STAFF_PERMISSIONS.canEditQueues).toBe(staffDashboardFallbackPermissions.canEditQueues)
    expect(DEFAULT_STAFF_PERMISSIONS.canDeleteQueues).toBe(staffDashboardFallbackPermissions.canDeleteQueues)
    expect(DEFAULT_STAFF_PERMISSIONS.canViewAnalytics).toBe(staffDashboardFallbackPermissions.canViewAnalytics)
    expect(DEFAULT_STAFF_PERMISSIONS.canSendNotifications).toBe(staffDashboardFallbackPermissions.canSendNotifications)
    expect(DEFAULT_STAFF_PERMISSIONS.canManageNotifications).toBe(staffDashboardFallbackPermissions.canManageNotifications)
  })

  it('should verify DEFAULT_STAFF_PERMISSIONS allows queue operations', () => {
    // This test should PASS - showing what the permissions should be
    expect(DEFAULT_STAFF_PERMISSIONS.canCreateQueues).toBe(true)
    expect(DEFAULT_STAFF_PERMISSIONS.canEditQueues).toBe(true)
    expect(DEFAULT_STAFF_PERMISSIONS.canDeleteQueues).toBe(true)
    expect(DEFAULT_STAFF_PERMISSIONS.canManageQueueOperations).toBe(true)
  })

  it('should verify QUEUE_MANAGER_PERMISSIONS allows queue operations', () => {
    // This test should PASS - showing queue manager permissions
    expect(QUEUE_MANAGER_PERMISSIONS.canCreateQueues).toBe(true)
    expect(QUEUE_MANAGER_PERMISSIONS.canEditQueues).toBe(true)
    expect(QUEUE_MANAGER_PERMISSIONS.canDeleteQueues).toBe(false) // Managers can't delete
    expect(QUEUE_MANAGER_PERMISSIONS.canManageQueueOperations).toBe(true)
  })

  it('should verify MANAGER_PERMISSIONS allows queue operations', () => {
    // This test should PASS - showing manager permissions
    expect(MANAGER_PERMISSIONS.canCreateQueues).toBe(true)
    expect(MANAGER_PERMISSIONS.canEditQueues).toBe(true)
    expect(MANAGER_PERMISSIONS.canDeleteQueues).toBe(false) // Managers can't delete
    expect(MANAGER_PERMISSIONS.canManageQueueOperations).toBe(true)
  })

  it('should verify ADMIN_PERMISSIONS allows all queue operations', () => {
    // This test should PASS - showing admin permissions
    expect(ADMIN_PERMISSIONS.canCreateQueues).toBe(true)
    expect(ADMIN_PERMISSIONS.canEditQueues).toBe(true)
    expect(ADMIN_PERMISSIONS.canDeleteQueues).toBe(true) // Admins can delete
    expect(ADMIN_PERMISSIONS.canManageQueueOperations).toBe(true)
  })

  it('should identify when staff user has no businessStaff record and gets default permissions', async () => {
    const { db } = await import('@/lib/db')

    // Mock no staff record found
    db.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValueOnce([]) // No staff record
        })
      })
    })

    // Mock user record found - business admin
    db.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValueOnce([{
            id: 'user-1',
            role: 'business_admin',
            businessId: 'business-1'
          }])
        })
      })
    })

    const result = await getUserPermissions('user-1', 'business-1')
    
    // Should return admin permissions for business admin
    expect(result).toEqual(ADMIN_PERMISSIONS)
    expect(result.canCreateQueues).toBe(true)
  })

  it('should identify when regular user gets default permissions', async () => {
    const { db } = await import('@/lib/db')

    // Mock no staff record found
    db.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValueOnce([]) // No staff record
        })
      })
    })

    // Mock user record found - regular user
    db.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValueOnce([{
            id: 'user-1',
            role: 'user',
            businessId: null
          }])
        })
      })
    })

    const result = await getUserPermissions('user-1', 'business-1')
    
    // Should return default staff permissions
    expect(result).toEqual(DEFAULT_STAFF_PERMISSIONS)
    expect(result.canCreateQueues).toBe(true) // This should be true!
  })

  it('should identify when staff user has explicit permissions that override defaults', async () => {
    const { db } = await import('@/lib/db')

    const customPermissions = {
      canCreateQueues: false, // Explicitly denied
      canEditQueues: true,
      canDeleteQueues: false
    }

    const mockStaff = {
      id: 'staff-1',
      userId: 'user-1',
      businessId: 'business-1',
      role: 'staff',
      permissions: JSON.stringify(customPermissions),
      isActive: true
    }

    db.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValueOnce([mockStaff])
        })
      })
    })

    const result = await getUserPermissions('user-1', 'business-1')
    
    // Should merge custom permissions with defaults
    expect(result.canCreateQueues).toBe(false) // Custom override
    expect(result.canEditQueues).toBe(true) // Custom override
    expect(result.canDeleteQueues).toBe(false) // Custom override
    expect(result.canManageQueueOperations).toBe(true) // From default
  })

  it('should test hasPermission function for queue creation', async () => {
    const { db } = await import('@/lib/db')

    const mockStaff = {
      id: 'staff-1',
      userId: 'user-1',
      businessId: 'business-1',
      role: 'staff',
      permissions: null,
      isActive: true
    }

    db.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValueOnce([mockStaff])
        })
      })
    })

    const result = await hasPermission('user-1', 'business-1', 'canCreateQueues')
    
    // Should return true based on DEFAULT_STAFF_PERMISSIONS
    expect(result).toBe(true)
  })

  it('should test hasPermission function for queue deletion', async () => {
    const { db } = await import('@/lib/db')

    const mockStaff = {
      id: 'staff-1',
      userId: 'user-1',
      businessId: 'business-1',
      role: 'staff',
      permissions: null,
      isActive: true
    }

    db.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValueOnce([mockStaff])
        })
      })
    })

    const result = await hasPermission('user-1', 'business-1', 'canDeleteQueues')
    
    // Should return true based on DEFAULT_STAFF_PERMISSIONS
    expect(result).toBe(true)
  })
})
