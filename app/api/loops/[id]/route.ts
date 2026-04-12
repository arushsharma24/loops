import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { deriveNextStep, normalizeChecklistItems } from "@/lib/loop-record";
import { loopInclude, serializeLoop } from "@/lib/loops";
import { prisma } from "@/lib/prisma";
import { loopSchema } from "@/lib/validation";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Context) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const json = await request.json();
    const parsed = loopSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid loop payload." }, { status: 400 });
    }

    const data = parsed.data;
    const checklistItems = normalizeChecklistItems(
      data.checklistItems.map((item, index) => ({
        id: item.id ?? crypto.randomUUID(),
        label: item.label,
        completed: item.completed,
        isNextStep: item.isNextStep,
        order: index,
      }))
    );
    const nextStep = deriveNextStep(checklistItems, data.nextStep);

    const existing = await prisma.loop.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Loop not found." }, { status: 404 });
    }

    const loop = await prisma.$transaction(async (tx) => {
      if (data.isCurrent) {
        await tx.loop.updateMany({
          where: { userId: user.id, isCurrent: true, id: { not: id } },
          data: { isCurrent: false },
        });
      }

      await tx.checklistItem.deleteMany({
        where: { loopId: id },
      });

      return tx.loop.update({
        where: { id },
        data: {
          title: data.title,
          summary: data.summary ?? null,
          domain: data.domain,
          type: data.type,
          status: data.status,
          priority: data.priority,
          parentId: data.parentId ?? null,
          nextStep,
          notes: data.notes ?? null,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          reminderAt: data.reminderAt ? new Date(data.reminderAt) : null,
          laterUntil: data.laterUntil ? new Date(data.laterUntil) : null,
          tags: data.tags,
          pinned: data.pinned,
          isCurrent: data.isCurrent,
          lastActiveAt: new Date(),
          checklistItems: {
            create: checklistItems.map((item, index) => ({
              label: item.label,
              completed: item.completed,
              isNextStep: item.isNextStep,
              order: index,
            })),
          },
        },
        include: loopInclude,
      });
    });

    return NextResponse.json({ loop: serializeLoop(loop) });
  } catch {
    return NextResponse.json({ error: "Database unavailable. Check DATABASE_URL and Prisma setup." }, { status: 503 });
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const existing = await prisma.loop.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Loop not found." }, { status: 404 });
    }

    await prisma.loop.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Database unavailable. Check DATABASE_URL and Prisma setup." }, { status: 503 });
  }
}
