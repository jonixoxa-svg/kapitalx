import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role === "VIEWER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { workerId, projectId, daysWorked, startDate, endDate, notes } = body;

  if (!workerId || !projectId || !startDate) {
    return NextResponse.json({ error: "Fushat e detyrueshme mungojnë" }, { status: 400 });
  }

  const assignment = await prisma.workerAssignment.upsert({
    where: { workerId_projectId: { workerId, projectId } },
    update: {
      daysWorked: parseFloat(daysWorked) || 0,
      endDate: endDate ? new Date(endDate) : null,
      notes,
    },
    create: {
      workerId,
      projectId,
      daysWorked: parseFloat(daysWorked) || 0,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      notes,
    },
    include: { worker: true, project: { select: { name: true } } },
  });

  return NextResponse.json(assignment, { status: 201 });
}
