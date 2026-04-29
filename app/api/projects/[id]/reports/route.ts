import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subMonths, format } from "date-fns";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as { organizationId?: string })?.organizationId!;
  const { id: projectId } = await params;

  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: orgId },
    include: {
      domainSnapshots: { orderBy: { snapshotDate: "desc" }, take: 2 },
      keywords: { include: { keywordRankings: { orderBy: { snapshotDate: "desc" }, take: 2 } } },
      backlinks: true,
      onPageAudits: { orderBy: { completedAt: "desc" }, take: 1 },
      aiBrandMentionChecks: { orderBy: { snapshotDate: "desc" }, take: 20 },
    },
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Compute summary
  const snap1 = project.domainSnapshots[0];
  const snap2 = project.domainSnapshots[1];
  const daChange = snap1 && snap2 ? Math.round((snap1.domainAuthority ?? 0) - (snap2.domainAuthority ?? 0)) : 0;

  let kwImproved = 0, kwDeclined = 0;
  for (const kw of project.keywords) {
    const cur = kw.keywordRankings[0]?.position;
    const prev = kw.keywordRankings[1]?.position;
    if (cur && prev) {
      if (cur < prev) kwImproved++;
      if (cur > prev) kwDeclined++;
    }
  }

  const newBL = project.backlinks.filter((b) => b.status === "NEW").length;
  const lostBL = project.backlinks.filter((b) => b.status === "LOST").length;
  const audit = project.onPageAudits[0];
  const mentionRate = project.aiBrandMentionChecks.length > 0
    ? Math.round((project.aiBrandMentionChecks.filter((c) => c.isMentioned).length / project.aiBrandMentionChecks.length) * 100)
    : 0;

  const now = new Date();
  const monthLabel = format(now, "MMMM yyyy");

  const report = await prisma.report.create({
    data: {
      projectId,
      title: `Monthly SEO Report — ${monthLabel}`,
      period: `${format(subMonths(now, 1), "yyyy-MM-dd")} to ${format(now, "yyyy-MM-dd")}`,
      generatedAt: now,
      data: {
        summary: {
          daChange,
          backlinksNew: newBL,
          backlinksLost: lostBL,
          keywordsImproved: kwImproved,
          keywordsDeclined: kwDeclined,
          aiMentionScore: mentionRate,
          healthScore: audit?.healthScore ?? 0,
        },
        topWins: [
          kwImproved > 0 ? `${kwImproved} keyword(s) improved in ranking` : null,
          newBL > 0 ? `${newBL} new backlink(s) acquired` : null,
          daChange > 0 ? `Domain authority increased by ${daChange} points` : null,
        ].filter(Boolean),
        topLosses: [
          kwDeclined > 0 ? `${kwDeclined} keyword(s) declined in ranking` : null,
          lostBL > 0 ? `${lostBL} backlink(s) lost` : null,
          daChange < 0 ? `Domain authority decreased by ${Math.abs(daChange)} points` : null,
        ].filter(Boolean),
        recommendations: [
          audit && audit.criticalIssues && audit.criticalIssues > 0 ? `Fix ${audit.criticalIssues} critical on-page issue(s)` : null,
          "Build more links from high-DA referring domains",
          mentionRate < 50 ? "Improve AI brand visibility with structured content" : null,
          kwDeclined > 0 ? "Refresh declined keyword pages with updated content" : null,
        ].filter(Boolean),
      },
    },
  });

  return NextResponse.json(report, { status: 201 });
}
