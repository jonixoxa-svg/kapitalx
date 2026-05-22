import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const workerId = searchParams.get("workerId");

  const where: any = {};
  if (workerId) where.workerId = workerId;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }

  const records = await prisma.attendance.findMany({
    where,
    include: {
      worker: { select: { id: true, name: true, position: true, dailyRate: true } },
      project: { select: { id: true, name: true } },
    },
    orderBy: [{ date: "desc" }, { workerId: "asc" }],
  });

  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role === "VIEWER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { workerId, date, status, projectId, notes } = body;

  if (!workerId || !date || !status) {
    return NextResponse.json({ error: "workerId, date, status janë të detyrueshme" }, { status: 400 });
  }

  // Normalize date to midnight UTC so each day is a unique key
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);

  const record = await prisma.attendance.upsert({
    where: { workerId_date: { workerId, date: d } },
    update: { status, projectId: projectId || null, notes },
    create: { workerId, date: d, status, projectId: projectId || null, notes },
  });

  return NextResponse.json(record, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id mungon" }, { status: 400 });

  await prisma.attendance.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
