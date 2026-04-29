import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDashboardStats, getDomainTrend, getTrafficTrend } from "@/lib/services/dashboard";
import { StatCard } from "@/components/dashboard/stat-card";
import { ScoreRing } from "@/components/dashboard/score-ring";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";
import {
  Globe, TrendingUp, Link2, Brain, Shield,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const orgId = (session?.user as { organizationId?: string })?.organizationId;

  if (!orgId) return <div className="text-muted-foreground">No organization found.</div>;

  const stats = await getDashboardStats(orgId);
  const projects = await prisma.project.findMany({
    where: { organizationId: orgId, isActive: true },
    include: {
      domainSnapshots: { orderBy: { snapshotDate: "desc" }, take: 1 },
      onPageAudits: { orderBy: { completedAt: "desc" }, take: 1 },
    },
    take: 5,
  });

  // For trend charts, use the first project if available
  const firstProjectId = projects[0]?.id;
  const domainTrend = firstProjectId ? await getDomainTrend(firstProjectId) : [];
  const trafficTrend = await getTrafficTrend(orgId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tracking {stats.totalProjects} project{stats.totalProjects !== 1 ? "s" : ""} across your organization.
          {stats.isDemo && " Data shown is estimated / demo."}
        </p>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Projects"
          value={stats.totalProjects}
          icon={<Globe className="h-4 w-4" />}
        />
        <StatCard
          title="Avg. Domain Authority"
          value={stats.avgDomainAuthority}
          change={3}
          changeLabel="mo"
          icon={<Shield className="h-4 w-4" />}
          isDemo={stats.isDemo}
        />
        <StatCard
          title="Keywords Tracked"
          value={stats.totalKeywords}
          change={stats.keywordsImproved - stats.keywordsDeclined}
          changeLabel="net"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          title="Total Backlinks"
          value={stats.totalBacklinks}
          change={stats.newBacklinks - stats.lostBacklinks}
          changeLabel="net"
          icon={<Link2 className="h-4 w-4" />}
          isDemo={stats.isDemo}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Keywords ↑" value={stats.keywordsImproved} />
        <StatCard title="Keywords ↓" value={stats.keywordsDeclined} />
        <StatCard title="New Backlinks" value={stats.newBacklinks} />
        <StatCard title="Lost Backlinks" value={stats.lostBacklinks} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Domain Authority Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {domainTrend.length > 0 ? (
              <TrendChart data={domainTrend} dataKey="value" label="DA" color="#4f7df7" height={160} />
            ) : (
              <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Estimated Traffic Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {trafficTrend.length > 0 ? (
              <TrendChart data={trafficTrend} dataKey="value" label="Est. Traffic" color="#10b981" height={160} />
            ) : (
              <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Scores + Project list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Scores */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Platform Health</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex items-center justify-around">
              <ScoreRing score={stats.avgHealthScore} label="SEO Health" size="md" />
              <ScoreRing score={stats.aiMentionScore} label="AI Visibility" size="md" />
              <ScoreRing score={stats.avgDomainAuthority} label="Avg. DA" size="md" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
                  Improved keywords
                </span>
                <span className="font-medium text-emerald-400">{stats.keywordsImproved}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <ArrowDownRight className="h-3.5 w-3.5 text-red-400" />
                  Declined keywords
                </span>
                <span className="font-medium text-red-400">{stats.keywordsDeclined}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Brain className="h-3.5 w-3.5 text-purple-400" />
                  AI mention score
                </span>
                <span className="font-medium">{stats.aiMentionScore}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projects list */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Link href="/projects" className="text-xs text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {projects.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                No projects yet.{" "}
                <Link href="/projects" className="text-primary hover:underline">Add your first project</Link>
              </div>
            ) : (
              projects.map((project) => {
                const snap = project.domainSnapshots[0];
                const audit = project.onPageAudits[0];
                const health = audit?.healthScore ?? project.healthScore ?? 0;

                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors group"
                  >
                    <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                      <Globe className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{project.name}</p>
                        <Badge variant="outline" className="text-[10px] shrink-0">{project.domain}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        DA {Math.round(snap?.domainAuthority ?? 0)} · {formatNumber(snap?.backlinksCount ?? 0)} backlinks · {formatNumber(snap?.organicKeywords ?? 0)} keywords
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <ScoreRing score={Math.round(health)} size="sm" />
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
