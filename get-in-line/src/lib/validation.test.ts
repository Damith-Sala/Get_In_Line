import { describe, it, expect } from 'vitest'
import {
  userSchema,
  businessSchema,
  branchSchema,
  queueSchema,
  queueEntrySchema,
  staffSchema,
  notificationSchema,
  analyticsSchema,
  businessSignupSchema
} from './validation'

describe('validation schemas', () => {
  describe('userSchema', () => {
    it('should validate a valid user', () => {
      const validUser = {
        email: 'test@example.com',
        password: 'password123',
        name: 'John Doe',
        role: 'user'
      }

      const result = userSchema.safeParse(validUser)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validUser)
      }
    })

    it('should default role to user when not provided', () => {
      const userWithoutRole = {
        email: 'test@example.com',
        password: 'password123',
        name: 'John Doe'
      }

      const result = userSchema.safeParse(userWithoutRole)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.role).toBe('user')
      }
    })

    it('should reject invalid email', () => {
      const invalidUser = {
        email: 'invalid-email',
        password: 'password123',
        name: 'John Doe'
      }

      const result = userSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })

    it('should reject short password', () => {
      const invalidUser = {
        email: 'test@example.com',
        password: '123',
        name: 'John Doe'
      }

      const result = userSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })

    it('should reject short name', () => {
      const invalidUser = {
        email: 'test@example.com',
        password: 'password123',
        name: 'J'
      }

      const result = userSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })

    it('should reject invalid role', () => {
      const invalidUser = {
        email: 'test@example.com',
        password: 'password123',
        name: 'John Doe',
        role: 'invalid_role'
      }

      const result = userSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })
  })

  describe('businessSchema', () => {
    it('should validate a valid business', () => {
      const validBusiness = {
        name: 'Test Business',
        description: 'A test business',
        businessType: 'Restaurant',
        subscriptionPlan: 'premium'
      }

      const result = businessSchema.safeParse(validBusiness)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validBusiness)
      }
    })

    it('should validate business with minimal required fields', () => {
      const minimalBusiness = {
        name: 'Test Business'
      }

      const result = businessSchema.safeParse(minimalBusiness)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.subscriptionPlan).toBe('free')
      }
    })

    it('should reject short business name', () => {
      const invalidBusiness = {
        name: 'A'
      }

      const result = businessSchema.safeParse(invalidBusiness)
      expect(result.success).toBe(false)
    })

    it('should reject invalid subscription plan', () => {
      const invalidBusiness = {
        name: 'Test Business',
        subscriptionPlan: 'invalid_plan'
      }

      const result = businessSchema.safeParse(invalidBusiness)
      expect(result.success).toBe(false)
    })
  })

  describe('branchSchema', () => {
    it('should validate a valid branch', () => {
      const validBranch = {
        name: 'Main Branch',
        address: '123 Main St',
        phone: '555-1234',
        email: 'branch@example.com',
        managerId: 'manager-123'
      }

      const result = branchSchema.safeParse(validBranch)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validBranch)
      }
    })

    it('should validate branch with minimal required fields', () => {
      const minimalBranch = {
        name: 'Main Branch'
      }

      const result = branchSchema.safeParse(minimalBranch)
      expect(result.success).toBe(true)
    })

    it('should reject short branch name', () => {
      const invalidBranch = {
        name: 'A'
      }

      const result = branchSchema.safeParse(invalidBranch)
      expect(result.success).toBe(false)
    })

    it('should reject invalid email format', () => {
      const invalidBranch = {
        name: 'Main Branch',
        email: 'invalid-email'
      }

      const result = branchSchema.safeParse(invalidBranch)
      expect(result.success).toBe(false)
    })
  })

  describe('queueSchema', () => {
    it('should validate a valid queue', () => {
      const validQueue = {
        name: 'Customer Service',
        description: 'General customer service queue',
        businessId: 'business-123',
        branchId: 'branch-123',
        serviceType: 'Customer Support',
        maxSize: 50,
        estimatedWaitTime: 15,
        isActive: true
      }

      const result = queueSchema.safeParse(validQueue)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validQueue)
      }
    })

    it('should validate queue with minimal required fields', () => {
      const minimalQueue = {
        name: 'Customer Service'
      }

      const result = queueSchema.safeParse(minimalQueue)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.isActive).toBe(true)
      }
    })

    it('should reject short queue name', () => {
      const invalidQueue = {
        name: 'A'
      }

      const result = queueSchema.safeParse(invalidQueue)
      expect(result.success).toBe(false)
    })

    it('should reject negative maxSize', () => {
      const invalidQueue = {
        name: 'Customer Service',
        maxSize: -1
      }

      const result = queueSchema.safeParse(invalidQueue)
      expect(result.success).toBe(false)
    })

    it('should reject negative estimatedWaitTime', () => {
      const invalidQueue = {
        name: 'Customer Service',
        estimatedWaitTime: -5
      }

      const result = queueSchema.safeParse(invalidQueue)
      expect(result.success).toBe(false)
    })
  })

  describe('queueEntrySchema', () => {
    it('should validate a valid queue entry', () => {
      const validEntry = {
        queueId: 'queue-123',
        userId: 'user-123',
        status: 'waiting',
        position: 1,
        isWalkIn: false
      }

      const result = queueEntrySchema.safeParse(validEntry)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validEntry)
      }
    })

    it('should validate queue entry with minimal required fields', () => {
      const minimalEntry = {
        queueId: 'queue-123',
        userId: 'user-123',
        status: 'waiting',
        position: 1
      }

      const result = queueEntrySchema.safeParse(minimalEntry)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.isWalkIn).toBe(false)
      }
    })

    it('should reject invalid status', () => {
      const invalidEntry = {
        queueId: 'queue-123',
        userId: 'user-123',
        status: 'invalid_status',
        position: 1
      }

      const result = queueEntrySchema.safeParse(invalidEntry)
      expect(result.success).toBe(false)
    })

    it('should reject non-positive position', () => {
      const invalidEntry = {
        queueId: 'queue-123',
        userId: 'user-123',
        status: 'waiting',
        position: 0
      }

      const result = queueEntrySchema.safeParse(invalidEntry)
      expect(result.success).toBe(false)
    })
  })

  describe('staffSchema', () => {
    it('should validate a valid staff record', () => {
      const validStaff = {
        userId: 'user-123',
        role: 'manager',
        permissions: '{"canCreateQueues": true}'
      }

      const result = staffSchema.safeParse(validStaff)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validStaff)
      }
    })

    it('should validate staff with minimal required fields', () => {
      const minimalStaff = {
        userId: 'user-123',
        role: 'staff'
      }

      const result = staffSchema.safeParse(minimalStaff)
      expect(result.success).toBe(true)
    })

    it('should reject invalid role', () => {
      const invalidStaff = {
        userId: 'user-123',
        role: 'invalid_role'
      }

      const result = staffSchema.safeParse(invalidStaff)
      expect(result.success).toBe(false)
    })
  })

  describe('notificationSchema', () => {
    it('should validate a valid notification', () => {
      const validNotification = {
        businessId: 'business-123',
        queueId: 'queue-123',
        userId: 'user-123',
        type: 'announcement',
        title: 'Important Update',
        message: 'Please be aware of the new policy'
      }

      const result = notificationSchema.safeParse(validNotification)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validNotification)
      }
    })

    it('should validate notification with minimal required fields', () => {
      const minimalNotification = {
        type: 'queue_update',
        title: 'Update',
        message: 'Your position has changed'
      }

      const result = notificationSchema.safeParse(minimalNotification)
      expect(result.success).toBe(true)
    })

    it('should reject invalid notification type', () => {
      const invalidNotification = {
        type: 'invalid_type',
        title: 'Update',
        message: 'Your position has changed'
      }

      const result = notificationSchema.safeParse(invalidNotification)
      expect(result.success).toBe(false)
    })

    it('should reject empty title', () => {
      const invalidNotification = {
        type: 'announcement',
        title: '',
        message: 'Some message'
      }

      const result = notificationSchema.safeParse(invalidNotification)
      expect(result.success).toBe(false)
    })

    it('should reject empty message', () => {
      const invalidNotification = {
        type: 'announcement',
        title: 'Title',
        message: ''
      }

      const result = notificationSchema.safeParse(invalidNotification)
      expect(result.success).toBe(false)
    })
  })

  describe('analyticsSchema', () => {
    it('should validate a valid analytics record', () => {
      const validAnalytics = {
        queueId: 'queue-123',
        businessId: 'business-123',
        date: '2023-12-01',
        totalEntries: 100,
        averageWaitTime: 15.5,
        peakHour: 14,
        completedServices: 95,
        cancelledServices: 5
      }

      const result = analyticsSchema.safeParse(validAnalytics)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validAnalytics)
      }
    })

    it('should validate analytics with minimal required fields', () => {
      const minimalAnalytics = {
        queueId: 'queue-123',
        businessId: 'business-123'
      }

      const result = analyticsSchema.safeParse(minimalAnalytics)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.totalEntries).toBe(0)
        expect(result.data.completedServices).toBe(0)
        expect(result.data.cancelledServices).toBe(0)
      }
    })

    it('should reject invalid peak hour', () => {
      const invalidAnalytics = {
        queueId: 'queue-123',
        businessId: 'business-123',
        peakHour: 25
      }

      const result = analyticsSchema.safeParse(invalidAnalytics)
      expect(result.success).toBe(false)
    })

    it('should reject negative peak hour', () => {
      const invalidAnalytics = {
        queueId: 'queue-123',
        businessId: 'business-123',
        peakHour: -1
      }

      const result = analyticsSchema.safeParse(invalidAnalytics)
      expect(result.success).toBe(false)
    })
  })

  describe('businessSignupSchema', () => {
    it('should validate business owner signup', () => {
      const validOwnerSignup = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        registrationType: 'owner',
        businessData: {
          name: 'Test Business',
          description: 'A test business',
          businessType: 'Restaurant',
          subscriptionPlan: 'premium'
        }
      }

      const result = businessSignupSchema.safeParse(validOwnerSignup)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validOwnerSignup)
      }
    })

    it('should validate staff signup', () => {
      const validStaffSignup = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
        registrationType: 'staff',
        businessId: 'business-123'
      }

      const result = businessSignupSchema.safeParse(validStaffSignup)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validStaffSignup)
      }
    })

    it('should reject owner signup without business data', () => {
      const invalidOwnerSignup = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        registrationType: 'owner'
      }

      const result = businessSignupSchema.safeParse(invalidOwnerSignup)
      expect(result.success).toBe(false)
    })

    it('should reject staff signup without business ID', () => {
      const invalidStaffSignup = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
        registrationType: 'staff'
      }

      const result = businessSignupSchema.safeParse(invalidStaffSignup)
      expect(result.success).toBe(false)
    })

    it('should reject staff signup with empty business ID', () => {
      const invalidStaffSignup = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
        registrationType: 'staff',
        businessId: ''
      }

      const result = businessSignupSchema.safeParse(invalidStaffSignup)
      expect(result.success).toBe(false)
    })

    it('should reject invalid registration type', () => {
      const invalidSignup = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        registrationType: 'invalid_type'
      }

      const result = businessSignupSchema.safeParse(invalidSignup)
      expect(result.success).toBe(false)
    })

    it('should reject invalid email format', () => {
      const invalidSignup = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123',
        registrationType: 'owner',
        businessData: {
          name: 'Test Business'
        }
      }

      const result = businessSignupSchema.safeParse(invalidSignup)
      expect(result.success).toBe(false)
    })

    it('should reject short password', () => {
      const invalidSignup = {
        name: 'John Doe',
        email: 'john@example.com',
        password: '123',
        registrationType: 'owner',
        businessData: {
          name: 'Test Business'
        }
      }

      const result = businessSignupSchema.safeParse(invalidSignup)
      expect(result.success).toBe(false)
    })

    it('should reject short name', () => {
      const invalidSignup = {
        name: 'J',
        email: 'john@example.com',
        password: 'password123',
        registrationType: 'owner',
        businessData: {
          name: 'Test Business'
        }
      }

      const result = businessSignupSchema.safeParse(invalidSignup)
      expect(result.success).toBe(false)
    })

    it('should reject invalid business subscription plan', () => {
      const invalidSignup = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        registrationType: 'owner',
        businessData: {
          name: 'Test Business',
          subscriptionPlan: 'invalid_plan'
        }
      }

      const result = businessSignupSchema.safeParse(invalidSignup)
      expect(result.success).toBe(false)
    })
  })
})
