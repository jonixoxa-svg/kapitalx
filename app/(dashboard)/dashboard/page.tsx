import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/Header";
import StatsCards from "@/components/dashboard/StatsCards";
import RevenueChart from "@/components/dashboard/RevenueChart";
import ProjectStatusChart from "@/components/dashboard/ProjectStatusChart";
import RecentProjects from "@/components/dashboard/RecentProjects";
import { formatCurrency, getExpenseCategoryLabel } from "@/lib/utils";

async function getDashboardData() {
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
  const grossProfit = totalRevenue - totalProjectExpenses - totalLaborCost;
  const netProfit = grossProfit - totalGeneralExpenses;

  const totalWorkers = workers.length;
  const activeWorkers = workers.filter((w) => w.active).length;

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
  };
}

export default async function DashboardPage() {
  const session = await auth();
  const data = await getDashboardData();

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
