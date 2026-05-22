import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      expenses: { orderBy: { date: "desc" } },
      workerAssignments: { include: { worker: true }, orderBy: { createdAt: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
      activityLogs: { include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 20 },
      createdBy: { select: { name: true, email: true } },
    },
  });

  if (!project) return NextResponse.json({ error: "Projekti nuk u gjet" }, { status: 404 });

  return NextResponse.json(project);
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role === "VIEWER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { name, client, location, description, startDate, endDate, status, contractValue, progress, notes } = body;

  const project = await prisma.project.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(client && { client }),
      ...(location && { location }),
      description,
      ...(startDate && { startDate: new Date(startDate) }),
      endDate: endDate ? new Date(endDate) : null,
      ...(status && { status }),
      ...(contractValue !== undefined && { contractValue: parseFloat(contractValue) }),
      ...(progress !== undefined && { progress: parseInt(progress) }),
      notes,
    },
  });

  await prisma.activityLog.create({
    data: {
      projectId: project.id,
      userId: (session.user as any).id,
      action: "PROJECT_UPDATED",
      description: `Projekti '${project.name}' u përditësua`,
    },
  });

  return NextResponse.json(project);
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.project.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
