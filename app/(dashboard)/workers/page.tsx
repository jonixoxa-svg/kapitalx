import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/Header";
import WorkersClient from "@/components/workers/WorkersClient";

export default async function WorkersPage() {
  const session = await auth();
  const role = (session?.user as any)?.role || "VIEWER";

  const workers = await prisma.worker.findMany({
    include: {
      assignments: {
        include: { project: { select: { id: true, name: true, status: true } } },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen">
      <Header title="Punëtorët" subtitle="Menaxho ekipin tuaj" />
      <div className="p-6 animate-fade-in">
        <WorkersClient workers={workers} userRole={role} />
      </div>
    </div>
  );
}
