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

  const expense = await prisma.generalExpense.update({
    where: { id },
    data: {
      ...(body.category && { category: body.category }),
      ...(body.description && { description: body.description }),
      ...(body.amount !== undefined && { amount: parseFloat(body.amount) }),
      ...(body.month !== undefined && { month: parseInt(body.month) }),
      ...(body.year !== undefined && { year: parseInt(body.year) }),
      ...(body.recurring !== undefined && { recurring: body.recurring }),
    },
  });

  return NextResponse.json(expense);
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role === "VIEWER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.generalExpense.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
