import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const equipment = await prisma.equipment.findMany({
    include: {
      assignments: {
        include: { project: { select: { id: true, name: true, status: true } } },
        orderBy: { startDate: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(equipment);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role === "VIEWER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, type, dailyRate, description } = body;

  if (!name) return NextResponse.json({ error: "Emri mungon" }, { status: 400 });

  const equipment = await prisma.equipment.create({
    data: {
      name,
      type: type || "OTHER",
      dailyRate: dailyRate ? parseFloat(dailyRate) : 0,
      description: description || null,
    },
  });

  return NextResponse.json(equipment, { status: 201 });
}
