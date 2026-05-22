import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role === "VIEWER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  const worker = await prisma.worker.update({
    where: { id },
    data: {
      ...(body.name && { name: body.name }),
      ...(body.position && { position: body.position }),
      phone: body.phone,
      email: body.email,
      ...(body.dailyRate !== undefined && { dailyRate: parseFloat(body.dailyRate) }),
      ...(body.active !== undefined && { active: body.active }),
    },
  });

  return NextResponse.json(worker);
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.worker.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
