"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Globe, TrendingUp, Link2, Search,
  Brain, FileText, ChevronRight, TrendingUpDown, LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/", icon: LayoutDashboard, label: "Overview" },
  { href: "/projects", icon: Globe, label: "Projects" },
];

const PROJECT_NAV = (projectId: string) => [
  { href: `/projects/${projectId}`, icon: LayoutDashboard, label: "Dashboard" },
  { href: `/projects/${projectId}/keywords`, icon: TrendingUp, label: "Keywords" },
  { href: `/projects/${projectId}/backlinks`, icon: Link2, label: "Backlinks" },
  { href: `/projects/${projectId}/audit`, icon: Search, label: "Audit" },
  { href: `/projects/${projectId}/ai-mentions`, icon: Brain, label: "AI Mentions" },
  { href: `/projects/${projectId}/competitors`, icon: TrendingUpDown, label: "Competitors" },
  { href: `/projects/${projectId}/reports`, icon: FileText, label: "Reports" },
];

interface SidebarProps {
  activeProjectId?: string;
  activeProjectName?: string;
}

export function Sidebar({ activeProjectId, activeProjectName }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-56 shrink-0 border-r border-border bg-card h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-border">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <TrendingUp className="h-4 w-4 text-white" />
        </div>
        <span className="font-bold text-sm tracking-tight">RankAgent</span>
      </div>

      <ScrollArea className="flex-1 py-3">
        {/* Main nav */}
        <nav className="px-2 space-y-0.5">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                  active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Active project sub-nav */}
        {activeProjectId && (
          <div className="mt-4">
            <div className="px-4 mb-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="truncate max-w-[120px]">{activeProjectName}</span>
                <ChevronRight className="h-3 w-3 shrink-0" />
              </div>
            </div>
            <nav className="px-2 space-y-0.5">
              {PROJECT_NAV(activeProjectId).map(({ href, icon: Icon, label }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                      active
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground gap-2"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
