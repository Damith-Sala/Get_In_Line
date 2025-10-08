import { pgTable, text, timestamp, integer, uuid } from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  name: text('name').notNull(),
  password: text('password').notNull(), // Hashed password
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Queues table
export const queues = pgTable('queues', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  creatorId: uuid('creator_id').references(() => users.id),
  maxSize: integer('max_size'),
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
  enteredAt: timestamp('entered_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  servedAt: timestamp('served_at'),
});