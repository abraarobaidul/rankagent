"use client";

import Link from "next/link";
import {
  Globe,
  ExternalLink,
  CheckCircle2,
  Clock,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/dashboard/score-ring";
import { formatNumber, formatDate } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LatestSnapshot {
  domainAuthority: number | null;
  backlinksCount: number | null;
  referringDomainsCount: number | null;
  organicKeywords: number | null;
  snapshotDate: string;
}

interface ProjectCardData {
  id: string;
  name: string;
  domain: string;
  isActive: boolean;
  healthScore: number | null;
  lastCrawledAt: string | null;
  createdAt: string;
  latestSnapshot: LatestSnapshot | null;
}

// ─── Single card ──────────────────────────────────────────────────────────────

function ProjectCard({ project }: { project: ProjectCardData }) {
  const snap = project.latestSnapshot;
  const health = project.healthScore ?? 0;

  return (
    <Link href={`/projects/${project.id}`} className="block group">
      <Card className="h-full transition-colors hover:border-primary/50">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base font-semibold truncate">
                  {project.name}
                </CardTitle>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-xs text-muted-foreground truncate">
                    {project.domain}
                  </span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
            <ScoreRing score={Math.round(health)} size="sm" />
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">DA</p>
              <p className="text-sm font-semibold tabular-nums">
                {snap?.domainAuthority != null
                  ? Math.round(snap.domainAuthority)
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Backlinks</p>
              <p className="text-sm font-semibold tabular-nums">
                {snap?.backlinksCount != null
                  ? formatNumber(snap.backlinksCount)
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Keywords</p>
              <p className="text-sm font-semibold tabular-nums">
                {snap?.organicKeywords != null
                  ? formatNumber(snap.organicKeywords)
                  : "—"}
              </p>
            </div>
          </div>

          {/* Footer row */}
          <div className="flex items-center justify-between pt-1 border-t border-border">
            <Badge
              variant={project.isActive ? "success" : "secondary"}
              className="text-[10px] px-2 py-0 h-5"
            >
              {project.isActive ? (
                <>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Active
                </>
              ) : (
                "Inactive"
              )}
            </Badge>
            {project.lastCrawledAt ? (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatDate(project.lastCrawledAt)}
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground">Never crawled</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <Globe className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">No projects yet</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">
        Add your first project to start tracking domain authority, backlinks, and keyword rankings.
      </p>
      <p className="text-sm text-muted-foreground">
        Click <strong className="text-foreground">Add Project</strong> above to get started.
      </p>
    </div>
  );
}

// ─── Grid ─────────────────────────────────────────────────────────────────────

export function ProjectGrid({ projects }: { projects: ProjectCardData[] }) {
  if (projects.length === 0) return <EmptyState />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
