import Header from "@/components/layout/Header";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import FinancialClient from "@/components/financial/FinancialClient";
import CompanyRevenueCard from "@/components/financial/CompanyRevenueCard";

async function getCompanySettings() {
  let settings = await prisma.companySettings.findFirst();
  if (!settings) {
    settings = await prisma.companySettings.create({ data: { totalRevenue: 0 } });
  }
  return settings;
}

export default async function FinancialPage() {
  const session = await auth();
  const role = (session?.user as any)?.role || "VIEWER";
  const [projects, generalExpenses, settings] = await Promise.all([
    prisma.project.findMany({
      include: {
        expenses: true,
        workerAssignments: { include: { worker: true } },
      },
    }),
    prisma.generalExpense.findMany(),
    getCompanySettings(),
  ]);

  const calculatedRevenue = projects.reduce((s, p) => s + p.contractValue, 0);
  // Perdor te ardhurat manuale nese jane > 0, perndryshe ato te llogariturat
  const totalRevenue = settings.totalRevenue > 0 ? settings.totalRevenue : calculatedRevenue;
  const totalProjectExpenses = projects.reduce(
    (s, p) => s + p.expenses.reduce((es, e) => es + e.amount, 0),
    0
  );
  const totalLaborCost = projects.reduce(
    (s, p) => s + p.workerAssignments.reduce((ws, a) => ws + a.daysWorked * a.worker.dailyRate, 0),
    0
  );
  const totalGeneralExpenses = generalExpenses.reduce((s, e) => s + e.amount, 0);
  const grossProfit = totalRevenue - totalProjectExpenses - totalLaborCost;
  const netProfit = grossProfit - totalGeneralExpenses;

  // Monthly data
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

    const monthRevenue = projects
      .filter((p) => {
        const start = new Date(p.startDate);
        const end = p.endDate ? new Date(p.endDate) : new Date();
        return start <= new Date(year, month - 1, 28) && end >= new Date(year, month - 1, 1);
      })
      .reduce((s, p) => {
        const start = new Date(p.startDate);
        const end = p.endDate ? new Date(p.endDate) : new Date();
        const totalMonths = Math.max(
          1,
          Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30))
        );
        return s + p.contractValue / totalMonths;
      }, 0);

    return {
      month: label,
      revenue: Math.round(monthRevenue),
      expenses: Math.round(monthExpenses + monthGeneral),
      profit: Math.round(monthRevenue - monthExpenses - monthGeneral),
    };
  });

  // Per-project profitability
  const projectFinancials = projects.map((p) => {
    const expenses = p.expenses.reduce((s, e) => s + e.amount, 0);
    const labor = p.workerAssignments.reduce((s, a) => s + a.daysWorked * a.worker.dailyRate, 0);
    return {
      id: p.id,
      name: p.name,
      client: p.client,
      status: p.status,
      contractValue: p.contractValue,
      expenses,
      labor,
      totalCost: expenses + labor,
      profit: p.contractValue - expenses - labor,
    };
  });

  return (
    <div className="min-h-screen">
      <Header title="Përmbledhje Financiare" subtitle="Analizë e plotë financiare" />
      <div className="p-6 animate-fade-in space-y-5">
        <CompanyRevenueCard
          initialTotalRevenue={settings.totalRevenue}
          initialNote={settings.totalRevenueNote}
          calculatedTotalRevenue={calculatedRevenue}
          userRole={role}
        />
        <FinancialClient
          summary={{
            totalRevenue,
            totalProjectExpenses,
            totalLaborCost,
            totalGeneralExpenses,
            grossProfit,
            netProfit,
          }}
          monthlyData={monthlyData}
          projectFinancials={projectFinancials}
        />
      </div>
    </div>
  );
}
