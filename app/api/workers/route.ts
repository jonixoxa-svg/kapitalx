import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workers = await prisma.worker.findMany({
    include: {
      assignments: {
        include: { project: { select: { id: true, name: true, status: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(workers);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role === "VIEWER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, position, phone, email, dailyRate } = body;

  if (!name || !position || !dailyRate) {
    return NextResponse.json({ error: "Fushat e detyrueshme mungojnë" }, { status: 400 });
  }

  const worker = await prisma.worker.create({
    data: {
      name,
      position,
      phone,
      email,
      dailyRate: parseFloat(dailyRate),
    },
  });

  return NextResponse.json(worker, { status: 201 });
}
