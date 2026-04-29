"use client";

import { useState, useTransition, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Plus,
  Upload,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Globe,
  AlertCircle,
  ExternalLink,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatNumber } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type SearchEngine = "GOOGLE" | "BING" | "YAHOO" | "YANDEX" | "DUCKDUCKGO";

interface RankingPoint {
  position: number | null;
  snapshotDate: string;
}

interface KeywordRow {
  id: string;
  term: string;
  searchEngine: SearchEngine;
  country: string | null;
  searchVolume: number | null;
  currentPosition: number | null;
  rankingUrl: string | null;
  change: number | null;
  rankings: RankingPoint[];
  createdAt: string;
}

type SortKey = "term" | "currentPosition" | "searchVolume" | "change";
type SortDir = "asc" | "desc";

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ data }: { data: RankingPoint[] }) {
  const points = [...data]
    .reverse()
    .map((r) => r.position)
    .filter((p): p is number => p != null);

  if (points.length < 2) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const w = 56;
  const h = 24;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  // Invert Y: lower position number = better = top of chart
  const toX = (i: number) => (i / (points.length - 1)) * w;
  const toY = (p: number) => h - ((p - min) / range) * h;

  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(p).toFixed(1)}`)
    .join(" ");

  const last = points[points.length - 1];
  const first = points[0];
  const improved = last < first; // lower rank number = better

  return (
    <svg width={w} height={h} className="overflow-visible">
      <path
        d={d}
        fill="none"
        stroke={improved ? "#10b981" : "#ef4444"}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={toX(points.length - 1)}
        cy={toY(last)}
        r={2}
        fill={improved ? "#10b981" : "#ef4444"}
      />
    </svg>
  );
}

// ─── Add Keyword Dialog ───────────────────────────────────────────────────────

function AddKeywordDialog({
  open,
  onOpenChange,
  projectId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectId: string;
  onSuccess: () => void;
}) {
  const [term, setTerm] = useState("");
  const [engine, setEngine] = useState<SearchEngine>("GOOGLE");
  const [country, setCountry] = useState("US");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function reset() {
    setTerm("");
    setEngine("GOOGLE");
    setCountry("US");
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/keywords`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            term: term.trim(),
            searchEngine: engine,
            country: country.trim().toUpperCase() || "US",
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError((body as { error?: string }).error ?? "Failed to add keyword.");
          return;
        }

        reset();
        onOpenChange(false);
        onSuccess();
      } catch {
        setError("Network error. Please try again.");
      }
    });
  }

  const engines: SearchEngine[] = ["GOOGLE", "BING", "YAHOO", "YANDEX", "DUCKDUCKGO"];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Keyword</DialogTitle>
          <DialogDescription>
            Track a new keyword for this project.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="kw-term">Keyword</Label>
            <Input
              id="kw-term"
              placeholder="e.g. best seo tools"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Search Engine</Label>
              <Select value={engine} onValueChange={(v) => setEngine(v as SearchEngine)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {engines.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e.charAt(0) + e.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kw-country">Country Code</Label>
              <Input
                id="kw-country"
                placeholder="US"
                value={country}
                onChange={(e) => setCountry(e.target.value.toUpperCase())}
                maxLength={2}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </p>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { reset(); onOpenChange(false); }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !term.trim()}>
              {isPending ? "Adding…" : "Add Keyword"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Sort header cell ─────────────────────────────────────────────────────────

function SortHeader({
  label,
  sortKey,
  currentSort,
  currentDir,
  onSort,
  className,
}: {
  label: string;
  sortKey: SortKey;
  currentSort: SortKey;
  currentDir: SortDir;
  onSort: (k: SortKey) => void;
  className?: string;
}) {
  const active = currentSort === sortKey;
  return (
    <button
      onClick={() => onSort(sortKey)}
      className={cn(
        "flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors",
        active && "text-foreground",
        className
      )}
    >
      {label}
      {active ? (
        currentDir === "asc" ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )
      ) : (
        <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
      )}
    </button>
  );
}

// ─── Change cell ──────────────────────────────────────────────────────────────

function ChangeCell({ change }: { change: number | null }) {
  if (change === null || change === 0) {
    return (
      <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
        <Minus className="h-3.5 w-3.5" />
        —
      </span>
    );
  }
  if (change > 0) {
    return (
      <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-400">
        <ArrowUpRight className="h-3.5 w-3.5" />
        +{change}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-xs font-medium text-red-400">
      <ArrowDownRight className="h-3.5 w-3.5" />
      {change}
    </span>
  );
}

// ─── Main client component ────────────────────────────────────────────────────

interface KeywordsClientProps {
  projectId: string;
  projectName: string;
  projectDomain: string;
  initialKeywords: KeywordRow[];
}

export function KeywordsClient({
  projectId,
  projectName,
  projectDomain,
  initialKeywords,
}: KeywordsClientProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [keywords, setKeywords] = useState<KeywordRow[]>(initialKeywords);
  const [addOpen, setAddOpen] = useState(false);
  const [engineFilter, setEngineFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("currentPosition");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "currentPosition" ? "asc" : "desc");
    }
  }

  function handleSuccess() {
    router.refresh();
    // Re-fetch from API and update state
    fetch(`/api/projects/${projectId}/keywords`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setKeywords(data as KeywordRow[]);
      })
      .catch(() => {});
  }

  // CSV import
  function handleCsvChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split(/\r?\n/).filter(Boolean).slice(1); // skip header
      const rows = lines.map((l) => {
        const [term, engine, country] = l.split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
        return {
          term,
          searchEngine: ((engine?.toUpperCase() || "GOOGLE") as SearchEngine),
          country: country?.toUpperCase() || "US",
        };
      }).filter((r) => r.term);

      for (const row of rows) {
        await fetch(`/api/projects/${projectId}/keywords`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(row),
        });
      }
      handleSuccess();
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = "";
  }

  // Filtered + sorted list
  const filtered = useMemo(() => {
    let list = [...keywords];

    if (engineFilter !== "ALL") {
      list = list.filter((k) => k.searchEngine === engineFilter);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((k) => k.term.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      let av: number;
      let bv: number;

      if (sortKey === "term") {
        const cmp = a.term.localeCompare(b.term);
        return sortDir === "asc" ? cmp : -cmp;
      }

      if (sortKey === "currentPosition") {
        // null positions go to end
        av = a.currentPosition ?? 999999;
        bv = b.currentPosition ?? 999999;
      } else if (sortKey === "searchVolume") {
        av = a.searchVolume ?? -1;
        bv = b.searchVolume ?? -1;
      } else {
        // change
        av = a.change ?? 0;
        bv = b.change ?? 0;
      }

      return sortDir === "asc" ? av - bv : bv - av;
    });

    return list;
  }, [keywords, engineFilter, search, sortKey, sortDir]);

  const engines: Array<SearchEngine | "ALL"> = [
    "ALL",
    "GOOGLE",
    "BING",
    "YAHOO",
    "YANDEX",
    "DUCKDUCKGO",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href={`/projects/${projectId}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {projectName}
            </Link>
            <span className="text-muted-foreground">/</span>
            <h1 className="text-2xl font-bold text-foreground">Keywords</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {keywords.length} keyword{keywords.length !== 1 ? "s" : ""} tracked for{" "}
            <span className="text-foreground">{projectDomain}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleCsvChange}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Keyword
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search keywords…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Engine:</span>
          <div className="flex gap-1 flex-wrap">
            {engines.map((eng) => (
              <button
                key={eng}
                onClick={() => setEngineFilter(eng)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                  engineFilter === eng
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {eng === "ALL" ? "All" : eng.charAt(0) + eng.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <Card>
        {filtered.length === 0 ? (
          <CardContent className="py-16 text-center">
            <Globe className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium text-muted-foreground">
              {keywords.length === 0 ? "No keywords tracked yet." : "No keywords match your filters."}
            </p>
            {keywords.length === 0 && (
              <Button className="mt-4" size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4" />
                Add First Keyword
              </Button>
            )}
          </CardContent>
        ) : (
          <ScrollArea className="w-full">
            <div className="min-w-[700px]">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto_80px] gap-x-4 px-4 py-3 border-b border-border">
                <SortHeader
                  label="Keyword"
                  sortKey="term"
                  currentSort={sortKey}
                  currentDir={sortDir}
                  onSort={handleSort}
                />
                <span className="text-xs font-medium text-muted-foreground">Engine</span>
                <span className="text-xs font-medium text-muted-foreground">Country</span>
                <SortHeader
                  label="Volume"
                  sortKey="searchVolume"
                  currentSort={sortKey}
                  currentDir={sortDir}
                  onSort={handleSort}
                  className="justify-end"
                />
                <SortHeader
                  label="Position"
                  sortKey="currentPosition"
                  currentSort={sortKey}
                  currentDir={sortDir}
                  onSort={handleSort}
                  className="justify-end"
                />
                <SortHeader
                  label="Change"
                  sortKey="change"
                  currentSort={sortKey}
                  currentDir={sortDir}
                  onSort={handleSort}
                  className="justify-end"
                />
                <span className="text-xs font-medium text-muted-foreground">Trend</span>
              </div>

              {/* Rows */}
              {filtered.map((kw) => (
                <div
                  key={kw.id}
                  className="grid grid-cols-[1fr_auto_auto_auto_auto_auto_80px] gap-x-4 px-4 py-3 border-b border-border last:border-0 hover:bg-muted/20 transition-colors items-center"
                >
                  {/* Keyword + URL */}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{kw.term}</p>
                    {kw.rankingUrl && (
                      <a
                        href={kw.rankingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors truncate max-w-xs"
                      >
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        <span className="truncate">{kw.rankingUrl}</span>
                      </a>
                    )}
                  </div>

                  {/* Engine */}
                  <Badge variant="outline" className="text-[10px] px-1.5 h-5">
                    {kw.searchEngine.charAt(0) + kw.searchEngine.slice(1).toLowerCase()}
                  </Badge>

                  {/* Country */}
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {kw.country ?? "—"}
                  </span>

                  {/* Volume */}
                  <span className="text-sm tabular-nums text-right">
                    {kw.searchVolume != null ? formatNumber(kw.searchVolume) : "—"}
                  </span>

                  {/* Position */}
                  <span
                    className={cn(
                      "text-sm font-semibold tabular-nums text-right",
                      kw.currentPosition == null
                        ? "text-muted-foreground"
                        : kw.currentPosition <= 3
                        ? "text-emerald-400"
                        : kw.currentPosition <= 10
                        ? "text-yellow-400"
                        : "text-foreground"
                    )}
                  >
                    {kw.currentPosition != null ? `#${kw.currentPosition}` : "—"}
                  </span>

                  {/* Change */}
                  <div className="flex justify-end">
                    <ChangeCell change={kw.change} />
                  </div>

                  {/* Sparkline */}
                  <div className="flex items-center justify-start">
                    <Sparkline data={kw.rankings} />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </Card>

      {/* Summary footer */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>
            Showing {filtered.length} of {keywords.length} keywords
          </span>
          <span>
            Top 3:{" "}
            {filtered.filter((k) => k.currentPosition != null && k.currentPosition <= 3).length}
          </span>
          <span>
            Top 10:{" "}
            {filtered.filter((k) => k.currentPosition != null && k.currentPosition <= 10).length}
          </span>
          <span className="text-emerald-400">
            Improved:{" "}
            {filtered.filter((k) => k.change != null && k.change > 0).length}
          </span>
          <span className="text-red-400">
            Declined:{" "}
            {filtered.filter((k) => k.change != null && k.change < 0).length}
          </span>
        </div>
      )}

      {/* Add Keyword Dialog */}
      <AddKeywordDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        projectId={projectId}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
