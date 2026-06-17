import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role === "VIEWER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const data: any = {};

  if (body.workDescription !== undefined) data.workDescription = body.workDescription;
  if (body.agreedAmount !== undefined) data.agreedAmount = parseFloat(body.agreedAmount);
  if (body.startDate) data.startDate = new Date(body.startDate);
  if (body.endDate !== undefined) data.endDate = body.endDate ? new Date(body.endDate) : null;
  if (body.status) data.status = body.status;
  if (body.notes !== undefined) data.notes = body.notes || null;

  const updated = await prisma.subcontractorAssignment.update({
    where: { id },
    data,
    include: {
      subcontractor: true,
      project: { select: { id: true, name: true, client: true } },
      payments: true,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  // Cascade fshin pagesat; pagesat fshin Expense-t e lidhura via SetNull/Cascade
  await prisma.subcontractorAssignment.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
