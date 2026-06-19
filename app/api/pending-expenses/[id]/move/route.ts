import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/pending-expenses/[id]/move
// body: { targetType: "project" | "general" | "project-payment", projectId?: string, category?: string, method?: string }
// Levzin nje pending ne tabelen perkatese dhe e fshin nga PendingExpense
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role === "VIEWER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { targetType, projectId, category, method } = body;

  if (!targetType || !["project", "general", "project-payment"].includes(targetType)) {
    return NextResponse.json({ error: "targetType duhet te jete 'project', 'general' ose 'project-payment'" }, { status: 400 });
  }

  const pending = await prisma.pendingExpense.findUnique({ where: { id } });
  if (!pending) return NextResponse.json({ error: "Nuk u gjet" }, { status: 404 });

  if (targetType === "project") {
    if (!projectId) return NextResponse.json({ error: "projectId duhet" }, { status: 400 });
    if (!category) return NextResponse.json({ error: "category duhet" }, { status: 400 });

    await prisma.expense.create({
      data: {
        projectId,
        category: category as any,
        description: pending.description,
        amount: pending.amount,
        date: pending.date,
        receipt: pending.receiptUrl,
      },
    });
  } else if (targetType === "general") {
    if (!category) return NextResponse.json({ error: "category duhet" }, { status: 400 });

    const d = new Date(pending.date);
    await prisma.generalExpense.create({
      data: {
        category: category as any,
        description: pending.description,
        amount: pending.amount,
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        recurring: false,
        projectId: projectId || null,
        date: pending.date,
        receiptUrl: pending.receiptUrl,
        receiptName: pending.receiptName,
      },
    });
  } else if (targetType === "project-payment") {
    if (!projectId) return NextResponse.json({ error: "projectId duhet" }, { status: 400 });

    await prisma.projectPayment.create({
      data: {
        projectId,
        amount: pending.amount,
        date: pending.date,
        description: pending.description,
        method: (method as any) || "CASH",
        receiptUrl: pending.receiptUrl,
        receiptName: pending.receiptName,
      },
    });
  }

  // Fshi nga pending
  await prisma.pendingExpense.delete({ where: { id } });

  return NextResponse.json({ moved: true, targetType });
}
