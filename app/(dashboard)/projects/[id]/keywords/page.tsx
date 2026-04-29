import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { KeywordsClient } from "./keywords-client";

// ─── Server Component shell ────────────────────────────────────────────────────

export default async function KeywordsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const orgId = (session.user as { organizationId?: string })?.organizationId;
  const { id: projectId } = await params;

  // Verify the project belongs to this org
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: orgId },
    select: { id: true, name: true, domain: true },
  });

  if (!project) notFound();

  // Fetch all active keywords with their two most recent rankings (for delta)
  const keywords = await prisma.keyword.findMany({
    where: { projectId, isActive: true },
    orderBy: { createdAt: "desc" },
    include: {
      keywordRankings: {
        orderBy: { snapshotDate: "desc" },
        take: 5, // last 5 for sparkline
      },
    },
  });

  // Serialize for the client component
  const serialized = keywords.map((kw) => {
    const rankings = kw.keywordRankings.map((r) => ({
      position: r.position,
      snapshotDate: r.snapshotDate.toISOString(),
    }));

    const latest = kw.keywordRankings[0];
    const prev = kw.keywordRankings[1];
    const change =
      latest?.position != null && prev?.position != null
        ? prev.position - latest.position
        : null;

    return {
      id: kw.id,
      term: kw.term,
      searchEngine: kw.searchEngine,
      country: kw.country,
      searchVolume: kw.searchVolume,
      currentPosition: latest?.position ?? null,
      rankingUrl: latest?.url ?? null,
      change,
      rankings,
      createdAt: kw.createdAt.toISOString(),
    };
  });

  return (
    <KeywordsClient
      projectId={project.id}
      projectName={project.name}
      projectDomain={project.domain}
      initialKeywords={serialized}
    />
  );
}
