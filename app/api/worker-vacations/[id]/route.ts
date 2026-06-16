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

  if (body.workDays !== undefined) {
    const v = parseInt(body.workDays);
    if (isNaN(v) || v < 0) return NextResponse.json({ error: "Vlerë jo e vlefshme" }, { status: 400 });
    data.workDays = v;
  }
  if (body.notes !== undefined) data.notes = body.notes || null;
  if (body.startDate) data.startDate = new Date(body.startDate);
  if (body.endDate) data.endDate = new Date(body.endDate);

  const updated = await prisma.workerVacation.update({
    where: { id },
    data,
    include: { worker: { select: { id: true, name: true, position: true } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role === "VIEWER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const vacation = await prisma.workerVacation.findUnique({ where: { id } });
  if (!vacation) return NextResponse.json({ error: "Pushimi nuk u gjet" }, { status: 404 });

  // Fshi gjithashtu Attendance records per ato dite (status VACATION)
  await prisma.attendance.deleteMany({
    where: {
      workerId: vacation.workerId,
      status: "VACATION",
      date: {
        gte: vacation.startDate,
        lte: vacation.endDate,
      },
    },
  });

  await prisma.workerVacation.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}
