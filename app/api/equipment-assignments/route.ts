import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  const assignments = await prisma.equipmentAssignment.findMany({
    where: projectId ? { projectId } : {},
    include: {
      equipment: true,
      project: { select: { id: true, name: true, status: true } },
    },
    orderBy: { startDate: "desc" },
  });

  return NextResponse.json(assignments);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role === "VIEWER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { equipmentId, projectId, startDate, endDate, daysUsed, notes } = body;

  if (!equipmentId || !projectId || !startDate) {
    return NextResponse.json({ error: "equipmentId, projectId, startDate janë të detyrueshme" }, { status: 400 });
  }

  const assignment = await prisma.equipmentAssignment.create({
    data: {
      equipmentId,
      projectId,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      daysUsed: daysUsed ? parseFloat(daysUsed) : 0,
      notes: notes || null,
    },
    include: { equipment: true, project: { select: { id: true, name: true } } },
  });

  return NextResponse.json(assignment, { status: 201 });
}
