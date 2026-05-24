import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: any = {};
  if (from || to) {
    where.startDate = {};
    if (from) where.startDate.gte = new Date(from);
    if (to) where.startDate.lte = new Date(to);
  }

  const items = await prisma.production.findMany({
    where,
    include: {
      workers: { include: { worker: true } },
    },
    orderBy: { startDate: "desc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role === "VIEWER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { itemName, quantity, estimatedHours, startDate, endDate, status, notes, workerIds } = body;

  if (!itemName || !startDate) {
    return NextResponse.json({ error: "Emri dhe data e fillimit jane te detyrueshme" }, { status: 400 });
  }

  const production = await prisma.production.create({
    data: {
      itemName,
      quantity: parseInt(quantity) || 1,
      estimatedHours: parseFloat(estimatedHours) || 0,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      status: status || "PLANNED",
      notes: notes || null,
      workers: workerIds && Array.isArray(workerIds) ? {
        create: workerIds.map((wid: string) => ({
          worker: { connect: { id: wid } },
          hoursAssigned: 0,
        })),
      } : undefined,
    },
    include: { workers: { include: { worker: true } } },
  });

  return NextResponse.json(production, { status: 201 });
}
