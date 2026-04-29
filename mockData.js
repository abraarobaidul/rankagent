// mockData.js

export const mockProjects = [
  {
    id: 1,
    name: "Brand A",
    domainAuthority: 45,
    keywordRankings: 120,
    backlinks: 56,
    aiMentions: 10,
    seoHealthScore: 85,
  },
  {
    id: 2,
    name: "Brand B",
    domainAuthority: 52,
    keywordRankings: 95,
    backlinks: 43,
    aiMentions: 5,
    seoHealthScore: 78,
  },
];

export const mockKeywordStats = [
  { keyword: "SEO Tools", rank: 5 },
  { keyword: "Digital Marketing", rank: 10 },
];

export const mockBacklinkStats = [
  { source: "example.com", anchor: "SEO Marketing", type: "follow" },
  { source: "webresource.com", anchor: "Content Marketing", type: "nofollow" },
];