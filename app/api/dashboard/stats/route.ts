import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [projects, workers, generalExpenses] = await Promise.all([
    prisma.project.findMany({
      include: {
        expenses: true,
        workerAssignments: { include: { worker: true } },
      },
    }),
    prisma.worker.findMany(),
    prisma.generalExpense.findMany(),
  ]);

  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === "ACTIVE").length;
  const completedProjects = projects.filter((p) => p.status === "COMPLETED").length;
  const plannedProjects = projects.filter((p) => p.status === "PLANNED").length;

  const totalRevenue = projects.reduce((s, p) => s + p.contractValue, 0);
  const totalProjectExpenses = projects.reduce(
    (s, p) => s + p.expenses.reduce((es, e) => es + e.amount, 0),
    0
  );
  const totalLaborCost = projects.reduce(
    (s, p) =>
      s + p.workerAssignments.reduce((ws, a) => ws + a.daysWorked * a.worker.dailyRate, 0),
    0
  );
  const totalGeneralExpenses = generalExpenses.reduce((s, e) => s + e.amount, 0);
  const totalExpenses = totalProjectExpenses + totalLaborCost + totalGeneralExpenses;
  const grossProfit = totalRevenue - totalProjectExpenses - totalLaborCost;
  const netProfit = grossProfit - totalGeneralExpenses;

  const totalWorkers = workers.length;
  const activeWorkers = workers.filter((w) => w.active).length;

  // Monthly data for the last 6 months
  const now = new Date();
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    const label = d.toLocaleString("sq-AL", { month: "short" });

    const monthExpenses = projects
      .flatMap((p) => p.expenses)
      .filter((e) => {
        const ed = new Date(e.date);
        return ed.getMonth() + 1 === month && ed.getFullYear() === year;
      })
      .reduce((s, e) => s + e.amount, 0);

    const monthGeneral = generalExpenses
      .filter((e) => e.month === month && e.year === year)
      .reduce((s, e) => s + e.amount, 0);

    // Approximate revenue by projects active that month
    const monthRevenue = projects
      .filter((p) => {
        const start = new Date(p.startDate);
        const end = p.endDate ? new Date(p.endDate) : new Date();
        return start <= new Date(year, month - 1, 28) && end >= new Date(year, month - 1, 1);
      })
      .reduce((s, p) => {
        // distribute revenue evenly over project months
        const start = new Date(p.startDate);
        const end = p.endDate ? new Date(p.endDate) : new Date();
        const totalMonths = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)));
        return s + p.contractValue / totalMonths;
      }, 0);

    return {
      month: label,
      revenue: Math.round(monthRevenue),
      expenses: Math.round(monthExpenses + monthGeneral),
      profit: Math.round(monthRevenue - monthExpenses - monthGeneral),
    };
  });

  // Recent projects
  const recentProjects = await prisma.project.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      expenses: true,
      workerAssignments: { include: { worker: true } },
      createdBy: { select: { name: true } },
    },
  });

  return NextResponse.json({
    totalProjects,
    activeProjects,
    completedProjects,
    plannedProjects,
    totalRevenue,
    totalExpenses,
    totalProjectExpenses,
    totalLaborCost,
    totalGeneralExpenses,
    grossProfit,
    netProfit,
    totalWorkers,
    activeWorkers,
    monthlyData,
    recentProjects,
  });
}
