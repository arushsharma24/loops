import { DashboardView } from "@/components/dashboard-view";
import { getCurrentUser } from "@/lib/auth";
import { loopInclude, scoreLoop, serializeLoop } from "@/lib/loops";
import { isLoopDomain, type LoopDomain } from "@/lib/loop-record";
import { prisma } from "@/lib/prisma";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const params = await searchParams;
  const requestedDomain = params.domain?.toUpperCase();
  const domainFilter: LoopDomain = isLoopDomain(requestedDomain) ? requestedDomain : "ALL";

  try {
    const loops = await prisma.loop.findMany({
      where: { userId: user.id, status: { not: "CLOSED" } },
      include: loopInclude,
      orderBy: { updatedAt: "desc" },
    });

    const initialLoops = loops
      .sort((a, b) => scoreLoop(b) - scoreLoop(a))
      .map(serializeLoop);

    return <DashboardView initialDomainFilter={domainFilter} initialLoops={initialLoops} initialSection="home" />;
  } catch {
    return (
      <DashboardView
        initialDomainFilter={domainFilter}
        initialLoops={[]}
        initialSection="home"
        initialError="Database connection unavailable. Set DATABASE_URL and run Prisma setup to start storing loops."
      />
    );
  }
}
