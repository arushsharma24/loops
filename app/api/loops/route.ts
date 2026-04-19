import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { deriveNextStep, normalizeChecklistItems } from "@/lib/loop-record";
import { loopInclude, scoreLoop, serializeLoop } from "@/lib/loops";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server-log";
import { loopSchema } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const domain = searchParams.get("domain");

    const loops = await prisma.loop.findMany({
      where: { userId: user.id, ...(domain === "WORK" || domain === "PERSONAL" ? { domain } : {}) },
      include: loopInclude,
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      loops: loops.sort((a, b) => scoreLoop(b) - scoreLoop(a)).map(serializeLoop),
    });
  } catch (error) {
    logServerError("api.loops.list", error);
    return NextResponse.json({ error: "Database unavailable. Check DATABASE_URL and Prisma setup." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const loop = await prisma.$transaction(async (tx) => {
      if (data.isCurrent) {
        await tx.loop.updateMany({
          where: { userId: user.id, isCurrent: true },
          data: { isCurrent: false },
        });
      }

      return tx.loop.create({
        data: {
          userId: user.id,
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

    return NextResponse.json({ loop: serializeLoop(loop) }, { status: 201 });
  } catch (error) {
    logServerError("api.loops.create", error);
    return NextResponse.json({ error: "Database unavailable. Check DATABASE_URL and Prisma setup." }, { status: 503 });
  }
}
