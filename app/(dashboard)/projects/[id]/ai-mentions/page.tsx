import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ScoreRing } from "@/components/dashboard/score-ring";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Brain, Info } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Sentiment } from "@prisma/client";

// ─── helpers ──────────────────────────────────────────────────────────────────

function SentimentBadge({ sentiment }: { sentiment: Sentiment | null }) {
  if (!sentiment) return <span className="text-muted-foreground text-xs">—</span>;
  if (sentiment === "POSITIVE")
    return <Badge className="border-transparent bg-emerald-900/40 text-emerald-400 text-xs">Positive</Badge>;
  if (sentiment === "NEGATIVE")
    return <Badge className="border-transparent bg-red-900/40 text-red-400 text-xs">Negative</Badge>;
  return <Badge className="border-transparent bg-zinc-800 text-zinc-400 text-xs">Neutral</Badge>;
}

function MentionBadge({ mentioned }: { mentioned: boolean }) {
  return mentioned ? (
    <Badge className="border-transparent bg-emerald-900/40 text-emerald-400 text-xs">Yes</Badge>
  ) : (
    <Badge className="border-transparent bg-zinc-800 text-zinc-400 text-xs">No</Badge>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function AIMentionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) redirect("/");

  // Fetch all AI brand mention checks with platform data
  const checks = await prisma.aIBrandMentionCheck.findMany({
    where: { projectId: id },
    include: { platform: true },
    orderBy: { snapshotDate: "desc" },
  });

  // Overall AI visibility score
  const totalChecks = checks.length;
  const mentionedChecks = checks.filter((c) => c.isMentioned).length;
  const aiScore = totalChecks > 0 ? Math.round((mentionedChecks / totalChecks) * 100) : 0;

  // Group by platform
  type PlatformStat = {
    platformId: string;
    name: string;
    totalChecks: number;
    mentionCount: number;
    positions: number[];
    sentiments: (Sentiment | null)[];
  };

  const platformMap = new Map<string, PlatformStat>();
  for (const check of checks) {
    const entry = platformMap.get(check.platformId) ?? {
      platformId: check.platformId,
      name: check.platform.name,
      totalChecks: 0,
      mentionCount: 0,
      positions: [],
      sentiments: [],
    };
    entry.totalChecks += 1;
    if (check.isMentioned) entry.mentionCount += 1;
    if (check.mentionPosition != null) entry.positions.push(check.mentionPosition);
    entry.sentiments.push(check.sentiment);
    platformMap.set(check.platformId, entry);
  }

  const platformStats = Array.from(platformMap.values()).map((p) => {
    const mentionRate = p.totalChecks > 0 ? (p.mentionCount / p.totalChecks) * 100 : 0;
    const avgPosition =
      p.positions.length > 0
        ? p.positions.reduce((a, b) => a + b, 0) / p.positions.length
        : null;
    const nonNullSentiments = p.sentiments.filter((s) => s != null) as Sentiment[];
    const sentimentCounts = nonNullSentiments.reduce(
      (acc, s) => { acc[s] = (acc[s] ?? 0) + 1; return acc; },
      {} as Record<Sentiment, number>
    );
    const dominantSentiment: Sentiment | null =
      nonNullSentiments.length > 0
        ? (Object.entries(sentimentCounts).sort((a, b) => b[1] - a[1])[0][0] as Sentiment)
        : null;

    return { ...p, mentionRate, avgPosition, dominantSentiment };
  });

  // Recent checks (latest 50)
  const recentChecks = checks.slice(0, 50);

  const isDemo = checks.some((c) => c.isDemo);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-400" />
            AI Brand Mentions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            How often your brand appears in AI-generated responses for{" "}
            <span className="text-foreground font-medium">{project.domain}</span>
          </p>
        </div>
        {isDemo && (
          <div className="flex items-center gap-1.5 text-xs text-yellow-400 bg-yellow-900/20 border border-yellow-900/40 px-3 py-1.5 rounded-full">
            <Info className="h-3.5 w-3.5 shrink-0" />
            Demo / estimated data
          </div>
        )}
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Checks"
          value={totalChecks}
          icon={<Brain className="h-4 w-4" />}
          isDemo={isDemo}
        />
        <StatCard
          title="Times Mentioned"
          value={mentionedChecks}
          icon={<Brain className="h-4 w-4" />}
          isDemo={isDemo}
        />
        <StatCard
          title="Not Mentioned"
          value={totalChecks - mentionedChecks}
          icon={<Brain className="h-4 w-4" />}
          isDemo={isDemo}
        />
        <StatCard
          title="Platforms Tracked"
          value={platformStats.length}
          icon={<Brain className="h-4 w-4" />}
        />
      </div>

      {/* AI Visibility Score ring */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Overall AI Visibility Score</CardTitle>
          <CardDescription>
            Percentage of AI prompt checks where your brand was mentioned
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 pb-6">
          <ScoreRing score={aiScore} label="AI Visibility" size="lg" />
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Your brand appears in{" "}
            <span className="text-foreground font-semibold">{aiScore}%</span> of
            AI-generated responses across all tracked platforms.{" "}
            {aiScore >= 50
              ? "Strong AI visibility — your brand is well represented."
              : aiScore >= 25
              ? "Moderate AI visibility — room for improvement."
              : "Low AI visibility — consider optimizing for AI search."}
          </p>
        </CardContent>
      </Card>

      {/* Platform comparison table */}
      {platformStats.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Platform Comparison</CardTitle>
            <CardDescription>Mention rate and sentiment broken down by AI platform</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs text-muted-foreground font-medium px-6 py-3">Platform</th>
                    <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">Total Checks</th>
                    <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">Mentions</th>
                    <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">Mention Rate</th>
                    <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">Avg Position</th>
                    <th className="text-center text-xs text-muted-foreground font-medium px-4 py-3">Avg Sentiment</th>
                  </tr>
                </thead>
                <tbody>
                  {platformStats.map((p, idx) => (
                    <tr
                      key={p.platformId}
                      className={idx % 2 === 0 ? "bg-card" : "bg-muted/30"}
                    >
                      <td className="px-6 py-3 font-medium text-foreground">{p.name}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{p.totalChecks}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-foreground">{p.mentionCount}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span
                          className={
                            p.mentionRate >= 50
                              ? "text-emerald-400"
                              : p.mentionRate >= 25
                              ? "text-yellow-400"
                              : "text-red-400"
                          }
                        >
                          {p.mentionRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {p.avgPosition != null ? p.avgPosition.toFixed(1) : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <SentimentBadge sentiment={p.dominantSentiment} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent checks */}
      {recentChecks.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Recent Check Results</CardTitle>
            <CardDescription>Latest AI prompt results — showing up to 50 most recent</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs text-muted-foreground font-medium px-6 py-3">Prompt</th>
                    <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">Platform</th>
                    <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">Response Preview</th>
                    <th className="text-center text-xs text-muted-foreground font-medium px-4 py-3">Mentioned</th>
                    <th className="text-center text-xs text-muted-foreground font-medium px-4 py-3">Sentiment</th>
                    <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentChecks.map((check, idx) => {
                    const preview = check.response
                      ? check.response.length > 120
                        ? check.response.slice(0, 120) + "…"
                        : check.response
                      : null;

                    return (
                      <tr
                        key={check.id}
                        className={idx % 2 === 0 ? "bg-card" : "bg-muted/30"}
                      >
                        <td className="px-6 py-3 max-w-[220px]">
                          <span className="line-clamp-2 text-foreground text-xs leading-relaxed">
                            {check.prompt}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-xs text-muted-foreground">{check.platform.name}</span>
                        </td>
                        <td className="px-4 py-3 max-w-[300px]">
                          {preview ? (
                            <span className="text-xs text-muted-foreground leading-relaxed">{preview}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground/50 italic">No response recorded</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <MentionBadge mentioned={check.isMentioned} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <SentimentBadge sentiment={check.sentiment} />
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(check.snapshotDate)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <Brain className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">No AI brand checks recorded yet</p>
            <p className="text-sm text-muted-foreground/70 text-center max-w-sm">
              AI brand mention checks will appear here once your first scheduled job runs.
            </p>
          </CardContent>
        </Card>
      )}

      <Separator />
      <p className="text-xs text-muted-foreground/60 text-center pb-2">
        AI visibility data is estimated based on sampled prompts. Results may vary across AI platforms and prompt phrasing.
      </p>
    </div>
  );
}
