import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function recalcProjectProgress(projectId: string) {
  const milestones = await prisma.projectMilestone.findMany({
    where: { projectId },
  });
  if (milestones.length === 0) {
    // Nese nuk ka me milestones, le progresin si eshte (te perdoruesi e vendos manualisht)
    return;
  }
  const completed = milestones.filter((m) => m.completed).length;
  const progress = Math.round((completed / milestones.length) * 100);
  await prisma.project.update({
    where: { id: projectId },
    data: { progress },
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role === "VIEWER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { title, description, completed, order, startDate, endDate } = body;

  const existing = await prisma.projectMilestone.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Nuk u gjet" }, { status: 404 });

  const data: any = {};
  if (title !== undefined) data.title = title;
  if (description !== undefined) data.description = description;
  if (order !== undefined) data.order = order;
  if (completed !== undefined) {
    data.completed = completed;
    data.completedAt = completed ? new Date() : null;
  }
  if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;
  if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;

  const milestone = await prisma.projectMilestone.update({
    where: { id },
    data,
  });

  if (completed !== undefined) {
    await recalcProjectProgress(existing.projectId);
  }

  return NextResponse.json(milestone);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role === "VIEWER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.projectMilestone.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Nuk u gjet" }, { status: 404 });

  await prisma.projectMilestone.delete({ where: { id } });
  await recalcProjectProgress(existing.projectId);

  return NextResponse.json({ ok: true });
}
