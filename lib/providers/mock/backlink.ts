import type { BacklinkProvider, BacklinkData } from "../types";
import { subDays } from "date-fns";

function strHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

const DEMO_SOURCES = [
  "techcrunch.com", "producthunt.com", "hackernews.com", "dev.to",
  "medium.com", "reddit.com", "indiehackers.com", "startups.com",
  "getapp.com", "capterra.com", "g2.com", "softwareadvice.com",
  "trustpilot.com", "slashdot.org", "alternativeto.net",
  "github.com", "stackoverflow.com", "smashingmagazine.com",
  "css-tricks.com", "webdesignerdepot.com",
];

const LINK_TYPES = ["text", "image", "redirect", "footer", "sidebar", "nav"];

const ANCHOR_TEXTS = [
  "click here", "learn more", "visit website", "read more",
  "best seo tool", "seo platform", "rank tracker", "website analytics",
  "domain authority", "backlink checker",
];

export class MockBacklinkProvider implements BacklinkProvider {
  name = "Mock (Demo)";

  async getBacklinks(domain: string): Promise<BacklinkData[]> {
    const seed = strHash(domain);
    const count = 50 + (seed % 150);
    const backlinks: BacklinkData[] = [];

    for (let i = 0; i < count; i++) {
      const sourceSeed = strHash(domain + i);
      const source = DEMO_SOURCES[sourceSeed % DEMO_SOURCES.length];
      const daysAgo = (sourceSeed % 365) + 1;
      const isLost = sourceSeed % 10 === 0;
      const isNew = sourceSeed % 15 === 0;

      backlinks.push({
        sourceUrl: `https://${source}/article/${sourceSeed % 9999}`,
        targetUrl: `https://${domain}/${["", "features", "pricing", "blog"][sourceSeed % 4]}`,
        anchorText: ANCHOR_TEXTS[sourceSeed % ANCHOR_TEXTS.length],
        isFollow: sourceSeed % 5 !== 0,
        referringDomain: source,
        domainAuthority: 20 + (sourceSeed % 70),
        firstSeen: subDays(new Date(), daysAgo),
        lastSeen: isLost ? subDays(new Date(), (sourceSeed % 30) + 1) : new Date(),
        status: isNew ? "NEW" : isLost ? "LOST" : "ACTIVE",
        linkType: LINK_TYPES[sourceSeed % LINK_TYPES.length],
        isDemo: true,
        provider: this.name,
      });
    }

    return backlinks;
  }

  async getReferringDomains(domain: string) {
    const backlinks = await this.getBacklinks(domain);
    const domainMap = new Map<string, { count: number; da: number; first: Date; last: Date }>();

    for (const bl of backlinks) {
      if (!bl.referringDomain) continue;
      const existing = domainMap.get(bl.referringDomain);
      if (existing) {
        existing.count++;
        if (bl.firstSeen < existing.first) existing.first = bl.firstSeen;
        if (bl.lastSeen > existing.last) existing.last = bl.lastSeen;
      } else {
        domainMap.set(bl.referringDomain, {
          count: 1,
          da: bl.domainAuthority,
          first: bl.firstSeen,
          last: bl.lastSeen,
        });
      }
    }

    return Array.from(domainMap.entries()).map(([d, v]) => ({
      domain: d,
      domainAuthority: v.da,
      backlinksCount: v.count,
      firstSeen: v.first,
      lastSeen: v.last,
      isActive: true,
    }));
  }
}

export const mockBacklinkProvider = new MockBacklinkProvider();
