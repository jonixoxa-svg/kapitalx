import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/Header";
import AttendanceClient from "@/components/attendance/AttendanceClient";

export default async function AttendancePage() {
  const session = await auth();
  const role = (session?.user as any)?.role || "VIEWER";

  const [workers, projects] = await Promise.all([
    prisma.worker.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, position: true, dailyRate: true, active: true },
    }),
    prisma.project.findMany({
      where: { status: { in: ["ACTIVE", "PLANNED"] } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="min-h-screen">
      <Header
        title="Evidenca e Punëtorëve"
        subtitle="Cakto statusin për çdo punëtor, për çdo ditë"
      />
      <div className="p-6 animate-fade-in">
        <AttendanceClient workers={workers} projects={projects} userRole={role} />
      </div>
    </div>
  );
}
