import type { SearchRankProvider, KeywordRankingData } from "../types";
import { subDays } from "date-fns";

function seededRandom(seed: number): () => number {
  let s = seed;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function strHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export class MockSearchRankProvider implements SearchRankProvider {
  name = "Mock (Demo)";

  async getRankings(
    domain: string,
    keywords: string[],
    options: { engine: string; country: string; language: string }
  ): Promise<KeywordRankingData[]> {
    return keywords.map((keyword) => {
      const seed = strHash(domain + keyword + options.engine);
      const rand = seededRandom(seed);
      const position = Math.floor(rand() * 50) + 1;

      return {
        keyword,
        position,
        url: `https://${domain}/${keyword.toLowerCase().replace(/\s+/g, "-")}`,
        searchEngine: options.engine,
        country: options.country,
        isDemo: true,
        provider: this.name,
      };
    });
  }
}

export const mockSearchRankProvider = new MockSearchRankProvider();

// Generate historical ranking trend for a keyword
export function generateRankingHistory(
  keywordId: string,
  days = 30
): { date: Date; position: number }[] {
  const rand = seededRandom(strHash(keywordId));
  let pos = Math.floor(rand() * 30) + 5;
  const history = [];

  for (let i = days; i >= 0; i--) {
    const delta = Math.round((rand() - 0.5) * 6);
    pos = Math.max(1, Math.min(100, pos + delta));
    history.push({ date: subDays(new Date(), i), position: pos });
  }

  return history;
}
