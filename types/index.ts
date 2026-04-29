// Re-export Prisma-generated types with convenient aliases
export type {
  Organization,
  User,
  Project,
  DomainSnapshot,
  Keyword,
  KeywordRanking,
  Backlink,
  ReferringDomain,
  OnPageAudit,
  OnPageIssue,
  AIPlatform,
  AIBrandMentionCheck,
  Competitor,
  CompetitorSnapshot,
  ScheduledJob,
  Report,
  Role,
  Plan,
  JobType,
  JobStatus,
  IssueSeverity,
  LinkStatus,
  Sentiment,
  SearchEngine,
  ApiType,
} from "@prisma/client";

// ─── UI / Service layer types ─────────────────────────────────────────────────

export interface DashboardStats {
  totalProjects: number;
  avgDomainAuthority: number;
  totalKeywords: number;
  keywordsImproved: number;
  keywordsDeclined: number;
  totalBacklinks: number;
  newBacklinks: number;
  lostBacklinks: number;
  aiMentionScore: number;
  avgHealthScore: number;
  monthOverMonthGrowth: number;
}

export interface ProjectSummary {
  id: string;
  name: string;
  domain: string;
  healthScore: number | null;
  domainAuthority: number | null;
  backlinksCount: number | null;
  organicKeywords: number | null;
  lastCrawledAt: Date | null;
  isActive: boolean;
  isDemo: boolean;
}

export interface KeywordWithRanking {
  id: string;
  term: string;
  searchEngine: string;
  country: string | null;
  searchVolume: number | null;
  currentPosition: number | null;
  previousPosition: number | null;
  change: number | null;
  url: string | null;
  isDemo: boolean;
}

export interface BacklinkWithStatus {
  id: string;
  sourceUrl: string;
  targetUrl: string;
  anchorText: string | null;
  isFollow: boolean;
  status: string;
  referringDomain: string | null;
  domainAuthority: number | null;
  firstSeen: Date | null;
  lastSeen: Date | null;
  isDemo: boolean;
}

export interface AuditSummary {
  id: string;
  completedAt: Date | null;
  totalPages: number;
  totalIssues: number;
  criticalIssues: number;
  warningIssues: number;
  noticeIssues: number;
  healthScore: number | null;
  isDemo: boolean;
}

export interface AIVisibilitySummary {
  platformName: string;
  platformSlug: string;
  totalChecks: number;
  mentionCount: number;
  mentionRate: number;
  avgScore: number | null;
  avgPosition: number | null;
  sentiment: string | null;
}

export interface TrendPoint {
  date: string;
  value: number;
}

export interface ProviderInfo {
  name: string;
  isDemo: boolean;
}
