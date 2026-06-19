import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.pendingExpense.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role === "VIEWER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { description, amount, date, source, reason, notes, type, receiptUrl, receiptName } = body;

  if (!description || amount === undefined) {
    return NextResponse.json({ error: "description dhe amount jane te detyrueshme" }, { status: 400 });
  }

  const amt = parseFloat(amount);
  if (isNaN(amt)) {
    return NextResponse.json({ error: "Vlera e pavlefshme" }, { status: 400 });
  }

  const item = await prisma.pendingExpense.create({
    data: {
      description,
      amount: amt,
      date: date ? new Date(date) : new Date(),
      source: source || null,
      reason: reason || null,
      notes: notes || null,
      type: type || "EXPENSE",
      receiptUrl: receiptUrl || null,
      receiptName: receiptName || null,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
