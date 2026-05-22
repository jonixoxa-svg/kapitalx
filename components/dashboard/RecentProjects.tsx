import Link from "next/link";
import { ArrowRight, MapPin, Calendar } from "lucide-react";
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";
import { Project, Expense, WorkerAssignment, Worker } from "@prisma/client";

type ProjectWithRelations = Project & {
  expenses: Expense[];
  workerAssignments: (WorkerAssignment & { worker: Worker })[];
  createdBy: { name: string };
};

export default function RecentProjects({ projects }: { projects: ProjectWithRelations[] }) {
  return (
    <div className="bg-card border border-border rounded-xl">
      <div className="flex items-center justify-between p-5 border-b border-border">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Projektet e Fundit</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Gjendja aktuale e projekteve</p>
        </div>
        <Link
          href="/projects"
          className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 font-medium transition-colors"
        >
          Shiko të gjitha <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="divide-y divide-border">
        {projects.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Asnjë projekt akoma
          </div>
        ) : (
          projects.map((project) => {
            const totalExpenses = project.expenses.reduce((s, e) => s + e.amount, 0);
            const totalLabor = project.workerAssignments.reduce(
              (s, a) => s + a.daysWorked * a.worker.dailyRate,
              0
            );
            const totalCost = totalExpenses + totalLabor;
            const profit = project.contractValue - totalCost;

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  {/* Status indicator */}
                  <div className={`w-1.5 h-full min-h-[40px] rounded-full flex-shrink-0 ${
                    project.status === "ACTIVE" ? "bg-green-400" :
                    project.status === "COMPLETED" ? "bg-blue-400" :
                    project.status === "PLANNED" ? "bg-yellow-400" : "bg-red-400"
                  }`} />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{project.name}</p>
                      <span className={`badge text-[10px] ${getStatusColor(project.status)}`}>
                        {getStatusLabel(project.status)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{project.client}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
                        <MapPin className="w-3 h-3" />
                        {project.location}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
                        <Calendar className="w-3 h-3" />
                        {formatDate(project.startDate)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 flex-shrink-0 ml-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-muted-foreground">Kontrata</p>
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(project.contractValue)}</p>
                  </div>
                  <div className="text-right hidden md:block">
                    <p className="text-xs text-muted-foreground">Fitimi</p>
                    <p className={`text-sm font-semibold ${profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {formatCurrency(profit)}
                    </p>
                  </div>
                  {/* Progress */}
                  <div className="hidden lg:block w-20">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-muted-foreground">Progres</span>
                      <span className="text-[10px] text-foreground font-medium">{project.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full transition-all"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
