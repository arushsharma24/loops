import { redirect } from "next/navigation";

import { AppFrame } from "@/components/app-frame";
import { getCurrentUser } from "@/lib/auth";
import { loopInclude, serializeLoop } from "@/lib/loops";
import type { LoopRecord } from "@/lib/loop-record";
import { prisma } from "@/lib/prisma";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  let initialLoops: LoopRecord[] = [];
  try {
    const loops = await prisma.loop.findMany({
      where: { userId: user.id },
      include: loopInclude,
      orderBy: { updatedAt: "desc" },
    });
    initialLoops = loops.map(serializeLoop);
  } catch {
    initialLoops = [];
  }

  return <AppFrame initialLoops={initialLoops} user={{ id: user.id, email: user.email, name: user.name }}>{children}</AppFrame>;
}
