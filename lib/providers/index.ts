// Provider registry — swap mock for real by setting env vars

import { mockDomainAuthorityProvider } from "./mock/domain-authority";
import { mockSearchRankProvider } from "./mock/keyword-rank";
import { mockBacklinkProvider } from "./mock/backlink";
import { mockAIProviders } from "./mock/ai-visibility";
import { mockWebCrawlerProvider } from "./mock/web-crawler";

import type {
  DomainAuthorityProvider,
  SearchRankProvider,
  BacklinkProvider,
  AIVisibilityProvider,
  WebCrawlerProvider,
} from "./types";

export function getDomainAuthorityProvider(): DomainAuthorityProvider {
  // Swap: if (process.env.MOZ_API_KEY) return new MozProvider(...)
  return mockDomainAuthorityProvider;
}

export function getSearchRankProvider(): SearchRankProvider {
  // Swap: if (process.env.SERPAPI_KEY) return new SerpApiProvider(...)
  return mockSearchRankProvider;
}

export function getBacklinkProvider(): BacklinkProvider {
  // Swap: if (process.env.AHREFS_API_KEY) return new AhrefsProvider(...)
  return mockBacklinkProvider;
}

export function getAIVisibilityProviders(): AIVisibilityProvider[] {
  // Swap: add real providers when API keys are available
  return mockAIProviders;
}

export function getWebCrawlerProvider(): WebCrawlerProvider {
  return mockWebCrawlerProvider;
}

export { type DomainAuthorityProvider, type SearchRankProvider, type BacklinkProvider, type AIVisibilityProvider, type WebCrawlerProvider };
