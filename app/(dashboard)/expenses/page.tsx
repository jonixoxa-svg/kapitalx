import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/Header";
import ExpensesClient from "@/components/financial/ExpensesClient";

export default async function ExpensesPage() {
  const session = await auth();
  const role = (session?.user as any)?.role || "VIEWER";

  const [generalExpenses, projects] = await Promise.all([
    prisma.generalExpense.findMany({
      include: { project: { select: { id: true, name: true } } },
      orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
    }),
    prisma.project.findMany({
      select: { id: true, name: true, client: true, status: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="min-h-screen">
      <Header
        title="Shpenzimet e Përgjithshme"
        subtitle="Shpenzime që mund të lidhen me projekte"
      />
      <div className="p-6 animate-fade-in">
        <ExpensesClient expenses={generalExpenses as any} projects={projects as any} userRole={role} />
      </div>
    </div>
  );
}
