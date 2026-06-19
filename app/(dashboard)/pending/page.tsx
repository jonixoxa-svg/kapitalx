import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/Header";
import PendingExpensesClient from "@/components/pending/PendingExpensesClient";

async function getData() {
  const [items, projects] = await Promise.all([
    prisma.pendingExpense.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.project.findMany({
      select: { id: true, name: true, client: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return { items, projects };
}

export default async function PendingExpensesPage() {
  const session = await auth();
  const role = (session?.user as any)?.role || "VIEWER";
  const { items, projects } = await getData();

  return (
    <div className="min-h-screen">
      <Header
        title="Të Dyshimtat"
        subtitle="Shpenzime dhe pagesa që duhen rishikuar - vendos ku t'i çojmë"
      />
      <div className="p-6 animate-fade-in">
        <PendingExpensesClient
          items={items as any}
          projects={projects as any}
          userRole={role}
        />
      </div>
    </div>
  );
}
