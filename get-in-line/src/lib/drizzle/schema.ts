import { pgTable, text, timestamp, integer, uuid, boolean, decimal } from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  name: text('name').notNull(),
  phone: text('phone'),
  password: text('password').notNull(), // Hashed password
  role: text('role').notNull().default('user'), // user, staff, business_admin, super_admin
  businessId: uuid('business_id'), // For staff/admins - will be set as foreign key later
  notificationPreferences: text('notification_preferences'), // JSON string for notification settings
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

// Define foreign key relationships after all tables are defined
// This is handled in migrations, but we can add the relationship here for clarity
export const usersRelations = {
  business: businesses,
  ownedBusinesses: businesses,
  createdQueues: queues,
  queueEntries: queueEntries,
  servedEntries: queueEntries,
  staffMemberships: businessStaff,
  notifications: notifications,
};

export const businessesRelations = {
  owner: users,
  staff: businessStaff,
  branches: branches,
  queues: queues,
  notifications: notifications,
  analytics: queueAnalytics,
};

export const branchesRelations = {
  business: businesses,
  manager: users,
  queues: queues,
};

export const queuesRelations = {
  business: businesses,
  branch: branches,
  creator: users,
  entries: queueEntries,
  analytics: queueAnalytics,
};

export const queueEntriesRelations = {
  queue: queues,
  user: users,
  servedBy: users,
};

export const businessStaffRelations = {
  business: businesses,
  user: users,
};

export const notificationsRelations = {
  business: businesses,
  queue: queues,
  user: users,
};

export const queueAnalyticsRelations = {
  queue: queues,
  business: businesses,
};