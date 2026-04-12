export type LoopStatus = "ACTIVE" | "WAITING" | "LATER" | "CLOSED";
export type LoopDomain = "ALL" | "WORK" | "PERSONAL";
export type LoopType = "ACTION" | "THOUGHT" | "ROUTINE" | "REFERENCE";
export type LoopPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type ChecklistRecord = {
  id: string;
  label: string;
  completed: boolean;
  isNextStep: boolean;
  order?: number;
};

export type LoopRecord = {
  id: string;
  title: string;
  summary: string | null;
  domain: Exclude<LoopDomain, "ALL">;
  type: LoopType;
  status: LoopStatus;
  priority: LoopPriority;
  parentId: string | null;
  nextStep: string | null;
  dueDate: string | null;
  reminderAt: string | null;
  laterUntil: string | null;
  tags: string[];
  isCurrent: boolean;
  pinned: boolean;
  notes: string | null;
  checklistItems: ChecklistRecord[];
  children: Array<{
    id: string;
    title: string;
    status: LoopStatus;
    nextStep: string | null;
    domain?: Exclude<LoopDomain, "ALL">;
    parentId?: string | null;
  }>;
  parent: { id: string; title: string } | null;
  createdAt: string;
  updatedAt: string;
  lastActiveAt: string | null;
};

export type LoopPayload = {
  title: string;
  summary: string | null;
  domain: Exclude<LoopDomain, "ALL">;
  type: LoopType;
  status: LoopStatus;
  priority: LoopPriority;
  parentId: string | null;
  nextStep: string | null;
  notes: string | null;
  dueDate: string | null;
  reminderAt: string | null;
  laterUntil: string | null;
  tags: string[];
  pinned: boolean;
  isCurrent: boolean;
  checklistItems: ChecklistRecord[];
};

export function isLoopDomain(value: string | undefined): value is LoopDomain {
  return value === "ALL" || value === "WORK" || value === "PERSONAL";
}

export function buildLoopPayload(loop: LoopRecord, overrides: Partial<LoopPayload> = {}): LoopPayload {
  return {
    title: loop.title,
    summary: loop.summary,
    domain: loop.domain,
    type: loop.type,
    status: loop.status,
    priority: loop.priority,
    parentId: loop.parentId,
    nextStep: loop.nextStep,
    notes: loop.notes,
    dueDate: loop.dueDate,
    reminderAt: loop.reminderAt,
    laterUntil: loop.laterUntil,
    tags: loop.tags,
    pinned: loop.pinned,
    isCurrent: loop.isCurrent,
    checklistItems: loop.checklistItems.map((item, index) => ({
      id: item.id,
      label: item.label,
      completed: item.completed,
      isNextStep: item.isNextStep,
      order: item.order ?? index,
    })),
    ...overrides,
  };
}

export function deriveNextStep(checklistItems: ChecklistRecord[], fallback?: string | null) {
  const activeChecklistItem = checklistItems.find((item) => item.isNextStep && !item.completed);
  if (activeChecklistItem) {
    return activeChecklistItem.label;
  }

  return fallback ?? null;
}

export function normalizeChecklistItems(checklistItems: ChecklistRecord[]) {
  let nextStepAssigned = false;

  return checklistItems.map((item, index) => {
    const isNextStep = !item.completed && item.isNextStep && !nextStepAssigned;
    if (isNextStep) {
      nextStepAssigned = true;
    }

    return {
      ...item,
      isNextStep,
      order: item.order ?? index,
    };
  });
}

export function nextMorningIso() {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  next.setHours(9, 0, 0, 0);
  return next.toISOString();
}
