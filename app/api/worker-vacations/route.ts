import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const workerId = searchParams.get("workerId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: any = {};
  if (workerId) where.workerId = workerId;
  if (from || to) {
    where.OR = [];
    if (from && to) {
      // Pushimet qe mbivendosen me periudhen
      where.OR.push({
        AND: [
          { startDate: { lte: new Date(to) } },
          { endDate: { gte: new Date(from) } },
        ],
      });
    } else if (from) {
      where.endDate = { gte: new Date(from) };
    } else if (to) {
      where.startDate = { lte: new Date(to) };
    }
  }

  const vacations = await prisma.workerVacation.findMany({
    where,
    include: { worker: { select: { id: true, name: true, position: true } } },
    orderBy: { startDate: "asc" },
  });

  return NextResponse.json(vacations);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role === "VIEWER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { workerId, startDate, endDate, notes, workDays: providedWorkDays } = body;

  if (!workerId || !startDate || !endDate) {
    return NextResponse.json({ error: "workerId, startDate, endDate jane te detyrueshme" }, { status: 400 });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end < start) {
    return NextResponse.json({ error: "Data e fundit duhet pas dates se fillimit" }, { status: 400 });
  }

  // Llogarit ditet e punes (Mon-Fri) ne ate periudhe si default
  let computedWorkDays = 0;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const day = d.getDay(); // 0 = Sun, 6 = Sat
    if (day !== 0 && day !== 6) computedWorkDays++;
  }

  // Perdor vleren e dhene nese eshte, ose default
  const workDays = providedWorkDays !== undefined && providedWorkDays !== null && providedWorkDays !== ""
    ? Math.max(0, parseInt(providedWorkDays))
    : computedWorkDays;

  // Kontrollo nese ka pushim te tjera te vitit qe e teprojne 14 ditesh
  const worker = await prisma.worker.findUnique({ where: { id: workerId } });
  if (!worker) return NextResponse.json({ error: "Punetori nuk u gjet" }, { status: 404 });

  const year = start.getFullYear();
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);

  const existing = await prisma.workerVacation.findMany({
    where: {
      workerId,
      startDate: { gte: yearStart, lte: yearEnd },
    },
  });

  const usedDays = existing.reduce((sum, v) => sum + (v.workDays || 0), 0);

  const allowed = worker.vacationDaysPerYear || 14;
  if (usedDays + workDays > allowed) {
    return NextResponse.json({
      error: `Tejkalon kufirin vjetor (${allowed} dite pune). Tashme te shfrytezuara: ${usedDays}. Po kerkohen edhe ${workDays}.`,
    }, { status: 400 });
  }

  const vacation = await prisma.workerVacation.create({
    data: {
      workerId,
      startDate: start,
      endDate: end,
      workDays,
      notes: notes || null,
    },
    include: { worker: { select: { id: true, name: true, position: true } } },
  });

  // Automatikisht krijo Attendance records me status VACATION per cdo dite
  const attendanceRecords = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    attendanceRecords.push({
      workerId,
      date: new Date(d),
      status: "VACATION" as const,
      notes: notes || "Pushim",
    });
  }

  // Skip duplicates duke perdorur createMany me skipDuplicates
  try {
    await prisma.attendance.createMany({
      data: attendanceRecords,
      skipDuplicates: true,
    });
  } catch (e) {
    console.error("Gabim ne krijim te Attendance per pushim:", e);
  }

  return NextResponse.json(vacation, { status: 201 });
}
