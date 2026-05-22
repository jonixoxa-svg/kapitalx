import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, getExpenseCategoryLabel } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") || "json";
  const projectId = searchParams.get("projectId");

  const projects = await prisma.project.findMany({
    where: projectId ? { id: projectId } : {},
    include: {
      expenses: true,
      workerAssignments: { include: { worker: true } },
    },
  });

  const generalExpenses = await prisma.generalExpense.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  if (format === "csv") {
    const rows = [
      ["Projekti", "Klienti", "Lokacioni", "Statusi", "Vlera Kontratës", "Shpenzime Materiale", "Kosto Punëtorësh", "Fitimi Bruto"],
      ...projects.map((p) => {
        const expenses = p.expenses.reduce((s, e) => s + e.amount, 0);
        const labor = p.workerAssignments.reduce((s, a) => s + a.daysWorked * a.worker.dailyRate, 0);
        const gross = p.contractValue - expenses - labor;
        return [p.name, p.client, p.location, p.status, p.contractValue, expenses, labor, gross];
      }),
    ];

    const csv = rows.map((r) => r.join(",")).join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="kapitalx-report-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  }

  // JSON format
  const report = {
    generatedAt: new Date().toISOString(),
    projects: projects.map((p) => {
      const totalExpenses = p.expenses.reduce((s, e) => s + e.amount, 0);
      const totalLabor = p.workerAssignments.reduce((s, a) => s + a.daysWorked * a.worker.dailyRate, 0);
      const grossProfit = p.contractValue - totalExpenses - totalLabor;

      return {
        id: p.id,
        name: p.name,
        client: p.client,
        location: p.location,
        status: p.status,
        progress: p.progress,
        contractValue: p.contractValue,
        expenses: {
          total: totalExpenses,
          breakdown: p.expenses.map((e) => ({
            category: getExpenseCategoryLabel(e.category),
            description: e.description,
            amount: e.amount,
            date: formatDate(e.date),
          })),
        },
        labor: {
          total: totalLabor,
          workers: p.workerAssignments.map((a) => ({
            name: a.worker.name,
            position: a.worker.position,
            daysWorked: a.daysWorked,
            dailyRate: a.worker.dailyRate,
            total: a.daysWorked * a.worker.dailyRate,
          })),
        },
        grossProfit,
      };
    }),
    generalExpenses: generalExpenses.reduce((s, e) => s + e.amount, 0),
    summary: {
      totalRevenue: projects.reduce((s, p) => s + p.contractValue, 0),
      totalProjectCosts: projects.reduce(
        (s, p) => s + p.expenses.reduce((es, e) => es + e.amount, 0),
        0
      ),
      totalLaborCosts: projects.reduce(
        (s, p) => s + p.workerAssignments.reduce((ws, a) => ws + a.daysWorked * a.worker.dailyRate, 0),
        0
      ),
      totalGeneralExpenses: generalExpenses.reduce((s, e) => s + e.amount, 0),
    },
  };

  return NextResponse.json(report);
}
