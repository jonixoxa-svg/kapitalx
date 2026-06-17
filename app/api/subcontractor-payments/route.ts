import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const assignmentId = searchParams.get("assignmentId");

  const payments = await prisma.subcontractorPayment.findMany({
    where: assignmentId ? { assignmentId } : {},
    include: {
      assignment: {
        include: {
          subcontractor: true,
          project: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(payments);
}

// POST krijon pagese DHE automatikisht krijon nje Expense ne projekt
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role === "VIEWER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { assignmentId, amount, date, description, method } = body;

  if (!assignmentId || amount === undefined || !date) {
    return NextResponse.json({ error: "assignmentId, amount, date janë të detyrueshme" }, { status: 400 });
  }

  const amt = parseFloat(amount);
  if (isNaN(amt) || amt <= 0) {
    return NextResponse.json({ error: "Vlera e pagesës duhet të jetë më e madhe se 0" }, { status: 400 });
  }

  // Sigurohu që assignment ekziston dhe merr projectId
  const assignment = await prisma.subcontractorAssignment.findUnique({
    where: { id: assignmentId },
    include: { subcontractor: true, project: true },
  });
  if (!assignment) {
    return NextResponse.json({ error: "Caktimi nuk u gjet" }, { status: 404 });
  }

  // Krijo pagesen
  const payment = await prisma.subcontractorPayment.create({
    data: {
      assignmentId,
      amount: amt,
      date: new Date(date),
      description: description || null,
      method: (method as any) || "CASH",
    },
  });

  // Auto-krijo nje Expense ne projekt (kategoria SUBCONTRACTOR)
  const expenseDescription = description
    ? `Pagesë për ${assignment.subcontractor.name}: ${description}`
    : `Pagesë për ${assignment.subcontractor.name} (${assignment.workDescription})`;

  await prisma.expense.create({
    data: {
      projectId: assignment.projectId,
      category: "SUBCONTRACTOR",
      description: expenseDescription,
      amount: amt,
      date: new Date(date),
      sourceSubcontractorPaymentId: payment.id,
    },
  });

  // Rikthej pagesen me te dhena te plota
  const fullPayment = await prisma.subcontractorPayment.findUnique({
    where: { id: payment.id },
    include: {
      assignment: {
        include: {
          subcontractor: true,
          project: { select: { id: true, name: true } },
        },
      },
    },
  });

  return NextResponse.json(fullPayment, { status: 201 });
}
