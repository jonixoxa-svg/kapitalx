import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/Header";
import ProductionClient from "@/components/production/ProductionClient";

export default async function ProductionPage() {
  const session = await auth();
  const role = (session?.user as any)?.role || "VIEWER";

  const [items, workers] = await Promise.all([
    prisma.production.findMany({
      include: { workers: { include: { worker: true } } },
      orderBy: { startDate: "desc" },
    }),
    prisma.worker.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="min-h-screen">
      <Header title="Prodhimi" subtitle="Artikujt e prodhuar ne punetori" />
      <div className="p-6 animate-fade-in">
        <ProductionClient initialItems={items as any} workers={workers as any} userRole={role} />
      </div>
    </div>
  );
}
