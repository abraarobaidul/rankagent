import { prisma } from "@/lib/prisma";
import { subMonths, startOfMonth, endOfMonth } from "date-fns";

export async function getDashboardStats(organizationId: string) {
  const projects = await prisma.project.findMany({
    where: { organizationId, isActive: true },
    include: {
      domainSnapshots: {
        orderBy: { snapshotDate: "desc" },
        take: 2,
      },
      backlinks: true,
      keywords: { include: { keywordRankings: { orderBy: { snapshotDate: "desc" }, take: 2 } } },
      aiBrandMentionChecks: { orderBy: { snapshotDate: "desc" }, take: 20 },
      onPageAudits: { orderBy: { completedAt: "desc" }, take: 1 },
    },
  });

  let totalKeywords = 0;
  let keywordsImproved = 0;
  let keywordsDeclined = 0;
  let totalBacklinks = 0;
  let newBacklinks = 0;
  let lostBacklinks = 0;
  let daSum = 0;
  let daCount = 0;
  let healthSum = 0;
  let healthCount = 0;
  let aiMentionTotal = 0;
  let aiMentionCount = 0;

  for (const project of projects) {
    // DA
    const latestSnap = project.domainSnapshots[0];
    if (latestSnap?.domainAuthority) {
      daSum += latestSnap.domainAuthority;
      daCount++;
    }

    // Keywords
    for (const kw of project.keywords) {
      if (!kw.isActive) continue;
      totalKeywords++;
      const latest = kw.keywordRankings[0];
      const prev = kw.keywordRankings[1];
      if (latest?.position && prev?.position) {
        if (latest.position < prev.position) keywordsImproved++;
        if (latest.position > prev.position) keywordsDeclined++;
      }
    }

    // Backlinks
    const thirtyDaysAgo = subMonths(new Date(), 1);
    totalBacklinks += project.backlinks.filter((b) => b.status === "ACTIVE").length;
    newBacklinks += project.backlinks.filter((b) => b.status === "NEW" && b.firstSeen && b.firstSeen > thirtyDaysAgo).length;
    lostBacklinks += project.backlinks.filter((b) => b.status === "LOST" && b.lastSeen && b.lastSeen > thirtyDaysAgo).length;

    // Health score
    const audit = project.onPageAudits[0];
    if (audit?.healthScore) {
      healthSum += audit.healthScore;
      healthCount++;
    }

    // AI mentions
    for (const check of project.aiBrandMentionChecks) {
      aiMentionCount++;
      if (check.isMentioned) aiMentionTotal++;
    }
  }

  const avgDA = daCount > 0 ? Math.round(daSum / daCount) : 0;
  const avgHealth = healthCount > 0 ? Math.round(healthSum / healthCount) : 0;
  const aiScore = aiMentionCount > 0 ? Math.round((aiMentionTotal / aiMentionCount) * 100) : 0;

  return {
    totalProjects: projects.length,
    avgDomainAuthority: avgDA,
    totalKeywords,
    keywordsImproved,
    keywordsDeclined,
    totalBacklinks,
    newBacklinks,
    lostBacklinks,
    aiMentionScore: aiScore,
    avgHealthScore: avgHealth,
    monthOverMonthGrowth: 0, // placeholder
    isDemo: projects.some((p) => p.domainSnapshots[0]?.isDemo),
  };
}

export async function getDomainTrend(projectId: string) {
  const snapshots = await prisma.domainSnapshot.findMany({
    where: { projectId },
    orderBy: { snapshotDate: "asc" },
    take: 12,
  });

  return snapshots.map((s) => ({
    date: s.snapshotDate.toISOString().split("T")[0],
    value: s.domainAuthority ?? 0,
    backlinks: s.backlinksCount ?? 0,
    keywords: s.organicKeywords ?? 0,
    traffic: s.organicTraffic ?? 0,
  }));
}

export async function getTrafficTrend(organizationId: string) {
  const thirtyDaysAgo = subMonths(new Date(), 1);
  const projects = await prisma.project.findMany({
    where: { organizationId },
    select: { id: true },
  });

  const projectIds = projects.map((p) => p.id);

  const rankings = await prisma.keywordRanking.findMany({
    where: {
      projectId: { in: projectIds },
      snapshotDate: { gte: thirtyDaysAgo },
    },
    orderBy: { snapshotDate: "asc" },
  });

  const byDate = new Map<string, number>();
  for (const r of rankings) {
    const key = r.snapshotDate.toISOString().split("T")[0];
    if (!byDate.has(key)) byDate.set(key, 0);
    // Estimate traffic based on position (CTR model)
    if (r.position) {
      const ctr = r.position <= 1 ? 0.3 : r.position <= 3 ? 0.15 : r.position <= 10 ? 0.05 : 0.01;
      byDate.set(key, (byDate.get(key) ?? 0) + Math.round(ctr * 500));
    }
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }));
}
