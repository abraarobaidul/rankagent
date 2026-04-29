// ─── Provider interfaces ──────────────────────────────────────────────────────
// All real API integrations implement these. Mock providers return demo data.

export interface DomainAuthorityData {
  domainAuthority: number;
  backlinksCount: number;
  referringDomainsCount: number;
  organicKeywords: number;
  organicTraffic: number;
  spamScore: number;
  isDemo: boolean;
  provider: string;
}

export interface DomainAuthorityProvider {
  name: string;
  getDomainAuthority(domain: string): Promise<DomainAuthorityData>;
}

// ─────────────────────────────────────────────────────────────────────────────

export interface KeywordRankingData {
  keyword: string;
  position: number | null;
  url: string | null;
  searchEngine: string;
  country: string;
  isDemo: boolean;
  provider: string;
}

export interface SearchRankProvider {
  name: string;
  getRankings(
    domain: string,
    keywords: string[],
    options: { engine: string; country: string; language: string }
  ): Promise<KeywordRankingData[]>;
}

// ─────────────────────────────────────────────────────────────────────────────

export interface BacklinkData {
  sourceUrl: string;
  targetUrl: string;
  anchorText: string | null;
  isFollow: boolean;
  referringDomain: string;
  domainAuthority: number;
  firstSeen: Date;
  lastSeen: Date;
  status: "ACTIVE" | "LOST" | "NEW";
  linkType: string;
  isDemo: boolean;
  provider: string;
}

export interface BacklinkProvider {
  name: string;
  getBacklinks(domain: string): Promise<BacklinkData[]>;
  getReferringDomains(domain: string): Promise<
    {
      domain: string;
      domainAuthority: number;
      backlinksCount: number;
      firstSeen: Date;
      lastSeen: Date;
      isActive: boolean;
    }[]
  >;
}

// ─────────────────────────────────────────────────────────────────────────────

export interface AIVisibilityCheckData {
  prompt: string;
  response: string;
  isMentioned: boolean;
  mentionPosition: number | null;
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE" | null;
  score: number;
  isDemo: boolean;
  provider: string;
}

export interface AIVisibilityProvider {
  name: string;
  platformSlug: string;
  checkMention(
    brandName: string,
    prompts: string[]
  ): Promise<AIVisibilityCheckData[]>;
}

// ─────────────────────────────────────────────────────────────────────────────

export interface CrawledPage {
  url: string;
  statusCode: number;
  title: string | null;
  metaDescription: string | null;
  h1: string[];
  h2: string[];
  canonicalUrl: string | null;
  robotsMeta: string | null;
  isIndexable: boolean;
  wordCount: number;
  internalLinks: number;
  externalLinks: number;
  brokenLinks: number;
  imagesMissingAlt: number;
  hasSchemaMarkup: boolean;
  hasOpenGraph: boolean;
  crawlDepth: number;
}

export interface WebCrawlerProvider {
  name: string;
  crawl(domain: string, maxPages?: number): Promise<CrawledPage[]>;
}
