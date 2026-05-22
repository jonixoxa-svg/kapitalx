import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/Header";
import EquipmentClient from "@/components/equipment/EquipmentClient";

export default async function EquipmentPage() {
  const session = await auth();
  const role = (session?.user as any)?.role || "VIEWER";

  const [equipment, projects] = await Promise.all([
    prisma.equipment.findMany({
      include: {
        assignments: {
          include: { project: { select: { id: true, name: true, status: true } } },
          orderBy: { startDate: "desc" },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.project.findMany({
      where: { status: { in: ["ACTIVE", "PLANNED"] } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, status: true },
    }),
  ]);

  return (
    <div className="min-h-screen">
      <Header
        title="Pajisjet"
        subtitle="Menaxho kamionët, vinçat dhe pajisjet e tjera"
      />
      <div className="p-6 animate-fade-in">
        <EquipmentClient equipment={equipment as any} projects={projects} userRole={role} />
      </div>
    </div>
  );
}
