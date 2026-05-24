import Header from "@/components/layout/Header";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProjectCalendar from "@/components/calendar/ProjectCalendar";

export default async function CalendarPage() {
  const session = await auth();
  const role = (session?.user as any)?.role || "VIEWER";

  const [projects, productions, workers] = await Promise.all([
    prisma.project.findMany({
      include: {
        milestones: { orderBy: { order: "asc" } },
        workerAssignments: { include: { worker: true } },
      },
      orderBy: { startDate: "asc" },
    }),
    prisma.production.findMany({
      include: { workers: { include: { worker: true } } },
      orderBy: { startDate: "asc" },
    }),
    prisma.worker.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="min-h-screen">
      <Header title="Kalendari" subtitle="Pamje vizuale e projekteve, fazave dhe prodhimit" />
      <div className="p-6 animate-fade-in">
        <ProjectCalendar
          projects={projects as any}
          productions={productions as any}
          workers={workers as any}
          userRole={role}
        />
      </div>
    </div>
  );
}
