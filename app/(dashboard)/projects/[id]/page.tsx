import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Link2,
  BarChart3,
  FileSearch,
  RefreshCw,
  TrendingUp,
  ExternalLink,
  Calendar,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatCard } from "@/components/dashboard/stat-card";
import { ScoreRing } from "@/components/dashboard/score-ring";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { formatNumber, formatDate, cn } from "@/lib/utils";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const orgId = (session.user as { organizationId?: string })?.organizationId;
  const { id } = await params;

  // ── Fetch project with all related data ──────────────────────────────────
  const project = await prisma.project.findFirst({
    where: { id, organizationId: orgId },
    include: {
      domainSnapshots: {
        orderBy: { snapshotDate: "desc" },
        take: 6,
      },
      onPageAudits: {
        orderBy: { completedAt: "desc" },
        take: 1,
        include: {
          onPageIssues: {
            where: { severity: "CRITICAL", isFixed: false },
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      },
      keywords: {
        where: { isActive: true },
        include: {
          keywordRankings: {
            orderBy: { snapshotDate: "desc" },
            take: 2,
          },
        },
        take: 50,
      },
      backlinks: {
        orderBy: { firstSeen: "desc" },
        take: 6,
        where: { status: { in: ["ACTIVE", "NEW"] } },
      },
      competitors: {
        include: {
          competitorSnapshots: {
            orderBy: { snapshotDate: "desc" },
            take: 1,
          },
        },
        take: 5,
      },
    },
  });

  if (!project) notFound();

  // ── Derived data ──────────────────────────────────────────────────────────
  const latestSnap = project.domainSnapshots[0];
  const latestAudit = project.onPageAudits[0];
  const health = latestAudit?.healthScore ?? project.healthScore ?? 0;

  // DA trend (oldest → newest for chart)
  const daTrend = [...project.domainSnapshots]
    .reverse()
    .map((s) => ({
      date: s.snapshotDate.toISOString().split("T")[0],
      value: s.domainAuthority ?? 0,
    }));

  // Keyword wins/losses
  type KwRow = { id: string; term: string; position: number; previousPosition: number; change: number };
  const wins: KwRow[] = [];
  const losses: KwRow[] = [];

  for (const kw of project.keywords) {
    const latest = kw.keywordRankings[0];
    const prev = kw.keywordRankings[1];
    if (!latest?.position || !prev?.position) continue;
    const delta = prev.position - latest.position; // positive = improved
    const row: KwRow = {
      id: kw.id,
      term: kw.term,
      position: latest.position,
      previousPosition: prev.position,
      change: delta,
    };
    if (delta > 0) wins.push(row);
    if (delta < 0) losses.push(row);
  }

  wins.sort((a, b) => b.change - a.change);
  losses.sort((a, b) => a.change - b.change);

  // Avg position
  const rankedKws = project.keywords.filter((k) => k.keywordRankings[0]?.position);
  const avgPos =
    rankedKws.length > 0
      ? Math.round(
          rankedKws.reduce((s, k) => s + (k.keywordRankings[0].position ?? 0), 0) /
            rankedKws.length
        )
      : null;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Globe className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
              <Badge variant={project.isActive ? "success" : "secondary"} className="text-xs">
                {project.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm text-muted-foreground">{project.domain}</span>
              <a
                href={`https://${project.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
            {project.lastCrawledAt && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <Calendar className="h-3 w-3" />
                Last crawled {formatDate(project.lastCrawledAt)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/projects/${id}/keywords`}>
              <TrendingUp className="h-4 w-4" />
              Keywords
            </Link>
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
            Run Audit
          </Button>
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4" />
            Check Rankings
          </Button>
          <Button size="sm">
            <FileSearch className="h-4 w-4" />
            View Report
          </Button>
        </div>
      </div>

      {/* ── Stat row ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          title="Domain Authority"
          value={latestSnap?.domainAuthority != null ? Math.round(latestSnap.domainAuthority) : 0}
          icon={<Globe className="h-4 w-4" />}
        />
        <StatCard
          title="Backlinks"
          value={latestSnap?.backlinksCount ?? 0}
          icon={<Link2 className="h-4 w-4" />}
        />
        <StatCard
          title="Ref. Domains"
          value={latestSnap?.referringDomainsCount ?? 0}
          icon={<Link2 className="h-4 w-4" />}
        />
        <StatCard
          title="Organic Keywords"
          value={latestSnap?.organicKeywords ?? 0}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          title="Avg. Position"
          value={avgPos ?? "—"}
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center h-full">
            <ScoreRing score={Math.round(health)} size="sm" label="Health" />
          </CardContent>
        </Card>
      </div>

      {/* ── DA Trend Chart ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Domain Authority Trend (last 6 snapshots)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {daTrend.length > 1 ? (
            <TrendChart
              data={daTrend}
              dataKey="value"
              label="DA"
              color="#4f7df7"
              height={180}
            />
          ) : (
            <div className="h-44 flex items-center justify-center text-muted-foreground text-sm">
              Not enough data yet — run a domain snapshot to start tracking.
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Wins / Losses + On-Page Issues row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Wins */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-emerald-400" />
              Top Wins
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pt-0">
            {wins.slice(0, 5).length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No improvements detected yet.</p>
            ) : (
              wins.slice(0, 5).map((kw) => (
                <div key={kw.id} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/40 transition-colors">
                  <span className="text-sm truncate flex-1 pr-2">{kw.term}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">#{kw.position}</span>
                    <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-400">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      {kw.change}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Losses */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ArrowDownRight className="h-4 w-4 text-red-400" />
              Top Losses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pt-0">
            {losses.slice(0, 5).length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No declines detected yet.</p>
            ) : (
              losses.slice(0, 5).map((kw) => (
                <div key={kw.id} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/40 transition-colors">
                  <span className="text-sm truncate flex-1 pr-2">{kw.term}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">#{kw.position}</span>
                    <span className="flex items-center gap-0.5 text-xs font-medium text-red-400">
                      <ArrowDownRight className="h-3.5 w-3.5" />
                      {Math.abs(kw.change)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* On-Page Issues */}
        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              Critical Issues
            </CardTitle>
            {latestAudit && (
              <Badge variant="destructive" className="text-[10px]">
                {latestAudit.criticalIssues ?? 0} critical
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-1 pt-0">
            {!latestAudit || latestAudit.onPageIssues.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                {latestAudit ? "No critical issues found." : "No audit run yet."}
              </p>
            ) : (
              latestAudit.onPageIssues.map((issue) => (
                <div key={issue.id} className="py-1.5 px-2 rounded-md hover:bg-muted/40 transition-colors">
                  <p className="text-sm font-medium truncate">{issue.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{issue.url}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Backlinks + Competitors ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Backlinks */}
        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" />
              Recent Backlinks
            </CardTitle>
            <Link
              href={`/projects/${id}/backlinks`}
              className="text-xs text-primary hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-1 pt-0">
            {project.backlinks.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No backlinks tracked yet.</p>
            ) : (
              project.backlinks.slice(0, 6).map((bl) => {
                let displayUrl = bl.sourceUrl;
                try {
                  displayUrl = new URL(bl.sourceUrl).hostname.replace(/^www\./, "");
                } catch { /* keep raw */ }

                return (
                  <div key={bl.id} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/40 transition-colors">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-sm truncate">{displayUrl}</p>
                      {bl.anchorText && (
                        <p className="text-xs text-muted-foreground truncate">{bl.anchorText}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {bl.domainAuthority != null && (
                        <span className="text-[10px] text-muted-foreground">
                          DA {Math.round(bl.domainAuthority)}
                        </span>
                      )}
                      <Badge
                        variant={bl.status === "NEW" ? "success" : "outline"}
                        className="text-[10px] px-1.5 h-4"
                      >
                        {bl.status}
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Competitor Comparison */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Competitor Comparison
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {project.competitors.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No competitors tracked. Add competitors to compare.
              </p>
            ) : (
              <div className="space-y-1">
                {/* Header row */}
                <div className="grid grid-cols-4 gap-2 px-2 pb-1">
                  <span className="text-[10px] text-muted-foreground col-span-2">Domain</span>
                  <span className="text-[10px] text-muted-foreground text-right">DA</span>
                  <span className="text-[10px] text-muted-foreground text-right">Keywords</span>
                </div>
                <Separator />
                {/* Own row */}
                <div className="grid grid-cols-4 gap-2 py-1.5 px-2 rounded-md bg-primary/5">
                  <span className="text-sm font-medium col-span-2 truncate text-primary">
                    {project.domain}
                    <span className="ml-1.5 text-[10px] text-primary/60">(you)</span>
                  </span>
                  <span className="text-sm text-right tabular-nums">
                    {latestSnap?.domainAuthority != null ? Math.round(latestSnap.domainAuthority) : "—"}
                  </span>
                  <span className="text-sm text-right tabular-nums">
                    {latestSnap?.organicKeywords != null ? formatNumber(latestSnap.organicKeywords) : "—"}
                  </span>
                </div>
                {/* Competitor rows */}
                {project.competitors.map((comp) => {
                  const snap = comp.competitorSnapshots[0];
                  return (
                    <div key={comp.id} className="grid grid-cols-4 gap-2 py-1.5 px-2 rounded-md hover:bg-muted/40 transition-colors">
                      <span className="text-sm col-span-2 truncate text-muted-foreground">
                        {comp.name ?? comp.domain}
                      </span>
                      <span className="text-sm text-right tabular-nums">
                        {snap?.domainAuthority != null ? Math.round(snap.domainAuthority) : "—"}
                      </span>
                      <span className="text-sm text-right tabular-nums">
                        {snap?.organicKeywords != null ? formatNumber(snap.organicKeywords) : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
