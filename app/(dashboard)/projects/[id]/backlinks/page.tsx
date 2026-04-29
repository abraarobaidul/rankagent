import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BacklinkTabs } from "./backlink-tabs";
import { Link2, TrendingUp, TrendingDown, Globe } from "lucide-react";
import type { Backlink } from "@/app/generated/prisma";
import type { ReferringDomain } from "@/app/generated/prisma";

// ─── helpers ──────────────────────────────────────────────────────────────────

export function LinkStatusBadge({ status }: { status: string }) {
  if (status === "NEW")
    return <Badge className="border-transparent bg-emerald-900/40 text-emerald-400 text-xs">New</Badge>;
  if (status === "LOST")
    return <Badge className="border-transparent bg-red-900/40 text-red-400 text-xs">Lost</Badge>;
  return <Badge className="border-transparent bg-blue-900/40 text-blue-400 text-xs">Active</Badge>;
}

export function FollowBadge({ isFollow }: { isFollow: boolean }) {
  return isFollow ? (
    <Badge className="border-transparent bg-primary/20 text-primary text-xs">Follow</Badge>
  ) : (
    <Badge className="border-transparent bg-zinc-800 text-zinc-400 text-xs">Nofollow</Badge>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function BacklinksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) redirect("/");

  const [backlinks, referringDomains] = await Promise.all([
    prisma.backlink.findMany({
      where: { projectId: id },
      orderBy: { firstSeen: "desc" },
    }),
    prisma.referringDomain.findMany({
      where: { projectId: id },
      orderBy: [{ domainAuthority: "desc" }, { backlinksCount: "desc" }],
    }),
  ]);

  const totalBacklinks = backlinks.length;
  const newBacklinks = backlinks.filter((b) => b.status === "NEW").length;
  const lostBacklinks = backlinks.filter((b) => b.status === "LOST").length;
  const activeBacklinks = backlinks.filter((b) => b.status === "ACTIVE").length;

  const isDemo = backlinks.some((b) => b.isDemo);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Link2 className="h-6 w-6 text-primary" />
          Backlinks
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Link profile for <span className="text-foreground font-medium">{project.domain}</span>
          {isDemo && " · Demo / estimated data"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Backlinks"
          value={totalBacklinks}
          icon={<Link2 className="h-4 w-4" />}
          isDemo={isDemo}
        />
        <StatCard
          title="New"
          value={newBacklinks}
          icon={<TrendingUp className="h-4 w-4" />}
          isDemo={isDemo}
        />
        <StatCard
          title="Lost"
          value={lostBacklinks}
          icon={<TrendingDown className="h-4 w-4" />}
          isDemo={isDemo}
        />
        <StatCard
          title="Active"
          value={activeBacklinks}
          icon={<Globe className="h-4 w-4" />}
          isDemo={isDemo}
        />
      </div>

      <Separator />

      {/* Tabs: backlinks + referring domains */}
      <BacklinkTabs
        backlinks={backlinks}
        referringDomains={referringDomains}
      />
    </div>
  );
}
