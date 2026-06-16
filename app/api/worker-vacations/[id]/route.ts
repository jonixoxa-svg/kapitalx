import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
