import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWebCrawlerProvider } from "@/lib/providers";
import { calcSEOHealthScore } from "@/lib/scoring";
import { IssueSeverity } from "@/app/generated/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as { organizationId?: string })?.organizationId!;
  const { id: projectId } = await params;

  const project = await prisma.project.findFirst({ where: { id: projectId, organizationId: orgId } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const crawler = getWebCrawlerProvider();
  const pages = await crawler.crawl(project.domain, 20);

  // Build issues from crawled pages
  type IssueInput = {
    url: string; issueType: string; severity: IssueSeverity;
    title: string; description: string; recommendation: string;
  };
  const issues: IssueInput[] = [];

  for (const page of pages) {
    if (!page.title) issues.push({ url: page.url, issueType: "missing_title", severity: "CRITICAL", title: "Missing Title Tag", description: "No <title> tag found.", recommendation: "Add a descriptive title between 50–60 characters." });
    else if (page.title.length > 60) issues.push({ url: page.url, issueType: "long_title", severity: "WARNING", title: "Title Too Long", description: `Title is ${page.title.length} characters.`, recommendation: "Shorten to 50–60 characters." });

    if (!page.metaDescription) issues.push({ url: page.url, issueType: "missing_meta", severity: "CRITICAL", title: "Missing Meta Description", description: "No meta description.", recommendation: "Add a meta description of 150–160 characters." });

    if (page.h1.length === 0) issues.push({ url: page.url, issueType: "missing_h1", severity: "WARNING", title: "Missing H1 Tag", description: "Page has no H1 heading.", recommendation: "Add one descriptive H1 tag per page." });
    else if (page.h1.length > 1) issues.push({ url: page.url, issueType: "multiple_h1", severity: "WARNING", title: "Multiple H1 Tags", description: `Found ${page.h1.length} H1 tags.`, recommendation: "Use only one H1 per page." });

    if (!page.canonicalUrl) issues.push({ url: page.url, issueType: "missing_canonical", severity: "NOTICE", title: "Missing Canonical Tag", description: "No canonical URL set.", recommendation: "Add a canonical tag to prevent duplicate content." });

    if (!page.isIndexable) issues.push({ url: page.url, issueType: "noindex", severity: "NOTICE", title: "Page Set to Noindex", description: "Robot meta prevents indexing.", recommendation: "Confirm this is intentional." });

    if (page.imagesMissingAlt > 0) issues.push({ url: page.url, issueType: "missing_alt", severity: "WARNING", title: "Images Missing Alt Text", description: `${page.imagesMissingAlt} image(s) lack alt text.`, recommendation: "Add descriptive alt attributes." });

    if (page.brokenLinks > 0) issues.push({ url: page.url, issueType: "broken_link", severity: "CRITICAL", title: "Broken Links Found", description: `${page.brokenLinks} broken link(s) on this page.`, recommendation: "Fix or remove broken links." });

    if (page.wordCount < 300 && page.isIndexable) issues.push({ url: page.url, issueType: "thin_content", severity: "WARNING", title: "Thin Content", description: `Only ${page.wordCount} words.`, recommendation: "Expand to at least 300 words." });

    if (!page.hasOpenGraph) issues.push({ url: page.url, issueType: "missing_og", severity: "NOTICE", title: "Missing Open Graph Tags", description: "No OG meta tags.", recommendation: "Add og:title, og:description, og:image." });

    if (page.statusCode === 404) issues.push({ url: page.url, issueType: "404", severity: "CRITICAL", title: "Page Returns 404", description: "This URL returns a 404.", recommendation: "Fix or redirect the URL." });
  }

  const critical = issues.filter((i) => i.severity === "CRITICAL").length;
  const warning = issues.filter((i) => i.severity === "WARNING").length;
  const notice = issues.filter((i) => i.severity === "NOTICE").length;

  const healthScore = calcSEOHealthScore({
    totalIssues: issues.length,
    criticalIssues: critical,
    warningIssues: warning,
    noticeIssues: notice,
    totalPages: pages.length,
  });

  const audit = await prisma.onPageAudit.create({
    data: {
      projectId,
      startedAt: new Date(),
      completedAt: new Date(),
      totalPages: pages.length,
      totalIssues: issues.length,
      criticalIssues: critical,
      warningIssues: warning,
      noticeIssues: notice,
      healthScore,
      isDemo: true,
      onPageIssues: {
        create: issues.map((issue) => ({
          projectId,
          url: issue.url,
          issueType: issue.issueType,
          severity: issue.severity,
          title: issue.title,
          description: issue.description,
          recommendation: issue.recommendation,
          isFixed: false,
        })),
      },
    },
  });

  // Update project health score
  await prisma.project.update({ where: { id: projectId }, data: { healthScore, lastCrawledAt: new Date() } });

  return NextResponse.json({ auditId: audit.id, healthScore, totalIssues: issues.length }, { status: 201 });
}
