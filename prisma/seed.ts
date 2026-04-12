import { PrismaClient, LoopDomain, LoopPriority, LoopStatus, LoopType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 10);

  const user = await prisma.user.upsert({
    where: { email: "demo@loops.local" },
    update: {},
    create: {
      email: "demo@loops.local",
      name: "Demo User",
      passwordHash,
    },
  });

  const existing = await prisma.loop.count({ where: { userId: user.id } });
  if (existing > 0) {
    return;
  }

  const planning = await prisma.loop.create({
    data: {
      userId: user.id,
      title: "Q2 planning narrative",
      summary: "Shape the quarter story, the priorities, and what needs to be true next.",
      domain: LoopDomain.WORK,
      type: LoopType.ACTION,
      status: LoopStatus.ACTIVE,
      priority: LoopPriority.HIGH,
      nextStep: "Draft the opening section of the planning memo.",
      notes: "Keep this thread focused on the story and the major tradeoffs.",
      pinned: true,
      isCurrent: true,
      checklistItems: {
        create: [
          { label: "Pull product metrics", order: 0 },
          { label: "Collect leadership notes", order: 1, completed: true },
        ],
      },
    },
  });

  await prisma.loop.create({
    data: {
      userId: user.id,
      parentId: planning.id,
      title: "Review planning notes",
      summary: "Collect inputs from the last cycle and identify what still matters.",
      domain: LoopDomain.WORK,
      type: LoopType.REFERENCE,
      status: LoopStatus.WAITING,
      priority: LoopPriority.MEDIUM,
      nextStep: "Wait for the updated analytics export.",
      notes: "Blocked on finance.",
    },
  });

  await prisma.loop.create({
    data: {
      userId: user.id,
      title: "Weekly reset",
      summary: "A calm thread for restoring order across the week.",
      domain: LoopDomain.PERSONAL,
      type: LoopType.ROUTINE,
      status: LoopStatus.LATER,
      priority: LoopPriority.MEDIUM,
      nextStep: "Review calendar, errands, and home admin.",
      laterUntil: new Date(Date.now() + 1000 * 60 * 60 * 18),
      notes: "Keep this light. The goal is clarity, not over-planning.",
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
