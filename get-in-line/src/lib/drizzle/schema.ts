import { pgTable, text, timestamp, integer, uuid, boolean, decimal } from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  name: text('name').notNull(),
  password: text('password').notNull(), // Hashed password
  role: text('role').notNull().default('user'), // user, staff, admin, super_admin
  businessId: uuid('business_id'), // For staff/admins - will be set as foreign key later
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Businesses table
export const businesses = pgTable('businesses', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  businessType: text('business_type'), // clinic, restaurant, bank, etc.
  ownerId: uuid('owner_id').references(() => users.id).notNull(),
  subscriptionPlan: text('subscription_plan').default('free'), // free, basic, premium
  isActive: boolean('is_active').default(true),
  settings: text('settings'), // JSON string for business-specific settings
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Branches table
export const branches = pgTable('branches', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').references(() => businesses.id).notNull(),
  name: text('name').notNull(),
  address: text('address'),
  phone: text('phone'),
  email: text('email'),
  managerId: uuid('manager_id').references(() => users.id),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Queues table (updated to support businesses and branches)
export const queues = pgTable('queues', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  businessId: uuid('business_id').references(() => businesses.id),
  branchId: uuid('branch_id').references(() => branches.id),
  creatorId: uuid('creator_id').references(() => users.id),
  serviceType: text('service_type'), // doctor consultation, lab test, etc.
  maxSize: integer('max_size'),
  isActive: boolean('is_active').default(true),
  estimatedWaitTime: integer('estimated_wait_time'), // in minutes
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Queue entries table
export const queueEntries = pgTable('queue_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  queueId: uuid('queue_id').references(() => queues.id),
  userId: uuid('user_id').references(() => users.id),
  position: integer('position').notNull(),
  status: text('status').notNull().default('waiting'), // waiting, serving, served, missed, cancelled
  isWalkIn: boolean('is_walk_in').default(false), // For manual check-ins
  enteredAt: timestamp('entered_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  servedAt: timestamp('served_at'),
  servedBy: uuid('served_by').references(() => users.id), // Staff member who served
});

// Business staff table (for managing staff permissions)
export const businessStaff = pgTable('business_staff', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').references(() => businesses.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  role: text('role').notNull(), // staff, manager, admin
  permissions: text('permissions'), // JSON string for specific permissions
  isActive: boolean('is_active').default(true),
  joinedAt: timestamp('joined_at').defaultNow(),
});

// Notifications table
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').references(() => businesses.id),
  queueId: uuid('queue_id').references(() => queues.id),
  userId: uuid('user_id').references(() => users.id),
  type: text('type').notNull(), // announcement, queue_update, position_change
  title: text('title').notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Analytics table for tracking queue metrics
export const queueAnalytics = pgTable('queue_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  queueId: uuid('queue_id').references(() => queues.id).notNull(),
  businessId: uuid('business_id').references(() => businesses.id).notNull(),
  date: timestamp('date').notNull(),
  totalEntries: integer('total_entries').default(0),
  averageWaitTime: decimal('average_wait_time', { precision: 10, scale: 2 }),
  peakHour: integer('peak_hour'), // 0-23
  completedServices: integer('completed_services').default(0),
  cancelledServices: integer('cancelled_services').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Add foreign key relationship for users.businessId
// Note: This would be handled in a migration, but for schema definition we keep it simple