import { prisma } from "@/lib/prisma";

export async function getProjectWithDetails(projectId: string, orgId: string) {
  return prisma.project.findFirst({
    where: { id: projectId, organizationId: orgId },
    include: {
      domainSnapshots: { orderBy: { snapshotDate: "desc" }, take: 6 },
      keywords: {
        where: { isActive: true },
        include: {
          keywordRankings: {
            orderBy: { snapshotDate: "desc" },
            take: 2,
          },
        },
        take: 20,
      },
      backlinks: { orderBy: { firstSeen: "desc" }, take: 10 },
      referringDomains: { where: { isActive: true }, orderBy: { domainAuthority: "desc" }, take: 10 },
      onPageAudits: {
        orderBy: { completedAt: "desc" },
        take: 1,
        include: { onPageIssues: { where: { severity: "CRITICAL", isFixed: false }, take: 5 } },
      },
      aiBrandMentionChecks: { orderBy: { snapshotDate: "desc" }, take: 20 },
      competitors: {
        include: {
          competitorSnapshots: { orderBy: { snapshotDate: "desc" }, take: 1 },
        },
      },
      reports: { orderBy: { generatedAt: "desc" }, take: 3 },
    },
  });
}

export async function getAllProjects(orgId: string) {
  return prisma.project.findMany({
    where: { organizationId: orgId },
    include: {
      domainSnapshots: { orderBy: { snapshotDate: "desc" }, take: 1 },
      onPageAudits: { orderBy: { completedAt: "desc" }, take: 1 },
      keywords: { where: { isActive: true }, select: { id: true } },
      backlinks: { where: { status: "ACTIVE" }, select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export function computeAvgPosition(keywords: Array<{
  keywordRankings: Array<{ position: number | null }>;
}>): number | null {
  const positions = keywords
    .map((k) => k.keywordRankings[0]?.position)
    .filter((p): p is number => p != null);
  if (positions.length === 0) return null;
  return Math.round(positions.reduce((a, b) => a + b, 0) / positions.length);
}

export function getTopWins(keywords: Array<{
  term: string;
  keywordRankings: Array<{ position: number | null; previousPosition: number | null }>;
}>) {
  return keywords
    .filter((k) => {
      const cur = k.keywordRankings[0]?.position;
      const prev = k.keywordRankings[1]?.position ?? k.keywordRankings[0]?.previousPosition;
      return cur && prev && cur < prev;
    })
    .map((k) => ({
      term: k.term,
      current: k.keywordRankings[0]?.position ?? 0,
      previous: k.keywordRankings[1]?.position ?? k.keywordRankings[0]?.previousPosition ?? 0,
      change: (k.keywordRankings[1]?.position ?? k.keywordRankings[0]?.previousPosition ?? 0) - (k.keywordRankings[0]?.position ?? 0),
    }))
    .sort((a, b) => b.change - a.change)
    .slice(0, 5);
}

export function getTopLosses(keywords: Array<{
  term: string;
  keywordRankings: Array<{ position: number | null; previousPosition: number | null }>;
}>) {
  return keywords
    .filter((k) => {
      const cur = k.keywordRankings[0]?.position;
      const prev = k.keywordRankings[1]?.position ?? k.keywordRankings[0]?.previousPosition;
      return cur && prev && cur > prev;
    })
    .map((k) => ({
      term: k.term,
      current: k.keywordRankings[0]?.position ?? 0,
      previous: k.keywordRankings[1]?.position ?? k.keywordRankings[0]?.previousPosition ?? 0,
      change: (k.keywordRankings[0]?.position ?? 0) - (k.keywordRankings[1]?.position ?? k.keywordRankings[0]?.previousPosition ?? 0),
    }))
    .sort((a, b) => b.change - a.change)
    .slice(0, 5);
}
