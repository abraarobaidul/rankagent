import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { subDays, subMonths } from "date-fns";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

const DEMO_PROJECTS = [
  {
    name: "RankAgent Demo",
    domain: "rankagent.io",
    keywords: ["seo rank tracker", "keyword tracking tool", "rank monitoring", "seo dashboard", "backlink checker", "website audit tool"],
    competitors: ["ahrefs.com", "semrush.com", "moz.com"],
  },
  {
    name: "TechStartup Blog",
    domain: "techstartup.blog",
    keywords: ["startup tips", "saas growth", "product market fit", "b2b marketing", "startup funding", "growth hacking"],
    competitors: ["entrepreneur.com", "techcrunch.com", "medium.com"],
  },
  {
    name: "E-commerce Store",
    domain: "shopexample.com",
    keywords: ["buy online", "best deals", "free shipping", "shop now", "discount store", "flash sale"],
    competitors: ["amazon.com", "shopify.com", "woocommerce.com"],
  },
];

const AI_PLATFORMS = [
  { name: "ChatGPT (GPT-4o)", slug: "chatgpt", apiType: "OPENAI" as const },
  { name: "Claude (Anthropic)", slug: "claude", apiType: "CLAUDE" as const },
  { name: "Gemini (Google)", slug: "gemini", apiType: "GEMINI" as const },
  { name: "Perplexity AI", slug: "perplexity", apiType: "PERPLEXITY" as const },
];

const AI_PROMPTS = [
  "What are the best SEO tools available?",
  "Top rank tracking software for small businesses",
  "Best alternatives to Ahrefs for backlink analysis",
  "Which website audit tools do SEO professionals use?",
  "Best all-in-one SEO platforms for agencies",
];

function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

async function main() {
  console.log("🌱 Seeding RankAgent demo data...");

  // Org + User
  const org = await prisma.organization.upsert({
    where: { slug: "demo-org" },
    update: {},
    create: { name: "Demo Organization", slug: "demo-org" },
  });

  const user = await prisma.user.upsert({
    where: { email: "demo@rankagent.io" },
    update: {},
    create: {
      email: "demo@rankagent.io",
      name: "Demo User",
      role: "OWNER",
      organizationId: org.id,
    },
  });

  // AI Platforms
  for (const platform of AI_PLATFORMS) {
    await prisma.aIPlatform.upsert({
      where: { slug: platform.slug },
      update: {},
      create: { ...platform, isActive: true, isDemo: true },
    });
  }

  const platforms = await prisma.aIPlatform.findMany();

  for (const projectDef of DEMO_PROJECTS) {
    const rand = seededRand(hash(projectDef.domain));
    const da = 20 + Math.floor(rand() * 60);

    // Upsert project
    const existing = await prisma.project.findFirst({
      where: { domain: projectDef.domain, organizationId: org.id },
    });

    const project = existing ?? await prisma.project.create({
      data: {
        name: projectDef.name,
        domain: projectDef.domain,
        organizationId: org.id,
        userId: user.id,
        isActive: true,
        healthScore: 50 + Math.floor(rand() * 40),
        lastCrawledAt: subDays(new Date(), Math.floor(rand() * 3)),
      },
    });

    console.log(`  📁 Project: ${project.name}`);

    // Domain snapshots (6 months of history)
    for (let m = 5; m >= 0; m--) {
      const drift = (5 - m) * 2;
      await prisma.domainSnapshot.create({
        data: {
          projectId: project.id,
          domainAuthority: da + drift + Math.floor(rand() * 5),
          backlinksCount: 500 + drift * 50 + Math.floor(rand() * 200),
          referringDomainsCount: 80 + drift * 8 + Math.floor(rand() * 30),
          organicKeywords: 1200 + drift * 100 + Math.floor(rand() * 300),
          organicTraffic: 8000 + drift * 600 + Math.floor(rand() * 2000),
          spamScore: 1 + rand() * 3,
          snapshotDate: subMonths(new Date(), m),
          provider: "Mock (Demo)",
          isDemo: true,
        },
      });
    }

    // Keywords + Rankings
    for (const term of projectDef.keywords) {
      const kw = await prisma.keyword.create({
        data: {
          projectId: project.id,
          term,
          searchEngine: "GOOGLE",
          country: "US",
          language: "en",
          searchVolume: 500 + Math.floor(rand() * 5000),
          isActive: true,
        },
      });

      // 30 days of ranking history
      let pos = 5 + Math.floor(rand() * 25);
      for (let d = 30; d >= 0; d--) {
        const prev = pos;
        const delta = Math.round((rand() - 0.5) * 6);
        pos = Math.max(1, Math.min(100, pos + delta));
        await prisma.keywordRanking.create({
          data: {
            keywordId: kw.id,
            projectId: project.id,
            position: pos,
            previousPosition: d === 30 ? null : prev,
            change: d === 30 ? null : prev - pos,
            url: `https://${projectDef.domain}/${term.toLowerCase().replace(/\s+/g, "-")}`,
            snapshotDate: subDays(new Date(), d),
            isDemo: true,
          },
        });
      }
    }

    // Backlinks
    const blSources = [
      "techcrunch.com", "producthunt.com", "dev.to", "medium.com",
      "hackernews.com", "reddit.com", "g2.com", "capterra.com",
      "smashingmagazine.com", "css-tricks.com", "indiehackers.com",
      "github.com", "stackoverflow.com",
    ];

    for (let i = 0; i < 40; i++) {
      const src = blSources[i % blSources.length];
      const daysAgo = 10 + Math.floor(rand() * 300);
      const isLost = rand() < 0.1;
      const isNew = rand() < 0.08;

      await prisma.backlink.create({
        data: {
          projectId: project.id,
          sourceUrl: `https://${src}/post-${i}`,
          targetUrl: `https://${projectDef.domain}`,
          anchorText: ["seo tool", "rank tracker", "visit site", projectDef.domain][i % 4],
          isFollow: rand() > 0.2,
          firstSeen: subDays(new Date(), daysAgo),
          lastSeen: isLost ? subDays(new Date(), Math.floor(rand() * 20)) : new Date(),
          status: isNew ? "NEW" : isLost ? "LOST" : "ACTIVE",
          referringDomain: src,
          domainAuthority: 20 + Math.floor(rand() * 70),
          linkType: ["text", "image", "footer"][i % 3],
          isDemo: true,
        },
      });

      // Referring domains
      if (i % 3 === 0) {
        const existing = await prisma.referringDomain.findFirst({
          where: { projectId: project.id, domain: src },
        });
        if (!existing) {
          await prisma.referringDomain.create({
            data: {
              projectId: project.id,
              domain: src,
              domainAuthority: 20 + Math.floor(rand() * 70),
              backlinksCount: 1 + Math.floor(rand() * 5),
              firstSeen: subDays(new Date(), 30 + Math.floor(rand() * 300)),
              lastSeen: new Date(),
              isActive: true,
              isDemo: true,
            },
          });
        }
      }
    }

    // On-Page Audit
    const audit = await prisma.onPageAudit.create({
      data: {
        projectId: project.id,
        startedAt: subDays(new Date(), 1),
        completedAt: new Date(),
        totalPages: 18,
        criticalIssues: 3,
        warningIssues: 7,
        noticeIssues: 12,
        totalIssues: 22,
        healthScore: 64 + Math.floor(rand() * 20),
        isDemo: true,
      },
    });

    const issueTypes = [
      { type: "missing_title", severity: "CRITICAL" as const, title: "Missing Title Tag", desc: "Page has no <title> tag.", rec: "Add a unique, descriptive title tag between 50–60 characters." },
      { type: "missing_meta", severity: "CRITICAL" as const, title: "Missing Meta Description", desc: "Page has no meta description.", rec: "Add a meta description between 150–160 characters." },
      { type: "multiple_h1", severity: "WARNING" as const, title: "Multiple H1 Tags", desc: "Page has more than one H1 tag.", rec: "Use only one H1 per page." },
      { type: "long_title", severity: "WARNING" as const, title: "Title Tag Too Long", desc: "Title exceeds 60 characters.", rec: "Shorten the title to under 60 characters." },
      { type: "missing_alt", severity: "WARNING" as const, title: "Images Missing Alt Text", desc: "Images found without alt attributes.", rec: "Add descriptive alt text to all images." },
      { type: "broken_link", severity: "CRITICAL" as const, title: "Broken Internal Link", desc: "Link points to a 404 page.", rec: "Fix or remove the broken link." },
      { type: "thin_content", severity: "WARNING" as const, title: "Thin Content Page", desc: "Page has fewer than 300 words.", rec: "Expand the content to at least 300 words." },
      { type: "missing_canonical", severity: "NOTICE" as const, title: "Missing Canonical Tag", desc: "No canonical tag found.", rec: "Add a canonical tag to avoid duplicate content issues." },
      { type: "missing_og", severity: "NOTICE" as const, title: "Missing Open Graph Tags", desc: "Page lacks OG meta tags.", rec: "Add og:title, og:description, og:image tags." },
      { type: "noindex", severity: "NOTICE" as const, title: "Page Set to Noindex", desc: "Robots meta set to noindex.", rec: "Confirm this is intentional." },
    ];

    for (const issue of issueTypes) {
      await prisma.onPageIssue.create({
        data: {
          auditId: audit.id,
          projectId: project.id,
          url: `https://${projectDef.domain}/${issue.type.replace(/_/g, "-")}`,
          issueType: issue.type,
          severity: issue.severity,
          title: issue.title,
          description: issue.desc,
          recommendation: issue.rec,
          isFixed: rand() < 0.2,
        },
      });
    }

    // AI Brand Mention Checks
    for (const platform of platforms) {
      for (const prompt of AI_PROMPTS) {
        const seed = hash(project.domain + platform.slug + prompt);
        const r = seededRand(seed);
        const isMentioned = r() > 0.35;
        const position = isMentioned ? Math.floor(r() * 5) + 1 : null;

        await prisma.aIBrandMentionCheck.create({
          data: {
            projectId: project.id,
            platformId: platform.id,
            prompt,
            response: isMentioned
              ? `${projectDef.name} is one of the top tools in this category, ranked around #${position}. It provides comprehensive features for tracking and analytics.`
              : `Here are some recommended tools: CompetitorA, CompetitorB, CompetitorC. Each has unique strengths depending on your requirements.`,
            isMentioned,
            mentionPosition: position,
            sentiment: isMentioned ? (["POSITIVE", "NEUTRAL", "POSITIVE"] as const)[seed % 3] : null,
            score: isMentioned ? 40 + (seed % 50) : 0,
            snapshotDate: subDays(new Date(), Math.floor(r() * 7)),
            isDemo: true,
          },
        });
      }
    }

    // Competitors
    for (const competitorDomain of projectDef.competitors) {
      const comp = await prisma.competitor.create({
        data: {
          projectId: project.id,
          domain: competitorDomain,
          name: competitorDomain.split(".")[0].charAt(0).toUpperCase() + competitorDomain.split(".")[0].slice(1),
          isManual: false,
        },
      });

      for (let m = 2; m >= 0; m--) {
        const r2 = seededRand(hash(competitorDomain + m));
        await prisma.competitorSnapshot.create({
          data: {
            competitorId: comp.id,
            projectId: project.id,
            domainAuthority: 50 + Math.floor(r2() * 45),
            backlinksCount: 5000 + Math.floor(r2() * 50000),
            organicKeywords: 10000 + Math.floor(r2() * 100000),
            snapshotDate: subMonths(new Date(), m),
            isDemo: true,
          },
        });
      }
    }

    // Scheduled Jobs
    for (const jobType of ["KEYWORD_RANK_CHECK", "DOMAIN_SNAPSHOT", "BACKLINK_SCAN", "ON_PAGE_AUDIT"] as const) {
      await prisma.scheduledJob.create({
        data: {
          projectId: project.id,
          jobType,
          status: "COMPLETED",
          lastRunAt: subDays(new Date(), Math.floor(rand() * 3)),
          nextRunAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
    }

    // Monthly Report
    await prisma.report.create({
      data: {
        projectId: project.id,
        title: `Monthly SEO Report - ${new Date().toLocaleString("default", { month: "long", year: "numeric" })}`,
        period: `${subMonths(new Date(), 1).toISOString().split("T")[0]} to ${new Date().toISOString().split("T")[0]}`,
        generatedAt: new Date(),
        data: {
          summary: {
            daChange: +3,
            backlinksNew: 12,
            backlinksLost: 3,
            keywordsImproved: 8,
            keywordsDeclined: 2,
            aiMentionScore: 68,
            healthScore: 72,
          },
          topWins: ["Ranking #3 for 'seo rank tracker'", "12 new backlinks acquired", "DA increased by 3 points"],
          topLosses: ["2 keywords dropped >5 positions", "3 backlinks lost"],
          recommendations: [
            "Fix 3 critical on-page issues",
            "Build more backlinks from high-DA domains",
            "Expand AI visibility with structured content",
          ],
        },
      },
    });
  }

  console.log("✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
