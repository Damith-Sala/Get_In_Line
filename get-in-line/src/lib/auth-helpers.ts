import { db } from '@/lib/db';
import { businesses, users, businessStaff } from '@/lib/drizzle/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Check if a user has access to a specific business
 * @param userId - The user's ID
 * @param businessId - The business ID to check access for
 * @returns Promise<boolean> - True if user has access, false otherwise
 */
export async function hasBusinessAccess(userId: string, businessId: string): Promise<boolean> {
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

    // Get business record
    const businessRecord = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (businessRecord.length === 0) {
      return false;
    }

    const business = businessRecord[0];

    // Check 1: User is the business owner
    if (business.ownerId === userId) {
      return true;
    }

    // Check 2: User is a super admin
    if (user.role === 'super_admin') {
      return true;
    }

    // Check 3: User is an admin with direct business access
    if (user.role === 'admin' && (user.businessId === businessId || user.business_id === businessId)) {
      return true;
    }

    // Check 4: User is staff with direct business access
    if (user.role === 'staff' && (user.businessId === businessId || user.business_id === businessId)) {
      return true;
    }

    // Check 5: User is associated with business through businessStaff table
    const staffRecord = await db
      .select()
      .from(businessStaff)
      .where(
        and(
          eq(businessStaff.userId, userId),
          eq(businessStaff.businessId, businessId),
          eq(businessStaff.isActive, true)
        )
      )
      .limit(1);

    if (staffRecord.length > 0) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking business access:', error);
    return false;
  }
}

/**
 * Get user's business ID from either users table or businessStaff table
 * @param userId - The user's ID
 * @returns Promise<string | null> - Business ID if found, null otherwise
 */
export async function getUserBusinessId(userId: string): Promise<string | null> {
  try {
    // First check users table
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userRecord.length > 0 && (userRecord[0].businessId || userRecord[0].business_id)) {
      return userRecord[0].businessId || userRecord[0].business_id;
    }

    // If not found in users table, check businessStaff table
    const staffRecord = await db
      .select()
      .from(businessStaff)
      .where(
        and(
          eq(businessStaff.userId, userId),
          eq(businessStaff.isActive, true)
        )
      )
      .limit(1);

    if (staffRecord.length > 0) {
      return staffRecord[0].businessId;
    }

    return null;
  } catch (error) {
    console.error('Error getting user business ID:', error);
    return null;
  }
}
