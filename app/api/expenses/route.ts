import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role === "VIEWER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { projectId, category, description, amount, date } = body;

  if (!projectId || !category || !description || !amount) {
    return NextResponse.json({ error: "Fushat e detyrueshme mungojnë" }, { status: 400 });
  }

  const expense = await prisma.expense.create({
    data: {
      projectId,
      category,
      description,
      amount: parseFloat(amount),
      date: date ? new Date(date) : new Date(),
    },
  });

  return NextResponse.json(expense, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  const expenses = await prisma.expense.findMany({
    where: projectId ? { projectId } : {},
    orderBy: { date: "desc" },
  });

  return NextResponse.json(expenses);
}
