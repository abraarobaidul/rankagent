import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { SearchEngine } from "@prisma/client";

const createSchema = z.object({
  term: z.string().min(1).max(250),
  searchEngine: z.nativeEnum(SearchEngine).default("GOOGLE"),
  country: z.string().max(10).optional(),
  language: z.string().max(10).optional(),
  searchVolume: z.number().int().positive().optional(),
});

async function getOrgProject(projectId: string, orgId: string) {
  return prisma.project.findFirst({ where: { id: projectId, organizationId: orgId } });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as { organizationId?: string })?.organizationId!;
  const { id: projectId } = await params;

  const project = await getOrgProject(projectId, orgId);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const keywords = await prisma.keyword.findMany({
    where: { projectId },
    include: { keywordRankings: { orderBy: { snapshotDate: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(keywords);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as { organizationId?: string })?.organizationId!;
  const { id: projectId } = await params;

  const project = await getOrgProject(projectId, orgId);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const keyword = await prisma.keyword.create({
    data: {
      projectId,
      ...parsed.data,
      country: parsed.data.country ?? "US",
      language: parsed.data.language ?? "en",
      isActive: true,
    },
  });

  return NextResponse.json(keyword, { status: 201 });
}
