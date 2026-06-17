import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/Header";
import SubcontractorsClient from "@/components/subcontractors/SubcontractorsClient";

async function getData() {
  const [subcontractors, projects] = await Promise.all([
    prisma.subcontractor.findMany({
      include: {
        assignments: {
          include: {
            project: { select: { id: true, name: true } },
            payments: true,
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.project.findMany({
      select: { id: true, name: true, client: true },
      where: { status: { in: ["ACTIVE", "PLANNED"] } },
      orderBy: { name: "asc" },
    }),
  ]);

  return { subcontractors, projects };
}

export default async function SubcontractorsPage() {
  const session = await auth();
  const role = (session?.user as any)?.role || "VIEWER";
  const { subcontractors, projects } = await getData();

  return (
    <div className="min-h-screen">
      <Header
        title="Bashkëpunëtorët"
        subtitle="Menaxho nënkontraktorët dhe pagesat ndaj tyre"
      />
      <div className="p-6 animate-fade-in">
        <SubcontractorsClient
          subcontractors={subcontractors as any}
          projects={projects as any}
          userRole={role}
        />
      </div>
    </div>
  );
}
