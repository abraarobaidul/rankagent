"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { LinkStatusBadge, FollowBadge } from "./badges";
import { formatDate, formatNumber, getDomainFromUrl } from "@/lib/utils";
import type { Backlink } from "@/prisma/generated/prisma";
import type { ReferringDomain } from "@/prisma/generated/prisma";
import { Link2 } from "lucide-react";

interface BacklinkTabsProps {
  backlinks: Backlink[];
  referringDomains: ReferringDomain[];
}

function BacklinksTable({ backlinks }: { backlinks: Backlink[] }) {
  if (backlinks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2">
        <Link2 className="h-8 w-8 text-muted-foreground/30" />
        <p className="text-muted-foreground text-sm">No backlinks in this category</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">Source URL</th>
            <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">Anchor Text</th>
            <th className="text-center text-xs text-muted-foreground font-medium px-4 py-3">Link Type</th>
            <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">DA</th>
            <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">First Seen</th>
            <th className="text-center text-xs text-muted-foreground font-medium px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {backlinks.map((link, idx) => {
            const displayUrl =
              link.sourceUrl.length > 55
                ? getDomainFromUrl(link.sourceUrl) + "/…"
                : link.sourceUrl;

            return (
              <tr key={link.id} className={idx % 2 === 0 ? "bg-card" : "bg-muted/30"}>
                <td className="px-4 py-3 max-w-[220px]">
                  <a
                    href={link.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline truncate block"
                    title={link.sourceUrl}
                  >
                    {displayUrl}
                  </a>
                </td>
                <td className="px-4 py-3 max-w-[160px]">
                  {link.anchorText ? (
                    <span className="text-xs text-foreground truncate block" title={link.anchorText}>
                      {link.anchorText.length > 40
                        ? link.anchorText.slice(0, 40) + "…"
                        : link.anchorText}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground/50 italic">No anchor</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <FollowBadge isFollow={link.isFollow} />
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-sm">
                  {link.domainAuthority != null ? (
                    <span className="font-medium">{Math.round(link.domainAuthority)}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-xs text-muted-foreground whitespace-nowrap">
                  {link.firstSeen ? formatDate(link.firstSeen) : "—"}
                </td>
                <td className="px-4 py-3 text-center">
                  <LinkStatusBadge status={link.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ReferringDomainsTable({ domains }: { domains: ReferringDomain[] }) {
  if (domains.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2">
        <p className="text-muted-foreground text-sm">No referring domains found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">Domain</th>
            <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">DA</th>
            <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">Backlinks</th>
            <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">First Seen</th>
          </tr>
        </thead>
        <tbody>
          {domains.map((domain, idx) => (
            <tr key={domain.id} className={idx % 2 === 0 ? "bg-card" : "bg-muted/30"}>
              <td className="px-4 py-3">
                <span className="text-sm font-medium text-foreground">{domain.domain}</span>
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {domain.domainAuthority != null ? (
                  <span className="font-medium">{Math.round(domain.domainAuthority)}</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                {formatNumber(domain.backlinksCount ?? 0)}
              </td>
              <td className="px-4 py-3 text-right text-xs text-muted-foreground whitespace-nowrap">
                {domain.firstSeen ? formatDate(domain.firstSeen) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function BacklinkTabs({ backlinks, referringDomains }: BacklinkTabsProps) {
  const newBacklinks = backlinks.filter((b) => b.status === "NEW");
  const lostBacklinks = backlinks.filter((b) => b.status === "LOST");

  return (
    <Card>
      <Tabs defaultValue="all">
        <div className="px-6 pt-5 pb-0">
          <TabsList className="bg-muted">
            <TabsTrigger value="all">All Backlinks ({backlinks.length})</TabsTrigger>
            <TabsTrigger value="new">New ({newBacklinks.length})</TabsTrigger>
            <TabsTrigger value="lost">Lost ({lostBacklinks.length})</TabsTrigger>
            <TabsTrigger value="referring">Referring Domains ({referringDomains.length})</TabsTrigger>
          </TabsList>
        </div>
        <CardContent className="p-0 mt-3">
          <TabsContent value="all">
            <BacklinksTable backlinks={backlinks} />
          </TabsContent>
          <TabsContent value="new">
            <BacklinksTable backlinks={newBacklinks} />
          </TabsContent>
          <TabsContent value="lost">
            <BacklinksTable backlinks={lostBacklinks} />
          </TabsContent>
          <TabsContent value="referring">
            <ReferringDomainsTable domains={referringDomains} />
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
