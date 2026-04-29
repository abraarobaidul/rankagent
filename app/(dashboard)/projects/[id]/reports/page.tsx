import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ScoreRing } from "@/components/dashboard/score-ring";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { GenerateReportButton } from "./generate-report-button";
import {
  FileText,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Lightbulb,
  Calendar,
} from "lucide-react";
import { formatDate, formatNumber } from "@/lib/utils";

// ─── Report data shape ────────────────────────────────────────────────────────

interface ReportData {
  daChange?: number | null;
  backlinksNet?: number | null;
  keywordsImproved?: number | null;
  keywordsDeclined?: number | null;
  aiScore?: number | null;
  healthScore?: number | null;
  improved?: string[];
  declined?: string[];
  recommendations?: string[];
  summary?: string;
}

function parseReportData(raw: unknown): ReportData {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return {};
  const d = raw as Record<string, unknown>;
  return {
    daChange: typeof d.daChange === "number" ? d.daChange : null,
    backlinksNet: typeof d.backlinksNet === "number" ? d.backlinksNet : null,
    keywordsImproved: typeof d.keywordsImproved === "number" ? d.keywordsImproved : null,
    keywordsDeclined: typeof d.keywordsDeclined === "number" ? d.keywordsDeclined : null,
    aiScore: typeof d.aiScore === "number" ? d.aiScore : null,
    healthScore: typeof d.healthScore === "number" ? d.healthScore : null,
    improved: Array.isArray(d.improved) ? d.improved.filter((s) => typeof s === "string") : [],
    declined: Array.isArray(d.declined) ? d.declined.filter((s) => typeof s === "string") : [],
    recommendations: Array.isArray(d.recommendations)
      ? d.recommendations.filter((s) => typeof s === "string")
      : [],
    summary: typeof d.summary === "string" ? d.summary : undefined,
  };
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function DeltaBadge({ value, suffix = "" }: { value: number | null | undefined; suffix?: string }) {
  if (value == null) return <span className="text-muted-foreground text-sm">—</span>;
  const isPositive = value > 0;
  const isZero = value === 0;
  return (
    <span
      className={
        isZero
          ? "text-muted-foreground text-sm"
          : isPositive
          ? "text-emerald-400 text-sm font-medium"
          : "text-red-400 text-sm font-medium"
      }
    >
      {isPositive ? "+" : ""}
      {value}
      {suffix}
    </span>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) redirect("/");

  const reports = await prisma.report.findMany({
    where: { projectId: id },
    orderBy: { generatedAt: "desc" },
  });

  const latestReport = reports[0] ?? null;
  const olderReports = reports.slice(1);
  const latestData = latestReport ? parseReportData(latestReport.data) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Monthly Reports
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            SEO performance reports for{" "}
            <span className="text-foreground font-medium">{project.domain}</span>
            {" · "}{reports.length} report{reports.length !== 1 ? "s" : ""} generated
          </p>
        </div>
        <GenerateReportButton projectId={id} />
      </div>

      {reports.length === 0 ? (
        // Empty state
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <FileText className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground font-medium text-lg">No reports yet</p>
            <p className="text-sm text-muted-foreground/70 text-center max-w-sm">
              Generate your first monthly SEO report to track progress, identify wins, and get actionable recommendations.
            </p>
            <GenerateReportButton projectId={id} />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Latest report — expanded */}
          {latestReport && latestData && (
            <Card className="border-primary/20">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-base font-semibold">{latestReport.title}</CardTitle>
                      <Badge variant="default" className="text-xs">Latest</Badge>
                    </div>
                    <CardDescription className="flex items-center gap-1.5 mt-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Period: {latestReport.period} · Generated {formatDate(latestReport.generatedAt)}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary text */}
                {latestData.summary && (
                  <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-primary/40 pl-4">
                    {latestData.summary}
                  </p>
                )}

                {/* Summary metric cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  <Card className="bg-muted/30">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">DA Change</p>
                      <DeltaBadge value={latestData.daChange} />
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/30">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Backlinks Net</p>
                      <DeltaBadge value={latestData.backlinksNet} />
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/30">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Keywords Up</p>
                      <DeltaBadge value={latestData.keywordsImproved} />
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/30">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Keywords Down</p>
                      <DeltaBadge value={
                        latestData.keywordsDeclined != null ? -latestData.keywordsDeclined : null
                      } />
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/30">
                    <CardContent className="p-4 flex flex-col items-center gap-1">
                      <p className="text-xs text-muted-foreground">AI Score</p>
                      {latestData.aiScore != null ? (
                        <ScoreRing score={latestData.aiScore} size="sm" />
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Health score ring */}
                {latestData.healthScore != null && (
                  <div className="flex items-center gap-4">
                    <ScoreRing score={latestData.healthScore} label="Health Score" size="md" />
                    <div>
                      <p className="text-sm font-medium">SEO Health Score</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {latestData.healthScore >= 75
                          ? "Good — site is in healthy condition."
                          : latestData.healthScore >= 50
                          ? "Moderate — some issues need attention."
                          : "Poor — critical issues detected."}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* What improved */}
                  {(latestData.improved?.length ?? 0) > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
                        <ArrowUpRight className="h-4 w-4" />
                        What Improved
                      </h3>
                      <ul className="space-y-1.5">
                        {latestData.improved!.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* What declined */}
                  {(latestData.declined?.length ?? 0) > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-red-400 flex items-center gap-1.5">
                        <ArrowDownRight className="h-4 w-4" />
                        What Declined
                      </h3>
                      <ul className="space-y-1.5">
                        {latestData.declined!.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                            <TrendingDown className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Recommendations */}
                {(latestData.recommendations?.length ?? 0) > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-yellow-400 flex items-center gap-1.5">
                      <Lightbulb className="h-4 w-4" />
                      Recommendations
                    </h3>
                    <ul className="space-y-2">
                      {latestData.recommendations!.map((rec, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 text-sm text-foreground p-3 rounded-lg bg-yellow-900/10 border border-yellow-900/20"
                        >
                          <span className="text-yellow-400 font-mono text-xs mt-0.5 shrink-0">
                            {idx + 1}.
                          </span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Older reports table */}
          {olderReports.length > 0 && (
            <>
              <Separator />
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Previous Reports</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left text-xs text-muted-foreground font-medium px-6 py-3">Report</th>
                          <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">Period</th>
                          <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">DA Change</th>
                          <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">Keywords Up</th>
                          <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">Keywords Down</th>
                          <th className="text-center text-xs text-muted-foreground font-medium px-4 py-3">Health Score</th>
                          <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">Generated</th>
                        </tr>
                      </thead>
                      <tbody>
                        {olderReports.map((report, idx) => {
                          const d = parseReportData(report.data);
                          return (
                            <tr
                              key={report.id}
                              className={idx % 2 === 0 ? "bg-card" : "bg-muted/30"}
                            >
                              <td className="px-6 py-3">
                                <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                                  {report.title}
                                </p>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                                {report.period}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <DeltaBadge value={d.daChange} />
                              </td>
                              <td className="px-4 py-3 text-right">
                                <DeltaBadge value={d.keywordsImproved} />
                              </td>
                              <td className="px-4 py-3 text-right">
                                <DeltaBadge value={
                                  d.keywordsDeclined != null ? -d.keywordsDeclined : null
                                } />
                              </td>
                              <td className="px-4 py-3 text-center">
                                {d.healthScore != null ? (
                                  <ScoreRing score={d.healthScore} size="sm" />
                                ) : (
                                  <span className="text-muted-foreground text-xs">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right text-xs text-muted-foreground whitespace-nowrap">
                                {formatDate(report.generatedAt)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
