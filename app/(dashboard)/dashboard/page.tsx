import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/Header";
import StatsCards from "@/components/dashboard/StatsCards";
import RevenueChart from "@/components/dashboard/RevenueChart";
import ProjectStatusChart from "@/components/dashboard/ProjectStatusChart";
import RecentProjects from "@/components/dashboard/RecentProjects";
import CashFlowSection from "@/components/dashboard/CashFlowSection";
import MonthlyTargetSection from "@/components/dashboard/MonthlyTargetSection";
import { formatCurrency } from "@/lib/utils";

async function getDashboardData() {
  const [projects, workers, generalExpenses, settings, allPayments] = await Promise.all([
    prisma.project.findMany({
      include: {
        expenses: true,
        workerAssignments: { include: { worker: true } },
        payments: true,
        extraWorks: { where: { status: "APPROVED" } },
      },
    }),
    prisma.worker.findMany(),
    prisma.generalExpense.findMany(),
    prisma.companySettings.findFirst(),
    prisma.projectPayment.findMany(),
  ]);

  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === "ACTIVE").length;
  const completedProjects = projects.filter((p) => p.status === "COMPLETED").length;
  const plannedProjects = projects.filter((p) => p.status === "PLANNED").length;

  // Vlera totale e te ardhurave = kontrate origjinale + punet shtese te aprovuara
  const totalRevenue = projects.reduce((s, p) => {
    const extras = (p as any).extraWorks?.reduce((es: number, e: any) => es + e.amount, 0) || 0;
    return s + p.contractValue + extras;
  }, 0);
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
  const grossProfit = totalRevenue - totalProjectExpenses - totalLaborCost;
  const netProfit = grossProfit - totalGeneralExpenses;

  const totalWorkers = workers.length;
  const activeWorkers = workers.filter((w) => w.active).length;

  // Llogarit borxhet nga klientet per cdo projekt aktiv (perfshire punet shtese)
  const debts = projects
    .filter((p) => p.status !== "COMPLETED")
    .map((p) => {
      const paid = p.payments.reduce((s, pay) => s + pay.amount, 0);
      const extras = (p as any).extraWorks?.reduce((es: number, e: any) => es + e.amount, 0) || 0;
      const effectiveValue = p.contractValue + extras;
      const outstanding = Math.max(0, effectiveValue - paid);
      return {
        projectId: p.id,
        projectName: p.name,
        client: p.client,
        contractValue: effectiveValue,
        paid,
        outstanding,
      };
    })
    .filter((d) => d.outstanding > 0)
    .sort((a, b) => b.outstanding - a.outstanding);

  const totalOutstanding = debts.reduce((s, d) => s + d.outstanding, 0);

  // Fitimi i pritshem ne fund = te ardhura totale - te gjitha shpenzimet e bera ose te ardhshme
  const expectedFinalProfit = totalRevenue - totalProjectExpenses - totalLaborCost - totalGeneralExpenses;

  // Shpenzimi mesatar per muaj (6 muajt e fundit)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const recentExpenses = projects
    .flatMap((p) => p.expenses)
    .filter((e) => new Date(e.date) >= sixMonthsAgo)
    .reduce((s, e) => s + e.amount, 0);
  const recentGeneralExpenses = generalExpenses
    .filter((e) => {
      const d = new Date(e.year, e.month - 1, 1);
      return d >= sixMonthsAgo;
    })
    .reduce((s, e) => s + e.amount, 0);
  const monthlyExpenseAverage = (recentExpenses + recentGeneralExpenses) / 6;

  // Llogarit te ardhura mesatare mujore nga pagesat e 6 muajve te fundit
  const recentPayments = allPayments
    .filter((p) => new Date(p.date) >= sixMonthsAgo)
    .reduce((s, p) => s + p.amount, 0);
  const actualMonthlyRevenue = recentPayments / 6;

  // Shpenzimet faktike mujore (te projekteve + te pergjithshme)
  const actualMonthlyExpenses = (recentExpenses + recentGeneralExpenses) / 6;

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
        return (
          start <= new Date(year, month - 1, 28) &&
          end >= new Date(year, month - 1, 1)
        );
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

  const recentProjects = await prisma.project.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      expenses: true,
      workerAssignments: { include: { worker: true } },
      createdBy: { select: { name: true } },
    },
  });

  return {
    totalProjects,
    activeProjects,
    completedProjects,
    plannedProjects,
    totalRevenue,
    totalProjectExpenses,
    totalLaborCost,
    totalGeneralExpenses,
    grossProfit,
    netProfit,
    totalWorkers,
    activeWorkers,
    monthlyData,
    recentProjects,
    projectStatusData: [
      { name: "Aktive", value: activeProjects, color: "#22c55e" },
      { name: "Kompletuar", value: completedProjects, color: "#3b82f6" },
      { name: "Planifikuar", value: plannedProjects, color: "#eab308" },
      { name: "Pezulluar", value: projects.filter((p) => p.status === "ON_HOLD").length, color: "#ef4444" },
    ],
    debts,
    totalOutstanding,
    cashOnHand: settings?.cashOnHand || 0,
    bankOverdraft: settings?.bankOverdraft || 0,
    expectedFinalProfit,
    monthlyExpenseAverage,
    monthlyExpensesAverage: settings?.monthlyExpensesAverage ?? 17500,
    targetMonthlyProfit: settings?.targetMonthlyProfit ?? 5000,
    actualMonthlyRevenue,
    actualMonthlyExpenses,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  const data = await getDashboardData();
  const role = (session?.user as any)?.role || "VIEWER";
  const canEdit = role === "ADMIN" || role === "MANAGER";

  const stats = [
    {
      title: "Totali Projekteve",
      value: data.totalProjects.toString(),
      subtitle: `${data.activeProjects} aktive • ${data.completedProjects} kompletuar`,
      icon: "projects",
      trend: "+2 këtë muaj",
      trendUp: true,
    },
    {
      title: "Të Ardhura Totale",
      value: formatCurrency(data.totalRevenue),
      subtitle: "Vlera e kontratave",
      icon: "revenue",
      trend: formatCurrency(data.grossProfit) + " fitim bruto",
      trendUp: data.grossProfit > 0,
    },
    {
      title: "Fitimi Neto",
      value: formatCurrency(data.netProfit),
      subtitle: "Pas të gjitha shpenzimeve",
      icon: "profit",
      trend: data.netProfit > 0 ? "Pozitiv" : "Negativ",
      trendUp: data.netProfit > 0,
    },
    {
      title: "Punëtorët Aktivë",
      value: data.activeWorkers.toString(),
      subtitle: `${data.totalWorkers} total punëtorë`,
      icon: "workers",
      trend: "Kosto: " + formatCurrency(data.totalLaborCost),
      trendUp: true,
    },
  ];

  return (
    <div className="min-h-screen">
      <Header
        title="Dashboard"
        subtitle={`Mirë se erdhët, ${session?.user?.name?.split(" ")[0] || ""}!`}
      />

      <div className="p-6 space-y-6 animate-fade-in">
        {/* Stats */}
        <StatsCards stats={stats} />

        {/* Objektivi Mujor */}
        <MonthlyTargetSection
          monthlyExpensesAverage={data.monthlyExpensesAverage}
          targetMonthlyProfit={data.targetMonthlyProfit}
          actualMonthlyRevenue={data.actualMonthlyRevenue}
          actualMonthlyExpenses={data.actualMonthlyExpenses}
          canEdit={canEdit}
        />

        {/* Cash Flow + Borxhet */}
        <CashFlowSection
          debts={data.debts}
          totalOutstanding={data.totalOutstanding}
          cashOnHand={data.cashOnHand}
          bankOverdraft={data.bankOverdraft}
          expectedFinalProfit={data.expectedFinalProfit}
          currentNetProfit={data.netProfit}
          monthlyExpenseAverage={data.monthlyExpenseAverage}
          canEdit={canEdit}
        />

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <RevenueChart data={data.monthlyData} />
          </div>
          <div>
            <ProjectStatusChart data={data.projectStatusData} />
          </div>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card">
            <p className="text-xs text-muted-foreground mb-1">Shpenzime Projekti</p>
            <p className="text-lg font-bold text-foreground">{formatCurrency(data.totalProjectExpenses)}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs text-muted-foreground mb-1">Kosto Punëtorësh</p>
            <p className="text-lg font-bold text-foreground">{formatCurrency(data.totalLaborCost)}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs text-muted-foreground mb-1">Shpenzime Kompanie</p>
            <p className="text-lg font-bold text-foreground">{formatCurrency(data.totalGeneralExpenses)}</p>
          </div>
          <div className="stat-card border-orange-500/30">
            <p className="text-xs text-muted-foreground mb-1">Fitimi Bruto</p>
            <p className={`text-lg font-bold ${data.grossProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
              {formatCurrency(data.grossProfit)}
            </p>
          </div>
        </div>

        {/* Recent Projects */}
        <RecentProjects projects={data.recentProjects} />
      </div>
    </div>
  );
}
