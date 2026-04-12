import { z } from "zod";

export const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(50).optional(),
});

export const checklistItemSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1),
  completed: z.boolean().default(false),
});

export const loopSchema = z.object({
  title: z.string().min(1).max(120),
  summary: z.string().max(240).optional().nullable(),
  domain: z.enum(["WORK", "PERSONAL"]),
  type: z.enum(["ACTION", "THOUGHT", "ROUTINE", "REFERENCE"]),
  status: z.enum(["ACTIVE", "WAITING", "LATER", "CLOSED"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  parentId: z.string().nullable().optional(),
  nextStep: z.string().max(240).optional().nullable(),
  notes: z.string().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  reminderAt: z.string().datetime().optional().nullable(),
  laterUntil: z.string().datetime().optional().nullable(),
  tags: z.array(z.string().min(1).max(32)).default([]),
  pinned: z.boolean().default(false),
  isCurrent: z.boolean().default(false),
  checklistItems: z.array(checklistItemSchema).default([]),
});
