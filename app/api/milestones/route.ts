import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Llogarit progresin e projektit ne baze te milestones te perfunduara
async function recalcProjectProgress(projectId: string) {
  const milestones = await prisma.projectMilestone.findMany({
    where: { projectId },
  });
  if (milestones.length === 0) return;
  const completed = milestones.filter((m) => m.completed).length;
  const progress = Math.round((completed / milestones.length) * 100);
  await prisma.project.update({
    where: { id: projectId },
    data: { progress },
  });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  const milestones = await prisma.projectMilestone.findMany({
    where: projectId ? { projectId } : undefined,
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(milestones);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role === "VIEWER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { projectId, title, description, order } = body;

  if (!projectId || !title) {
    return NextResponse.json({ error: "projectId dhe title jane te detyrueshme" }, { status: 400 });
  }

  // Nese order nuk eshte dhene, vendose ne fund
  let finalOrder = order;
  if (finalOrder === undefined || finalOrder === null) {
    const last = await prisma.projectMilestone.findFirst({
      where: { projectId },
      orderBy: { order: "desc" },
    });
    finalOrder = last ? last.order + 1 : 0;
  }

  const milestone = await prisma.projectMilestone.create({
    data: {
      projectId,
      title,
      description: description || null,
      order: finalOrder,
    },
  });

  await recalcProjectProgress(projectId);

  return NextResponse.json(milestone, { status: 201 });
}
