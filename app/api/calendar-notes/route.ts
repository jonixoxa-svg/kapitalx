import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function dateOnly(d: string | Date) {
  const x = new Date(d);
  return new Date(Date.UTC(x.getFullYear(), x.getMonth(), x.getDate()));
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: any = {};
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = dateOnly(from);
    if (to) where.date.lte = dateOnly(to);
  }

  const notes = await prisma.calendarNote.findMany({
    where,
    orderBy: { date: "asc" },
  });
  return NextResponse.json(notes);
}

// POST upserts: save or update a note for a given date
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role === "VIEWER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { date, text, color } = body;
  if (!date) return NextResponse.json({ error: "date mungon" }, { status: 400 });

  const d = dateOnly(date);

  // If text empty → delete
  if (!text || text.trim() === "") {
    await prisma.calendarNote.deleteMany({ where: { date: d } });
    return NextResponse.json({ deleted: true });
  }

  const note = await prisma.calendarNote.upsert({
    where: { date: d },
    create: { date: d, text, color: color || null },
    update: { text, color: color || null },
  });

  return NextResponse.json(note);
}
