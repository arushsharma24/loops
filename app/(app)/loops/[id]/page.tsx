import { notFound } from "next/navigation";

import { LoopPageView } from "@/components/loop-page-view";
import { getCurrentUser } from "@/lib/auth";
import { loopInclude, serializeLoop } from "@/lib/loops";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server-log";

export default async function LoopPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const { id } = await params;

  try {
    const [loop, loops] = await Promise.all([
      prisma.loop.findFirst({
        where: { id, userId: user.id },
        include: loopInclude,
      }),
      prisma.loop.findMany({
        where: { userId: user.id },
        include: loopInclude,
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    if (!loop) {
      notFound();
    }

    return <LoopPageView initialLoop={serializeLoop(loop)} loops={loops.map(serializeLoop)} />;
  } catch (error) {
    logServerError("page.loop", error);
    notFound();
  }
}
