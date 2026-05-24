import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/reports/half-year?year=2026&half=1   (half: 1=Jan-Jun, 2=Jul-Dec)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
  const half = parseInt(searchParams.get("half") || "1");

  const startMonth = half === 1 ? 0 : 6;
  const endMonth = half === 1 ? 5 : 11;
  const start = new Date(year, startMonth, 1);
  const end = new Date(year, endMonth + 1, 0, 23, 59, 59);

  // Project expenses
  const projectExpenses = await prisma.expense.findMany({
    where: { date: { gte: start, lte: end } },
    include: { project: { select: { id: true, name: true } } },
    orderBy: { date: "desc" },
  });

  // General expenses
  const generalExpenses = await prisma.generalExpense.findMany({
    where: {
      OR: [
        { year, month: { gte: startMonth + 1, lte: endMonth + 1 } },
        { date: { gte: start, lte: end } },
      ],
    },
    include: { project: { select: { id: true, name: true } } },
    orderBy: { date: "desc" },
  });

  // Payments received
  const payments = await prisma.projectPayment.findMany({
    where: { date: { gte: start, lte: end } },
    include: { project: { select: { id: true, name: true } } },
    orderBy: { date: "desc" },
  });

  // Completed projects in period
  const completedProjects = await prisma.project.findMany({
    where: {
      status: "COMPLETED",
      OR: [
        { endDate: { gte: start, lte: end } },
        { updatedAt: { gte: start, lte: end } },
      ],
    },
    include: {
      expenses: true,
      workerAssignments: { include: { worker: true } },
    },
  });

  // Production in period
  const production = await prisma.production.findMany({
    where: { startDate: { gte: start, lte: end } },
    include: { workers: { include: { worker: true } } },
    orderBy: { startDate: "desc" },
  });

  // Stock movements in period
  const stockMovements = await prisma.stockMovement.findMany({
    where: { createdAt: { gte: start, lte: end } },
    include: {
      stockItem: { select: { id: true, name: true, unit: true } },
      project: { select: { id: true, name: true } },
      production: { select: { id: true, itemName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Worker attendance in period
  const attendance = await prisma.attendance.findMany({
    where: { date: { gte: start, lte: end } },
    include: { worker: { select: { id: true, name: true, dailyRate: true } } },
  });

  // Aggregates
  const totalProjectExpenses = projectExpenses.reduce((s, e) => s + e.amount, 0);
  const totalGeneralExpenses = generalExpenses.reduce((s, e) => s + e.amount, 0);
  const totalPayments = payments.reduce((s, p) => s + p.amount, 0);
  const totalProductionHours = production.reduce((s, p) => s + p.estimatedHours, 0);

  return NextResponse.json({
    period: {
      year,
      half,
      label: half === 1 ? `1 Janar - 30 Qershor ${year}` : `1 Korrik - 31 Dhjetor ${year}`,
      start: start.toISOString(),
      end: end.toISOString(),
    },
    summary: {
      totalProjectExpenses,
      totalGeneralExpenses,
      totalExpenses: totalProjectExpenses + totalGeneralExpenses,
      totalPayments,
      totalProductionHours,
      projectsCompleted: completedProjects.length,
      productionsCount: production.length,
      stockMovementsCount: stockMovements.length,
    },
    projectExpenses,
    generalExpenses,
    payments,
    completedProjects,
    production,
    stockMovements,
    attendance,
  });
}
