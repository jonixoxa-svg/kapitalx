import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/Header";
import StockClient from "@/components/stock/StockClient";

export default async function StockPage() {
  const session = await auth();
  const role = (session?.user as any)?.role || "VIEWER";

  const items = await prisma.stockItem.findMany({
    include: {
      movements: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          project: { select: { id: true, name: true } },
          production: { select: { id: true, itemName: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen">
      <Header title="Stoku i Depozites" subtitle="Materialet ne dispozicion" />
      <div className="p-6 animate-fade-in">
        <StockClient initialItems={items as any} userRole={role} />
      </div>
    </div>
  );
}
