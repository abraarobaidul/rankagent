import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AddProjectButton } from "./add-project-button";
import { ProjectGrid } from "./project-grid";

// ─── Server Component ─────────────────────────────────────────────────────────

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const orgId = (session.user as { organizationId?: string })?.organizationId;
  if (!orgId) {
    return (
      <div className="text-muted-foreground text-sm">No organization found.</div>
    );
  }

  const projects = await prisma.project.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    include: {
      domainSnapshots: {
        orderBy: { snapshotDate: "desc" },
        take: 1,
      },
      onPageAudits: {
        orderBy: { completedAt: "desc" },
        take: 1,
        select: { healthScore: true },
      },
    },
  });

  const serialized = projects.map((p) => {
    const snap = p.domainSnapshots[0];
    const audit = p.onPageAudits[0];
    return {
      id: p.id,
      name: p.name,
      domain: p.domain,
      isActive: p.isActive,
      healthScore: audit?.healthScore ?? p.healthScore,
      lastCrawledAt: p.lastCrawledAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
      latestSnapshot: snap
        ? {
            domainAuthority: snap.domainAuthority,
            backlinksCount: snap.backlinksCount,
            referringDomainsCount: snap.referringDomainsCount,
            organicKeywords: snap.organicKeywords,
            snapshotDate: snap.snapshotDate.toISOString(),
          }
        : null,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {projects.length} project{projects.length !== 1 ? "s" : ""} in your organization
          </p>
        </div>
        <AddProjectButton />
      </div>

      {/* Grid or empty state */}
      <ProjectGrid projects={serialized} />
    </div>
  );
}
