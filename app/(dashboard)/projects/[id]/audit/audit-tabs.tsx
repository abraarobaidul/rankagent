"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { SeverityBadge } from "./badges";
import type { OnPageIssue } from "@/prisma/generated/prisma";

interface AuditTabsProps {
  allIssues: OnPageIssue[];
  criticalIssues: OnPageIssue[];
  warningIssues: OnPageIssue[];
  noticeIssues: OnPageIssue[];
}

function IssuesTable({ issues }: { issues: OnPageIssue[] }) {
  if (issues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2">
        <p className="text-muted-foreground text-sm">No issues in this category</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">URL</th>
            <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">Issue Type</th>
            <th className="text-center text-xs text-muted-foreground font-medium px-4 py-3">Severity</th>
            <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">Title</th>
            <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">Recommendation</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue, idx) => (
            <tr key={issue.id} className={idx % 2 === 0 ? "bg-card" : "bg-muted/30"}>
              <td className="px-4 py-3 max-w-[180px]">
                <span className="text-xs text-muted-foreground truncate block" title={issue.url}>
                  {issue.url.length > 50 ? "…" + issue.url.slice(-48) : issue.url}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="text-xs text-muted-foreground font-mono">{issue.issueType}</span>
              </td>
              <td className="px-4 py-3 text-center">
                <SeverityBadge severity={issue.severity} />
              </td>
              <td className="px-4 py-3 max-w-[200px]">
                <span className="text-xs text-foreground line-clamp-2">{issue.title}</span>
              </td>
              <td className="px-4 py-3 max-w-[240px]">
                {issue.recommendation ? (
                  <span className="text-xs text-muted-foreground line-clamp-2">{issue.recommendation}</span>
                ) : (
                  <span className="text-xs text-muted-foreground/40 italic">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AuditTabs({ allIssues, criticalIssues, warningIssues, noticeIssues }: AuditTabsProps) {
  return (
    <Card>
      <Tabs defaultValue="all">
        <div className="px-6 pt-5 pb-0">
          <h2 className="text-base font-semibold mb-3">All Issues</h2>
          <TabsList className="bg-muted">
            <TabsTrigger value="all">All ({allIssues.length})</TabsTrigger>
            <TabsTrigger value="critical">Critical ({criticalIssues.length})</TabsTrigger>
            <TabsTrigger value="warning">Warning ({warningIssues.length})</TabsTrigger>
            <TabsTrigger value="notice">Notice ({noticeIssues.length})</TabsTrigger>
          </TabsList>
        </div>
        <CardContent className="p-0 mt-3">
          <TabsContent value="all">
            <IssuesTable issues={allIssues} />
          </TabsContent>
          <TabsContent value="critical">
            <IssuesTable issues={criticalIssues} />
          </TabsContent>
          <TabsContent value="warning">
            <IssuesTable issues={warningIssues} />
          </TabsContent>
          <TabsContent value="notice">
            <IssuesTable issues={noticeIssues} />
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
