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
  ["description", "source", "reason", "notes", "type", "receiptUrl", "receiptName"].forEach((k) => {
    if (body[k] !== undefined) data[k] = body[k] || null;
  });
  if (body.amount !== undefined) data.amount = parseFloat(body.amount);
  if (body.date) data.date = new Date(body.date);

  const updated = await prisma.pendingExpense.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role === "VIEWER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.pendingExpense.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
