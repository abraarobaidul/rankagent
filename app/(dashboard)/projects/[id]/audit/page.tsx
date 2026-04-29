import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ScoreRing } from "@/components/dashboard/score-ring";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { AuditTabs } from "./audit-tabs";
import { Shield, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { IssueSeverity } from "@/prisma/generated/prisma";
import type { OnPageIssue } from "@/prisma/generated/prisma";

// ─── helpers ──────────────────────────────────────────────────────────────────

export function SeverityBadge({ severity }: { severity: IssueSeverity }) {
  if (severity === "CRITICAL")
    return <Badge className="border-transparent bg-red-900/40 text-red-400 text-xs">Critical</Badge>;
  if (severity === "WARNING")
    return <Badge className="border-transparent bg-yellow-900/40 text-yellow-400 text-xs">Warning</Badge>;
  return <Badge className="border-transparent bg-blue-900/40 text-blue-400 text-xs">Notice</Badge>;
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function AuditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) redirect("/");

  // Fetch latest audit with all issues
  const audit = await prisma.onPageAudit.findFirst({
    where: { projectId: id },
    orderBy: { completedAt: "desc" },
    include: {
      onPageIssues: {
        orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
      },
    },
  });

  const healthScore = audit?.healthScore ?? 0;
  const totalPages = audit?.totalPages ?? 0;
  const criticalCount = audit?.criticalIssues ?? 0;
  const warningCount = audit?.warningIssues ?? 0;
  const noticeCount = audit?.noticeIssues ?? 0;
  const totalIssues = audit?.totalIssues ?? 0;

  const issues: OnPageIssue[] = audit?.onPageIssues ?? [];
  const criticalIssues = issues.filter((i) => i.severity === "CRITICAL");
  const warningIssues = issues.filter((i) => i.severity === "WARNING");
  const noticeIssues = issues.filter((i) => i.severity === "NOTICE");

  // Top 5 critical
  const top5Critical = criticalIssues.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            On-Page SEO Audit
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {audit
              ? `Last audit completed ${audit.completedAt ? formatDate(audit.completedAt) : "—"} · ${totalPages} pages crawled`
              : `No audit run yet for ${project.domain}`}
          </p>
        </div>
        <form action={`/api/projects/${id}/audit`} method="POST">
          <button
            type="submit"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Shield className="h-3.5 w-3.5" />
            Run New Audit
          </button>
        </form>
      </div>

      {!audit ? (
        // Empty state
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <Shield className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground font-medium text-lg">No audit data yet</p>
            <p className="text-sm text-muted-foreground/70 text-center max-w-sm">
              Run your first SEO audit to discover on-page issues affecting your search rankings.
            </p>
            <form action={`/api/projects/${id}/audit`} method="POST" className="mt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 h-9 px-5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Run First Audit
              </button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Score + summary */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Score ring */}
            <Card className="flex flex-col items-center justify-center py-6 gap-3">
              <ScoreRing score={healthScore} label="Health Score" size="lg" />
              <p className="text-xs text-muted-foreground text-center px-4">
                {healthScore >= 75
                  ? "Good — few issues detected"
                  : healthScore >= 50
                  ? "Moderate — needs attention"
                  : "Poor — critical issues found"}
              </p>
            </Card>

            {/* Summary stats */}
            <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                title="Total Pages"
                value={totalPages}
                icon={<Info className="h-4 w-4" />}
              />
              <StatCard
                title="Critical Issues"
                value={criticalCount}
                icon={<AlertTriangle className="h-4 w-4" />}
                className="border-red-900/40"
              />
              <StatCard
                title="Warnings"
                value={warningCount}
                icon={<AlertTriangle className="h-4 w-4" />}
                className="border-yellow-900/40"
              />
              <StatCard
                title="Notices"
                value={noticeCount}
                icon={<Info className="h-4 w-4" />}
                className="border-blue-900/40"
              />
            </div>
          </div>

          {/* Issue distribution bars */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Issue Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-red-400 font-medium">Critical</span>
                  <span className="text-muted-foreground tabular-nums">
                    {criticalCount} / {totalIssues}
                  </span>
                </div>
                <Progress
                  value={totalIssues > 0 ? (criticalCount / totalIssues) * 100 : 0}
                  className="h-2 bg-muted"
                  // @ts-expect-error indicatorClassName not in types but works
                  indicatorClassName="bg-red-500"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-yellow-400 font-medium">Warning</span>
                  <span className="text-muted-foreground tabular-nums">
                    {warningCount} / {totalIssues}
                  </span>
                </div>
                <Progress
                  value={totalIssues > 0 ? (warningCount / totalIssues) * 100 : 0}
                  className="h-2 bg-muted"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-blue-400 font-medium">Notice</span>
                  <span className="text-muted-foreground tabular-nums">
                    {noticeCount} / {totalIssues}
                  </span>
                </div>
                <Progress
                  value={totalIssues > 0 ? (noticeCount / totalIssues) * 100 : 0}
                  className="h-2 bg-muted"
                />
              </div>
            </CardContent>
          </Card>

          {/* Top 5 critical issues highlight */}
          {top5Critical.length > 0 && (
            <Card className="border-red-900/40 bg-red-950/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-red-400 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Top Critical Issues
                </CardTitle>
                <CardDescription>These require immediate attention to protect rankings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {top5Critical.map((issue, idx) => (
                  <div
                    key={issue.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border"
                  >
                    <span className="text-xs text-muted-foreground font-mono mt-0.5 w-4 shrink-0">
                      {idx + 1}.
                    </span>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="text-sm font-medium text-foreground">{issue.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{issue.url}</p>
                      {issue.recommendation && (
                        <p className="text-xs text-muted-foreground/80 mt-1">{issue.recommendation}</p>
                      )}
                    </div>
                    <SeverityBadge severity={issue.severity} />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* All issues with tabs */}
          <AuditTabs
            allIssues={issues}
            criticalIssues={criticalIssues}
            warningIssues={warningIssues}
            noticeIssues={noticeIssues}
          />
        </>
      )}
    </div>
  );
}
