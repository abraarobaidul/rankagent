import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  domain: z.string().min(3).max(253),
  name: z.string().max(100).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as { organizationId?: string })?.organizationId!;
  const { id: projectId } = await params;

  const project = await prisma.project.findFirst({ where: { id: projectId, organizationId: orgId } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const domain = parsed.data.domain.replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase();

  const competitor = await prisma.competitor.create({
    data: {
      projectId,
      domain,
      name: parsed.data.name ?? domain.split(".")[0],
      isManual: true,
    },
  });

  return NextResponse.json(competitor, { status: 201 });
}
