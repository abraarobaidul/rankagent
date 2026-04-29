import type { WebCrawlerProvider, CrawledPage } from "../types";

function strHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

const PAGE_SLUGS = [
  "", "about", "features", "pricing", "blog", "contact",
  "blog/seo-guide", "blog/keyword-research", "features/analytics",
  "features/reporting", "case-studies", "docs", "docs/api",
  "team", "careers", "privacy", "terms",
];

export class MockWebCrawlerProvider implements WebCrawlerProvider {
  name = "Mock Crawler (Demo)";

  async crawl(domain: string, maxPages = 20): Promise<CrawledPage[]> {
    const pages: CrawledPage[] = [];
    const pageCount = Math.min(maxPages, PAGE_SLUGS.length);

    for (let i = 0; i < pageCount; i++) {
      const slug = PAGE_SLUGS[i];
      const url = `https://${domain}/${slug}`;
      const seed = strHash(url);

      const missingTitle = seed % 15 === 0;
      const missingMeta = seed % 8 === 0;
      const longTitle = seed % 12 === 0;

      pages.push({
        url,
        statusCode: seed % 20 === 0 ? 404 : 200,
        title: missingTitle
          ? null
          : longTitle
          ? `This is an extremely long page title that exceeds the recommended character limit for SEO best practices - ${slug || "Home"}`
          : `${slug ? slug.replace(/-/g, " ").replace(/\//g, " - ") : "Home"} | ${domain}`,
        metaDescription: missingMeta
          ? null
          : `${slug ? `Learn about ${slug.replace(/-/g, " ")}` : `Welcome to ${domain}`}. Discover our features and start tracking your SEO performance today.`,
        h1: seed % 10 === 0 ? [] : seed % 7 === 0 ? ["H1 Tag", "Second H1 Tag"] : [`${slug || "Home"} heading`],
        h2: Array.from({ length: seed % 5 }, (_, j) => `Section ${j + 1}`),
        canonicalUrl: seed % 6 === 0 ? null : url,
        robotsMeta: seed % 20 === 0 ? "noindex" : "index,follow",
        isIndexable: seed % 20 !== 0,
        wordCount: 100 + (seed % 1500),
        internalLinks: 3 + (seed % 20),
        externalLinks: seed % 8,
        brokenLinks: seed % 5 === 0 ? 1 + (seed % 3) : 0,
        imagesMissingAlt: seed % 4 === 0 ? 1 + (seed % 5) : 0,
        hasSchemaMarkup: seed % 3 !== 0,
        hasOpenGraph: seed % 4 !== 0,
        crawlDepth: i === 0 ? 0 : 1 + Math.floor(i / 4),
      });
    }

    return pages;
  }
}

export const mockWebCrawlerProvider = new MockWebCrawlerProvider();
