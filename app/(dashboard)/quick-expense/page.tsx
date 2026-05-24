import Header from "@/components/layout/Header";
import { prisma } from "@/lib/prisma";
import QuickExpense from "@/components/quick/QuickExpense";

export default async function QuickExpensePage() {
  const projects = await prisma.project.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen">
      <Header title="Hyrje e shpejtë" subtitle="Shtim i shpejtë i shpenzimeve nga Valdet ose Tahir" />
      <div className="p-6 animate-fade-in">
        <QuickExpense projects={projects} />
      </div>
    </div>
  );
}
