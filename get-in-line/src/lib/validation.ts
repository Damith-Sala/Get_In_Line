import { z } from 'zod';

// User validation schemas
export const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.enum(['user', 'staff', 'admin', 'super_admin']).default('user'),
});

// Business validation schemas
export const businessSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  businessType: z.string().optional(),
  subscriptionPlan: z.enum(['free', 'basic', 'premium']).default('free'),
});

// Branch validation schemas
export const branchSchema = z.object({
  name: z.string().min(2),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  managerId: z.string().optional(),
});

// Queue validation schemas (updated for business support)
export const queueSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  businessId: z.string().optional(),
  branchId: z.string().optional(),
  serviceType: z.string().optional(),
  maxSize: z.number().positive().optional(),
  estimatedWaitTime: z.number().positive().optional(),
  isActive: z.boolean().default(true),
});

// Queue entry validation schemas
export const queueEntrySchema = z.object({
  queueId: z.string(),
  userId: z.string(),
  status: z.enum(['waiting', 'serving', 'served', 'missed', 'cancelled']),
  position: z.number().positive(),
  isWalkIn: z.boolean().default(false),
});

// Staff management validation schemas
export const staffSchema = z.object({
  userId: z.string(),
  role: z.enum(['staff', 'manager', 'admin']),
  permissions: z.string().optional(), // JSON string
});

// Notification validation schemas
export const notificationSchema = z.object({
  businessId: z.string().optional(),
  queueId: z.string().optional(),
  userId: z.string().optional(),
  type: z.enum(['announcement', 'queue_update', 'position_change']),
  title: z.string().min(1),
  message: z.string().min(1),
});

// Analytics validation schemas
export const analyticsSchema = z.object({
  queueId: z.string(),
  businessId: z.string(),
  date: z.string().optional(), // ISO date string
  totalEntries: z.number().default(0),
  averageWaitTime: z.number().optional(),
  peakHour: z.number().min(0).max(23).optional(),
  completedServices: z.number().default(0),
  cancelledServices: z.number().default(0),
});

// Business signup validation schemas
export const businessSignupSchema = z.object({
  // User info
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  
  // Registration type
  registrationType: z.enum(['owner', 'staff']),
  
  // For business owners
  businessData: z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    businessType: z.string().optional(),
    subscriptionPlan: z.enum(['free', 'basic', 'premium']).default('free'),
  }).optional(),
  
  // For staff members
  businessId: z.string().optional(),
}).refine((data) => {
  // If owner, businessData is required
  if (data.registrationType === 'owner') {
    return data.businessData !== undefined;
  }
  // If staff, businessId is required
  if (data.registrationType === 'staff') {
    return data.businessId !== undefined && data.businessId.length > 0;
  }
  return true;
}, {
  message: "Business data required for owners, business ID required for staff"
});