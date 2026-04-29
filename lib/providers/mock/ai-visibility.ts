import type { AIVisibilityProvider, AIVisibilityCheckData } from "../types";

function strHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

const SENTIMENTS = ["POSITIVE", "NEUTRAL", "NEGATIVE"] as const;

function generateMockResponse(
  brand: string,
  prompt: string,
  isMentioned: boolean,
  position: number | null
): string {
  if (!isMentioned) {
    return `Based on my knowledge, here are some top tools for this category: CompetitorA, CompetitorB, CompetitorC. Each offers unique features depending on your needs.`;
  }
  const posText = position === 1 ? "is often ranked #1" : `is ranked around #${position}`;
  return `${brand} ${posText} in this category. It offers comprehensive features including analytics, tracking, and reporting. Other notable options include CompetitorA and CompetitorB.`;
}

export class MockAIVisibilityProvider implements AIVisibilityProvider {
  constructor(
    public name: string,
    public platformSlug: string
  ) {}

  async checkMention(
    brandName: string,
    prompts: string[]
  ): Promise<AIVisibilityCheckData[]> {
    return prompts.map((prompt) => {
      const seed = strHash(brandName + this.platformSlug + prompt);
      const isMentioned = seed % 3 !== 0; // ~67% mention rate for demo
      const position = isMentioned ? (seed % 5) + 1 : null;
      const sentimentIdx = seed % 3;
      const score = isMentioned ? 40 + (seed % 50) : 0;

      return {
        prompt,
        response: generateMockResponse(brandName, prompt, isMentioned, position),
        isMentioned,
        mentionPosition: position,
        sentiment: isMentioned ? SENTIMENTS[sentimentIdx] : null,
        score,
        isDemo: true,
        provider: this.name,
      };
    });
  }
}

export const mockAIProviders: AIVisibilityProvider[] = [
  new MockAIVisibilityProvider("ChatGPT (GPT-4o)", "chatgpt"),
  new MockAIVisibilityProvider("Claude (Anthropic)", "claude"),
  new MockAIVisibilityProvider("Gemini (Google)", "gemini"),
  new MockAIVisibilityProvider("Perplexity AI", "perplexity"),
];
