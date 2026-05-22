import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/Header";
import ProjectsClient from "@/components/projects/ProjectsClient";

async function getProjects() {
  return prisma.project.findMany({
    include: {
      expenses: true,
      workerAssignments: { include: { worker: true } },
      documents: true,
      createdBy: { select: { name: true } },
      _count: { select: { expenses: true, workerAssignments: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function ProjectsPage() {
  const session = await auth();
  const projects = await getProjects();
  const role = (session?.user as any)?.role || "VIEWER";

  return (
    <div className="min-h-screen">
      <Header title="Projektet" subtitle="Menaxho të gjitha projektet" />
      <div className="p-6 animate-fade-in">
        <ProjectsClient projects={projects} userRole={role} />
      </div>
    </div>
  );
}
