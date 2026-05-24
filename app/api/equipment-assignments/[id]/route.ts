import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

async function syncExpenseForAssignment(assignmentId: string) {
  const a = await prisma.equipmentAssignment.findUnique({
    where: { id: assignmentId },
    include: { equipment: true },
  });
  if (!a) return;

  const amount = (a.daysUsed || 0) * (a.equipment.dailyRate || 0);
  const existing = await prisma.expense.findUnique({
    where: { sourceEquipmentAssignmentId: assignmentId },
  });

  if (amount <= 0) {
    if (existing) await prisma.expense.delete({ where: { id: existing.id } });
    return;
  }

  const description = `Pajisja: ${a.equipment.name} (${a.daysUsed} ditë × ${a.equipment.dailyRate}€)`;
  if (existing) {
    await prisma.expense.update({
      where: { id: existing.id },
      data: { amount, description, projectId: a.projectId },
    });
  } else {
    await prisma.expense.create({
      data: {
        projectId: a.projectId,
        category: "EQUIPMENT",
        description,
        amount,
        date: a.startDate,
        sourceEquipmentAssignmentId: assignmentId,
      },
    });
  }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role === "VIEWER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  const assignment = await prisma.equipmentAssignment.update({
    where: { id },
    data: {
      ...(body.startDate && { startDate: new Date(body.startDate) }),
      ...(body.endDate !== undefined && { endDate: body.endDate ? new Date(body.endDate) : null }),
      ...(body.daysUsed !== undefined && { daysUsed: parseFloat(body.daysUsed) }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
  });

  await syncExpenseForAssignment(id);

  return NextResponse.json(assignment);
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  // Delete linked expense too (cascade not configured, do it manually)
  await prisma.expense.deleteMany({ where: { sourceEquipmentAssignmentId: id } });
  await prisma.equipmentAssignment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
