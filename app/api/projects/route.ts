import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  domain: z.string().min(3).max(253),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as { organizationId?: string })?.organizationId;
  if (!orgId) return NextResponse.json({ error: "No org" }, { status: 400 });

  const projects = await prisma.project.findMany({
    where: { organizationId: orgId },
    include: { domainSnapshots: { orderBy: { snapshotDate: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string })?.id;
  const orgId = (session.user as { organizationId?: string })?.organizationId;
  if (!userId || !orgId) return NextResponse.json({ error: "Missing user/org" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { name, domain } = parsed.data;
  const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase();

  const project = await prisma.project.create({
    data: {
      name,
      domain: cleanDomain,
      organizationId: orgId,
      userId,
      isActive: true,
    },
  });

  return NextResponse.json(project, { status: 201 });
}
