import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/Header";
import ProjectDetail from "@/components/projects/ProjectDetail";

async function getProject(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      expenses: { orderBy: { date: "desc" } },
      workerAssignments: {
        include: { worker: true },
        orderBy: { createdAt: "desc" },
      },
      documents: { orderBy: { createdAt: "desc" } },
      payments: { orderBy: { date: "desc" } },
      equipmentAssignments: {
        include: { equipment: true },
        orderBy: { startDate: "desc" },
      },
      milestones: {
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      },
      activityLogs: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      createdBy: { select: { name: true, email: true } },
    },
  });
}

async function getWorkers() {
  return prisma.worker.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const [project, workers] = await Promise.all([
    getProject(id),
    getWorkers(),
  ]);

  if (!project) notFound();

  const role = (session?.user as any)?.role || "VIEWER";

  return (
    <div className="min-h-screen">
      <Header title={project.name} subtitle={project.client} />
      <div className="p-6 animate-fade-in">
        <ProjectDetail project={project} workers={workers} userRole={role} />
      </div>
    </div>
  );
}
