import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AddCompetitorButton } from "./add-competitor-button";
import { Globe, TrendingUp } from "lucide-react";
import { formatNumber } from "@/lib/utils";

// ─── helpers ──────────────────────────────────────────────────────────────────

function MetricCell({
  value,
  ourValue,
  isHigherBetter = true,
  format = "number",
}: {
  value: number | null | undefined;
  ourValue: number | null | undefined;
  isHigherBetter?: boolean;
  format?: "number" | "round";
}) {
  if (value == null) return <span className="text-muted-foreground">—</span>;

  const formatted = format === "round" ? Math.round(value).toString() : formatNumber(value);

  if (ourValue == null) return <span className="text-foreground tabular-nums">{formatted}</span>;

  const isBetter = isHigherBetter ? value > ourValue : value < ourValue;
  const isEqual = value === ourValue;

  return (
    <span
      className={
        isEqual
          ? "text-foreground tabular-nums"
          : isBetter
          ? "text-emerald-400 tabular-nums font-medium"
          : "text-red-400 tabular-nums"
      }
    >
      {formatted}
      {!isEqual && (
        <span className="text-xs ml-1">{isBetter ? "▲" : "▼"}</span>
      )}
    </span>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function CompetitorsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      domainSnapshots: { orderBy: { snapshotDate: "desc" }, take: 1 },
    },
  });
  if (!project) redirect("/");

  // Fetch competitors with their latest snapshot
  const competitors = await prisma.competitor.findMany({
    where: { projectId: id },
    include: {
      competitorSnapshots: {
        orderBy: { snapshotDate: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const ourSnap = project.domainSnapshots[0];
  const ourDA = ourSnap?.domainAuthority ?? null;
  const ourBacklinks = ourSnap?.backlinksCount ?? null;
  const ourKeywords = ourSnap?.organicKeywords ?? null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Competitor Analysis
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Compare <span className="text-foreground font-medium">{project.domain}</span> against{" "}
            {competitors.length} tracked competitor{competitors.length !== 1 ? "s" : ""}
          </p>
        </div>
        <AddCompetitorButton projectId={id} />
      </div>

      {/* Our project baseline */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-primary">Your Project (Baseline)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              <Globe className="h-4 w-4 text-primary" />
            </div>
            <span className="font-semibold text-foreground">{project.domain}</span>
            <div className="flex items-center gap-4 text-sm ml-auto flex-wrap">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">DA</p>
                <p className="font-bold text-foreground tabular-nums">
                  {ourDA != null ? Math.round(ourDA) : "—"}
                </p>
              </div>
              <Separator orientation="vertical" className="h-8" />
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Backlinks</p>
                <p className="font-bold text-foreground tabular-nums">
                  {ourBacklinks != null ? formatNumber(ourBacklinks) : "—"}
                </p>
              </div>
              <Separator orientation="vertical" className="h-8" />
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Organic Keywords</p>
                <p className="font-bold text-foreground tabular-nums">
                  {ourKeywords != null ? formatNumber(ourKeywords) : "—"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison table */}
      {competitors.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <TrendingUp className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-muted-foreground font-medium">No competitors added yet</p>
            <p className="text-sm text-muted-foreground/70 text-center max-w-sm">
              Add competitor domains to see how you stack up side by side.
            </p>
            <AddCompetitorButton projectId={id} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Comparison Table</CardTitle>
            <CardDescription>
              Green = better than your metrics · Red = worse · Arrows indicate direction
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs text-muted-foreground font-medium px-6 py-3">Competitor</th>
                    <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">
                      DA
                      {ourDA != null && (
                        <span className="ml-1 text-primary/60">(ours: {Math.round(ourDA)})</span>
                      )}
                    </th>
                    <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">
                      Backlinks
                      {ourBacklinks != null && (
                        <span className="ml-1 text-primary/60">(ours: {formatNumber(ourBacklinks)})</span>
                      )}
                    </th>
                    <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">
                      Organic Keywords
                      {ourKeywords != null && (
                        <span className="ml-1 text-primary/60">(ours: {formatNumber(ourKeywords)})</span>
                      )}
                    </th>
                    <th className="text-center text-xs text-muted-foreground font-medium px-4 py-3">Type</th>
                    <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {competitors.map((comp, idx) => {
                    const snap = comp.competitorSnapshots[0];
                    return (
                      <tr
                        key={comp.id}
                        className={idx % 2 === 0 ? "bg-card" : "bg-muted/30"}
                      >
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded bg-muted flex items-center justify-center shrink-0">
                              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {comp.name ?? comp.domain}
                              </p>
                              {comp.name && (
                                <p className="text-xs text-muted-foreground">{comp.domain}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <MetricCell
                            value={snap?.domainAuthority}
                            ourValue={ourDA}
                            format="round"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <MetricCell
                            value={snap?.backlinksCount ?? undefined}
                            ourValue={ourBacklinks}
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <MetricCell
                            value={snap?.organicKeywords ?? undefined}
                            ourValue={ourKeywords}
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          {comp.isManual ? (
                            <Badge variant="outline" className="text-xs">Manual</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Auto</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-muted-foreground whitespace-nowrap">
                          {snap?.snapshotDate
                            ? new Date(snap.snapshotDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "No data yet"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground/60 text-center pb-2">
        Competitor metrics are estimated. Arrows compare against your project&apos;s latest snapshot.
      </p>
    </div>
  );
}
