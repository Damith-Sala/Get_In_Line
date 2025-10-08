import { z } from 'zod';

// User validation schemas
export const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

// Queue validation schemas
export const queueSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  maxSize: z.number().positive().optional(),
});

// Queue entry validation schemas
export const queueEntrySchema = z.object({
  queueId: z.string(),
  userId: z.string(),
  status: z.enum(['waiting', 'serving', 'served', 'missed', 'cancelled']),
  position: z.number().positive(),
});