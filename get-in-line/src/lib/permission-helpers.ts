import { db } from '@/lib/db';
import { businessStaff, users } from '@/lib/drizzle/schema';
import { eq, and } from 'drizzle-orm';

export interface StaffPermissions {
  // Queue Management
  canCreateQueues: boolean;
  canEditQueues: boolean;
  canDeleteQueues: boolean;
  canManageQueueOperations: boolean; // call next, open/close
  
  // Staff Management
  canManageStaff: boolean;
  canViewStaff: boolean;
  
  // Analytics & Reports
  canViewAnalytics: boolean;
  canExportData: boolean;
  
  // Business Settings
  canEditBusinessSettings: boolean;
  canManageBranches: boolean;
  
  // Notifications
  canSendNotifications: boolean;
  canManageNotifications: boolean;
}

export const DEFAULT_STAFF_PERMISSIONS: StaffPermissions = {
  canCreateQueues: true,
  canEditQueues: true,
  canDeleteQueues: true,
  canManageQueueOperations: true, // Staff can manage operations
  canManageStaff: false,
  canViewStaff: true,
  canViewAnalytics: true,
  canExportData: false,
  canEditBusinessSettings: false,
  canManageBranches: false,
  canSendNotifications: true,
  canManageNotifications: true,
};

export const MANAGER_PERMISSIONS: StaffPermissions = {
  canCreateQueues: true,
  canEditQueues: true,
  canDeleteQueues: false,
  canManageQueueOperations: true,
  canManageStaff: false,
  canViewStaff: true,
  canViewAnalytics: true,
  canExportData: true,
  canEditBusinessSettings: false,
  canManageBranches: true,
  canSendNotifications: true,
  canManageNotifications: true,
};

export const ADMIN_PERMISSIONS: StaffPermissions = {
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
};

export const QUEUE_MANAGER_PERMISSIONS: StaffPermissions = {
  canCreateQueues: true,
  canEditQueues: true,
  canDeleteQueues: false,
  canManageQueueOperations: true,
  canManageStaff: false,
  canViewStaff: true,
  canViewAnalytics: false,
  canExportData: false,
  canEditBusinessSettings: false,
  canManageBranches: false,
  canSendNotifications: false,
  canManageNotifications: false,
};

/**
 * Get user's permissions for a specific business
 * @param userId - The user's ID
 * @param businessId - The business ID to check permissions for
 * @returns Promise<StaffPermissions> - User's permissions for the business
 */
export async function getUserPermissions(userId: string, businessId: string): Promise<StaffPermissions> {
  try {
    // Get user's staff record with permissions
    const staffRecord = await db
      .select()
      .from(businessStaff)
      .where(and(
        eq(businessStaff.userId, userId),
        eq(businessStaff.businessId, businessId),
        eq(businessStaff.isActive, true)
      ))
      .limit(1);

    if (staffRecord.length === 0) {
      // If no staff record found, check if user is a business admin
      const userRecord = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (userRecord.length > 0 && userRecord[0].role === 'business_admin') {
        return ADMIN_PERMISSIONS;
      }
      
      // Default staff permissions for users without explicit staff records
      // Only give basic permissions - Business Admin must explicitly grant queue management
      return DEFAULT_STAFF_PERMISSIONS;
    }

    const staff = staffRecord[0];
    
    // Parse permissions from JSON
    let permissions: StaffPermissions;
    try {
      permissions = staff.permissions ? JSON.parse(staff.permissions) : DEFAULT_STAFF_PERMISSIONS;
    } catch {
      permissions = DEFAULT_STAFF_PERMISSIONS;
    }

    // Apply role-based defaults
    switch (staff.role) {
      case 'admin':
        return { ...ADMIN_PERMISSIONS, ...permissions };
      case 'manager':
        return { ...MANAGER_PERMISSIONS, ...permissions };
      default:
        return { ...DEFAULT_STAFF_PERMISSIONS, ...permissions };
    }
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return DEFAULT_STAFF_PERMISSIONS;
  }
}

/**
 * Check if a user has a specific permission for a business
 * @param userId - The user's ID
 * @param businessId - The business ID to check permissions for
 * @param permission - The permission to check
 * @returns Promise<boolean> - True if user has the permission, false otherwise
 */
export async function hasPermission(
  userId: string, 
  businessId: string, 
  permission: keyof StaffPermissions
): Promise<boolean> {
  try {
    const permissions = await getUserPermissions(userId, businessId);
    return permissions[permission];
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Check if user is business owner or admin
 * @param userId - The user's ID
 * @param businessId - The business ID to check
 * @returns Promise<boolean> - True if user is owner/admin, false otherwise
 */
export async function isBusinessOwnerOrAdmin(userId: string, businessId: string): Promise<boolean> {
  try {
    // Get user record
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userRecord.length === 0) {
      return false;
    }

    const user = userRecord[0];

    // Check if user is super admin
    if (user.role === 'super_admin') {
      return true;
    }

    // Check if user is business admin with access to this business
    if (user.role === 'business_admin' && user.businessId === businessId) {
      return true;
    }

    // Check if user is business owner (this would need to be checked against businesses table)
    // For now, we'll assume business admins are owners
    return false;
  } catch (error) {
    console.error('Error checking business owner/admin status:', error);
    return false;
  }
}

/**
 * Get role-based default permissions
 * @param role - The staff role
 * @returns StaffPermissions - Default permissions for the role
 */
export function getDefaultPermissionsForRole(role: string): StaffPermissions {
  switch (role) {
    case 'admin':
      return ADMIN_PERMISSIONS;
    case 'manager':
      return MANAGER_PERMISSIONS;
    default:
      return DEFAULT_STAFF_PERMISSIONS;
  }
}
