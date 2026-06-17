import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/Header";
import SubcontractorDetail from "@/components/subcontractors/SubcontractorDetail";

async function getData(id: string) {
  const [subcontractor, projects] = await Promise.all([
    prisma.subcontractor.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            project: { select: { id: true, name: true, client: true } },
            payments: { orderBy: { date: "desc" } },
          },
          orderBy: { startDate: "desc" },
        },
      },
    }),
    prisma.project.findMany({
      select: { id: true, name: true, client: true },
      where: { status: { in: ["ACTIVE", "PLANNED"] } },
      orderBy: { name: "asc" },
    }),
  ]);

  return { subcontractor, projects };
}

export default async function SubcontractorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as any)?.role || "VIEWER";
  const { id } = await params;
  const { subcontractor, projects } = await getData(id);

  if (!subcontractor) notFound();

  return (
    <div className="min-h-screen">
      <Header title={subcontractor.name} subtitle={subcontractor.specialty || "Bashkëpuntor"} />
      <div className="p-6 animate-fade-in">
        <SubcontractorDetail
          subcontractor={subcontractor as any}
          projects={projects as any}
          userRole={role}
        />
      </div>
    </div>
  );
}
