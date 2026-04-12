import { DashboardView } from "@/components/dashboard-view";
import { getCurrentUser } from "@/lib/auth";
import { loopInclude, serializeLoop } from "@/lib/loops";
import { isLoopDomain, type LoopDomain } from "@/lib/loop-record";
import { prisma } from "@/lib/prisma";

export default async function ClosedPage({
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
      where: { userId: user.id, status: "CLOSED" },
      include: loopInclude,
      orderBy: { updatedAt: "desc" },
    });

    return <DashboardView initialDomainFilter={domainFilter} initialLoops={loops.map(serializeLoop)} initialSection="closed" />;
  } catch {
    return (
      <DashboardView
        initialDomainFilter={domainFilter}
        initialLoops={[]}
        initialSection="closed"
        initialError="Database connection unavailable. Set DATABASE_URL and run Prisma setup to start storing loops."
      />
    );
  }
}
