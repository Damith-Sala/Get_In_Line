import { describe, it, expect, vi, beforeEach } from 'vitest'
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
        data: { user: { id: 'staff-user-1', email: 'staff@test.com' } },
        error: null
      }),
    },
  })),
}))

// Mock auth helpers
vi.mock('@/lib/auth-helpers', () => ({
  getUserBusinessId: vi.fn(),
}))

// Mock permission helpers - but allow access to constants
vi.mock('@/lib/permission-helpers', async () => {
  const actual = await vi.importActual('@/lib/permission-helpers')
  return {
    ...actual,
    getUserPermissions: vi.fn(),
    hasPermission: vi.fn(),
  }
})

describe('User Permissions API Debug Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

    const response = await GET()
    const responseData = await response.json()
    
    console.log('Response status:', response.status)
    console.log('Response data:', responseData)
    
    expect(response.status).toBe(401)
    expect(responseData.error).toBe('Not authenticated')
  })

  it('should identify when getUserBusinessId returns null', async () => {
    const { getUserBusinessId } = await import('@/lib/auth-helpers')
    
    // Mock getUserBusinessId returning null
    vi.mocked(getUserBusinessId).mockResolvedValueOnce(null)

    const response = await GET()
    const responseData = await response.json()
    
    console.log('Response status:', response.status)
    console.log('Response data:', responseData)
    
    expect(response.status).toBe(403)
    expect(responseData.error).toBe('No business associated with your account')
  })

  it('should identify when getUserBusinessId throws error', async () => {
    const { getUserBusinessId } = await import('@/lib/auth-helpers')
    
    // Mock getUserBusinessId throwing error
    vi.mocked(getUserBusinessId).mockRejectedValueOnce(new Error('Database connection failed'))

    const response = await GET()
    const responseData = await response.json()
    
    console.log('Response status:', response.status)
    console.log('Response data:', responseData)
    
    expect(response.status).toBe(500)
    expect(responseData.error).toBe('Failed to fetch permissions')
  })

  it('should identify when getUserPermissions fails', async () => {
    const { getUserBusinessId } = await import('@/lib/auth-helpers')
    const { getUserPermissions } = await import('@/lib/permission-helpers')
    
    // Mock getUserBusinessId returning business ID
    vi.mocked(getUserBusinessId).mockResolvedValueOnce('business-1')
    
    // Mock getUserPermissions throwing error
    vi.mocked(getUserPermissions).mockRejectedValueOnce(new Error('Permission check failed'))

    const response = await GET()
    const responseData = await response.json()
    
    console.log('Response status:', response.status)
    console.log('Response data:', responseData)
    
    expect(response.status).toBe(500)
    expect(responseData.error).toBe('Failed to fetch permissions')
  })

  it('should return permissions when everything works for staff user', async () => {
    const { getUserBusinessId } = await import('@/lib/auth-helpers')
    const { getUserPermissions } = await import('@/lib/permission-helpers')
    
    // Mock successful business ID lookup
    vi.mocked(getUserBusinessId).mockResolvedValueOnce('business-1')
    
    // Mock successful permissions lookup - DEFAULT_STAFF_PERMISSIONS
    vi.mocked(getUserPermissions).mockResolvedValueOnce({
      canCreateQueues: true,
      canEditQueues: true,
      canDeleteQueues: true,
      canManageQueueOperations: true,
      canManageStaff: false,
      canViewStaff: true,
      canViewAnalytics: true,
      canExportData: false,
      canEditBusinessSettings: false,
      canManageBranches: false,
      canSendNotifications: true,
      canManageNotifications: true,
    })

    const response = await GET()
    const responseData = await response.json()
    
    console.log('Response status:', response.status)
    console.log('Response data:', responseData)
    
    expect(response.status).toBe(200)
    expect(responseData.permissions.canCreateQueues).toBe(true)
    expect(responseData.permissions.canEditQueues).toBe(true)
    expect(responseData.permissions.canDeleteQueues).toBe(true)
    expect(responseData.businessId).toBe('business-1')
    expect(responseData.userId).toBe('staff-user-1')
  })

  it('should return permissions when everything works for business admin', async () => {
    const { getUserBusinessId } = await import('@/lib/auth-helpers')
    const { getUserPermissions } = await import('@/lib/permission-helpers')
    
    // Mock successful business ID lookup
    vi.mocked(getUserBusinessId).mockResolvedValueOnce('business-1')
    
    // Mock successful permissions lookup - ADMIN_PERMISSIONS
    vi.mocked(getUserPermissions).mockResolvedValueOnce({
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
    })

    const response = await GET()
    const responseData = await response.json()
    
    console.log('Response status:', response.status)
    console.log('Response data:', responseData)
    
    expect(response.status).toBe(200)
    expect(responseData.permissions.canCreateQueues).toBe(true)
    expect(responseData.permissions.canManageStaff).toBe(true)
    expect(responseData.permissions.canEditBusinessSettings).toBe(true)
    expect(responseData.businessId).toBe('business-1')
  })

  it('should return permissions when everything works for manager', async () => {
    const { getUserBusinessId } = await import('@/lib/auth-helpers')
    const { getUserPermissions } = await import('@/lib/permission-helpers')
    
    // Mock successful business ID lookup
    vi.mocked(getUserBusinessId).mockResolvedValueOnce('business-1')
    
    // Mock successful permissions lookup - MANAGER_PERMISSIONS
    vi.mocked(getUserPermissions).mockResolvedValueOnce({
      canCreateQueues: true,
      canEditQueues: true,
      canDeleteQueues: false, // Managers can't delete
      canManageQueueOperations: true,
      canManageStaff: false,
      canViewStaff: true,
      canViewAnalytics: true,
      canExportData: true,
      canEditBusinessSettings: false,
      canManageBranches: true,
      canSendNotifications: true,
      canManageNotifications: true,
    })

    const response = await GET()
    const responseData = await response.json()
    
    console.log('Response status:', response.status)
    console.log('Response data:', responseData)
    
    expect(response.status).toBe(200)
    expect(responseData.permissions.canCreateQueues).toBe(true)
    expect(responseData.permissions.canEditQueues).toBe(true)
    expect(responseData.permissions.canDeleteQueues).toBe(false)
    expect(responseData.permissions.canManageBranches).toBe(true)
    expect(responseData.businessId).toBe('business-1')
  })

  it('should return permissions when everything works for queue manager', async () => {
    const { getUserBusinessId } = await import('@/lib/auth-helpers')
    const { getUserPermissions } = await import('@/lib/permission-helpers')
    
    // Mock successful business ID lookup
    vi.mocked(getUserBusinessId).mockResolvedValueOnce('business-1')
    
    // Mock successful permissions lookup - QUEUE_MANAGER_PERMISSIONS
    vi.mocked(getUserPermissions).mockResolvedValueOnce({
      canCreateQueues: true,
      canEditQueues: true,
      canDeleteQueues: false, // Queue managers can't delete
      canManageQueueOperations: true,
      canManageStaff: false,
      canViewStaff: true,
      canViewAnalytics: false, // Queue managers can't view analytics
      canExportData: false,
      canEditBusinessSettings: false,
      canManageBranches: false,
      canSendNotifications: false,
      canManageNotifications: false,
    })

    const response = await GET()
    const responseData = await response.json()
    
    console.log('Response status:', response.status)
    console.log('Response data:', responseData)
    
    expect(response.status).toBe(200)
    expect(responseData.permissions.canCreateQueues).toBe(true)
    expect(responseData.permissions.canEditQueues).toBe(true)
    expect(responseData.permissions.canDeleteQueues).toBe(false)
    expect(responseData.permissions.canViewAnalytics).toBe(false)
    expect(responseData.businessId).toBe('business-1')
  })

  it('should identify when staff user has restricted permissions', async () => {
    const { getUserBusinessId } = await import('@/lib/auth-helpers')
    const { getUserPermissions } = await import('@/lib/permission-helpers')
    
    // Mock successful business ID lookup
    vi.mocked(getUserBusinessId).mockResolvedValueOnce('business-1')
    
    // Mock restricted permissions (custom permissions that override defaults)
    vi.mocked(getUserPermissions).mockResolvedValueOnce({
      canCreateQueues: false, // Explicitly denied
      canEditQueues: true,
      canDeleteQueues: false,
      canManageQueueOperations: true,
      canManageStaff: false,
      canViewStaff: true,
      canViewAnalytics: false,
      canExportData: false,
      canEditBusinessSettings: false,
      canManageBranches: false,
      canSendNotifications: true,
      canManageNotifications: false,
    })

    const response = await GET()
    const responseData = await response.json()
    
    console.log('Response status:', response.status)
    console.log('Response data:', responseData)
    
    expect(response.status).toBe(200)
    expect(responseData.permissions.canCreateQueues).toBe(false) // This would cause queue creation to fail
    expect(responseData.permissions.canEditQueues).toBe(true)
    expect(responseData.permissions.canDeleteQueues).toBe(false)
    expect(responseData.businessId).toBe('business-1')
  })

  it('should identify authentication errors', async () => {
    const { createServerClient } = await import('@supabase/ssr')
    
    // Mock authentication error
    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Invalid session' }
        }),
      },
    } as any)

    const response = await GET()
    const responseData = await response.json()
    
    console.log('Response status:', response.status)
    console.log('Response data:', responseData)
    
    expect(response.status).toBe(401)
    expect(responseData.error).toBe('Not authenticated')
  })

  it('should handle unexpected errors gracefully', async () => {
    const { getUserBusinessId } = await import('@/lib/auth-helpers')
    
    // Mock getUserBusinessId throwing unexpected error
    vi.mocked(getUserBusinessId).mockRejectedValueOnce(new Error('Unexpected database error'))

    const response = await GET()
    const responseData = await response.json()
    
    console.log('Response status:', response.status)
    console.log('Response data:', responseData)
    
    expect(response.status).toBe(500)
    expect(responseData.error).toBe('Failed to fetch permissions')
  })
})
