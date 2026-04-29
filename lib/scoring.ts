// MVP scoring formulas — clearly labeled as estimates

export function calcDomainAuthority(params: {
  referringDomains: number;
  backlinks: number;
  organicKeywords: number;
}): number {
  const { referringDomains, backlinks, organicKeywords } = params;
  const rdScore = Math.min(referringDomains / 20, 40);
  const blScore = Math.min(backlinks / 500, 25);
  const kwScore = Math.min(organicKeywords / 200, 25);
  return Math.round(rdScore + blScore + kwScore + 10);
}

export function calcSEOHealthScore(params: {
  totalIssues: number;
  criticalIssues: number;
  warningIssues: number;
  noticeIssues: number;
  totalPages: number;
}): number {
  const { totalIssues, criticalIssues, warningIssues, noticeIssues, totalPages } = params;
  if (totalPages === 0) return 50;
  const penalty = criticalIssues * 5 + warningIssues * 2 + noticeIssues * 0.5;
  const base = 100 - Math.min(penalty, 90);
  return Math.max(10, Math.round(base));
}

export function calcAIVisibilityScore(params: {
  mentionCount: number;
  totalChecks: number;
  avgPosition: number | null;
  avgSentimentScore: number; // 1=positive, 0=neutral, -1=negative
}): number {
  const { mentionCount, totalChecks, avgPosition, avgSentimentScore } = params;
  if (totalChecks === 0) return 0;
  const mentionRate = mentionCount / totalChecks;
  const positionBonus = avgPosition ? Math.max(0, (6 - avgPosition) * 5) : 0;
  const sentimentBonus = (avgSentimentScore + 1) * 10; // 0–20
  return Math.round(mentionRate * 60 + positionBonus + sentimentBonus);
}

export function calcKeywordVisibilityScore(params: {
  rankings: Array<{ position: number | null; searchVolume: number | null }>;
}): number {
  const { rankings } = params;
  if (rankings.length === 0) return 0;
  let score = 0;
  for (const r of rankings) {
    if (r.position == null) continue;
    const vol = r.searchVolume ?? 100;
    const posWeight = r.position <= 3 ? 1 : r.position <= 10 ? 0.5 : r.position <= 20 ? 0.2 : 0.05;
    score += posWeight * Math.log10(vol + 1) * 10;
  }
  return Math.min(100, Math.round(score / Math.max(rankings.length, 1)));
}

export function calcGrowthScore(params: {
  currentDA: number;
  previousDA: number;
  keywordsImproved: number;
  keywordsDeclined: number;
  newBacklinks: number;
  lostBacklinks: number;
}): number {
  const daChange = params.currentDA - params.previousDA;
  const kwNet = params.keywordsImproved - params.keywordsDeclined;
  const blNet = params.newBacklinks - params.lostBacklinks;
  const score = 50 + daChange * 2 + (kwNet / 10) * 5 + (blNet / 20) * 3;
  return Math.max(0, Math.min(100, Math.round(score)));
}
