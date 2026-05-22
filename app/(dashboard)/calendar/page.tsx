import Header from "@/components/layout/Header";
import { prisma } from "@/lib/prisma";
import CalendarClient from "@/components/dashboard/CalendarClient";

export default async function CalendarPage() {
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      name: true,
      client: true,
      status: true,
      startDate: true,
      endDate: true,
      progress: true,
    },
    orderBy: { startDate: "asc" },
  });

  return (
    <div className="min-h-screen">
      <Header title="Kalendari" subtitle="Pamje kalendarike e projekteve" />
      <div className="p-6 animate-fade-in">
        <CalendarClient projects={projects} />
      </div>
    </div>
  );
}
