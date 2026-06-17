import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const subcontractorId = searchParams.get("subcontractorId");

  const where: any = {};
  if (projectId) where.projectId = projectId;
  if (subcontractorId) where.subcontractorId = subcontractorId;

  const assignments = await prisma.subcontractorAssignment.findMany({
    where,
    include: {
      subcontractor: true,
      project: { select: { id: true, name: true, client: true } },
      payments: { orderBy: { date: "desc" } },
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
  const { subcontractorId, projectId, workDescription, agreedAmount, startDate, endDate, status, notes } = body;

  if (!subcontractorId || !projectId || !workDescription || agreedAmount === undefined || !startDate) {
    return NextResponse.json({ error: "Të gjitha fushat kryesore janë të detyrueshme" }, { status: 400 });
  }

  const amount = parseFloat(agreedAmount);
  if (isNaN(amount) || amount < 0) {
    return NextResponse.json({ error: "Vlera e dakorduar nuk është e vlefshme" }, { status: 400 });
  }

  const assignment = await prisma.subcontractorAssignment.create({
    data: {
      subcontractorId,
      projectId,
      workDescription: workDescription.trim(),
      agreedAmount: amount,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      status: (status as any) || "ACTIVE",
      notes: notes || null,
    },
    include: {
      subcontractor: true,
      project: { select: { id: true, name: true, client: true } },
      payments: true,
    },
  });

  return NextResponse.json(assignment, { status: 201 });
}
