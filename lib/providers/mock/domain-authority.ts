import type { DomainAuthorityProvider, DomainAuthorityData } from "../types";

// Deterministic but realistic demo data based on domain string hash
function hashDomain(domain: string): number {
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = (hash << 5) - hash + domain.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export class MockDomainAuthorityProvider implements DomainAuthorityProvider {
  name = "Mock (Demo)";

  async getDomainAuthority(domain: string): Promise<DomainAuthorityData> {
    const seed = hashDomain(domain);
    const da = 20 + (seed % 60);
    const refs = 50 + (seed % 2000);
    const backlinks = refs * (2 + (seed % 8));
    const keywords = 100 + (seed % 5000);
    const traffic = keywords * (10 + (seed % 40));

    return {
      domainAuthority: da,
      backlinksCount: backlinks,
      referringDomainsCount: refs,
      organicKeywords: keywords,
      organicTraffic: traffic,
      spamScore: (seed % 20) / 10,
      isDemo: true,
      provider: this.name,
    };
  }
}

export const mockDomainAuthorityProvider = new MockDomainAuthorityProvider();
