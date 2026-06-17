import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role === "VIEWER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  // Fshi gjithashtu Expense-in e lidhur
  await prisma.expense.deleteMany({
    where: { sourceSubcontractorPaymentId: id },
  });

  await prisma.subcontractorPayment.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
