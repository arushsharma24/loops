import { Loop, Prisma } from "@prisma/client";

import { deriveNextStep } from "@/lib/loop-record";

export const loopInclude = {
  checklistItems: {
    orderBy: {
      order: "asc",
    },
  },
  children: {
    include: {
      checklistItems: {
        orderBy: {
          order: "asc",
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  },
  parent: true,
} satisfies Prisma.LoopInclude;

export type LoopWithRelations = Prisma.LoopGetPayload<{
  include: typeof loopInclude;
}>;

export function serializeLoop(loop: LoopWithRelations) {
  const checklistItems = loop.checklistItems.map((item) => ({
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));

  return {
    ...loop,
    dueDate: loop.dueDate?.toISOString() ?? null,
    reminderAt: loop.reminderAt?.toISOString() ?? null,
    laterUntil: loop.laterUntil?.toISOString() ?? null,
    createdAt: loop.createdAt.toISOString(),
    updatedAt: loop.updatedAt.toISOString(),
    lastActiveAt: loop.lastActiveAt?.toISOString() ?? null,
    nextStep: deriveNextStep(
      checklistItems.map((item) => ({
        id: item.id,
        label: item.label,
        completed: item.completed,
        isNextStep: item.isNextStep,
        order: item.order,
      })),
      loop.nextStep
    ),
    checklistItems,
    children: loop.children.map((child) => ({
      ...child,
      dueDate: child.dueDate?.toISOString() ?? null,
      reminderAt: child.reminderAt?.toISOString() ?? null,
      laterUntil: child.laterUntil?.toISOString() ?? null,
      createdAt: child.createdAt.toISOString(),
      updatedAt: child.updatedAt.toISOString(),
      lastActiveAt: child.lastActiveAt?.toISOString() ?? null,
      nextStep: deriveNextStep(
        child.checklistItems.map((item) => ({
          id: item.id,
          label: item.label,
          completed: item.completed,
          isNextStep: item.isNextStep,
          order: item.order,
        })),
        child.nextStep
      ),
      checklistItems: child.checklistItems.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
    })),
    parent: loop.parent
      ? {
          ...loop.parent,
          dueDate: loop.parent.dueDate?.toISOString() ?? null,
          reminderAt: loop.parent.reminderAt?.toISOString() ?? null,
          laterUntil: loop.parent.laterUntil?.toISOString() ?? null,
          createdAt: loop.parent.createdAt.toISOString(),
          updatedAt: loop.parent.updatedAt.toISOString(),
          lastActiveAt: loop.parent.lastActiveAt?.toISOString() ?? null,
        }
      : null,
  };
}

export function scoreLoop(loop: Pick<Loop, "status" | "priority" | "dueDate" | "reminderAt" | "lastActiveAt" | "pinned" | "isCurrent" | "nextStep">) {
  let score = 0;
  if (loop.isCurrent) score += 50;
  if (loop.status === "ACTIVE") score += 32;
  if (loop.status === "WAITING") score += 14;
  if (loop.status === "LATER") score += 4;
  if (loop.priority === "URGENT") score += 22;
  if (loop.priority === "HIGH") score += 14;
  if (loop.pinned) score += 10;
  if (loop.nextStep) score += 8;

  const now = Date.now();
  if (loop.dueDate) {
    const hours = Math.round((loop.dueDate.getTime() - now) / (1000 * 60 * 60));
    if (hours <= 0) score += 24;
    else if (hours <= 24) score += 18;
    else if (hours <= 72) score += 10;
  }

  if (loop.reminderAt) {
    const hours = Math.round((loop.reminderAt.getTime() - now) / (1000 * 60 * 60));
    if (hours <= 0) score += 18;
    else if (hours <= 24) score += 12;
  }

  if (loop.lastActiveAt) {
    const hours = Math.round((now - loop.lastActiveAt.getTime()) / (1000 * 60 * 60));
    if (hours <= 4) score += 12;
    else if (hours <= 24) score += 6;
  }

  return score;
}
