import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/Header";
import ExpensesClient from "@/components/financial/ExpensesClient";

export default async function ExpensesPage() {
  const session = await auth();
  const role = (session?.user as any)?.role || "VIEWER";

  const generalExpenses = await prisma.generalExpense.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="min-h-screen">
      <Header
        title="Shpenzimet e Përgjithshme"
        subtitle="Shpenzime që ndikojnë në të gjitha projektet"
      />
      <div className="p-6 animate-fade-in">
        <ExpensesClient expenses={generalExpenses} userRole={role} />
      </div>
    </div>
  );
}
