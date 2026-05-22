import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  const expenses = await prisma.generalExpense.findMany({
    where: {
      ...(month ? { month: parseInt(month) } : {}),
      ...(year ? { year: parseInt(year) } : {}),
    },
    orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(expenses);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role === "VIEWER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { category, description, amount, month, year, recurring } = body;

  if (!category || !description || !amount || !month || !year) {
    return NextResponse.json({ error: "Fushat e detyrueshme mungojnë" }, { status: 400 });
  }

  const expense = await prisma.generalExpense.create({
    data: {
      category,
      description,
      amount: parseFloat(amount),
      month: parseInt(month),
      year: parseInt(year),
      recurring: recurring || false,
    },
  });

  return NextResponse.json(expense, { status: 201 });
}
