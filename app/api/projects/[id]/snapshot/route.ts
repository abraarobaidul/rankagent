import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDomainAuthorityProvider } from "@/lib/providers";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as { organizationId?: string })?.organizationId!;
  const { id: projectId } = await params;

  const project = await prisma.project.findFirst({ where: { id: projectId, organizationId: orgId } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const provider = getDomainAuthorityProvider();
  const data = await provider.getDomainAuthority(project.domain);

  const snapshot = await prisma.domainSnapshot.create({
    data: {
      projectId,
      domainAuthority: data.domainAuthority,
      backlinksCount: data.backlinksCount,
      referringDomainsCount: data.referringDomainsCount,
      organicKeywords: data.organicKeywords,
      organicTraffic: data.organicTraffic,
      spamScore: data.spamScore,
      snapshotDate: new Date(),
      provider: data.provider,
      isDemo: data.isDemo,
    },
  });

  await prisma.project.update({
    where: { id: projectId },
    data: { lastCrawledAt: new Date() },
  });

  return NextResponse.json(snapshot, { status: 201 });
}
