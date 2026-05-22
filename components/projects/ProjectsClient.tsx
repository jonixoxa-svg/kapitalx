"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Filter,
  MapPin,
  Calendar,
  Users,
  Trash2,
  Edit,
  Eye,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { formatCurrency, formatDate, getStatusColor, getStatusLabel, cn } from "@/lib/utils";
import { Project, Expense, WorkerAssignment, Worker, Document } from "@prisma/client";

type ProjectWithRelations = Project & {
  expenses: Expense[];
  workerAssignments: (WorkerAssignment & { worker: Worker })[];
  documents: Document[];
  createdBy: { name: string };
  _count: { expenses: number; workerAssignments: number };
};

const STATUS_OPTIONS = ["ALL", "ACTIVE", "PLANNED", "COMPLETED", "ON_HOLD"];

export default function ProjectsClient({
  projects: initialProjects,
  userRole,
}: {
  projects: ProjectWithRelations[];
  userRole: string;
}) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = projects.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.client.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Jeni i sigurt që doni të fshini projektin "${name}"?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setProjects((prev) => prev.filter((p) => p.id !== id));
      toast.success("Projekti u fshi me sukses");
    } catch {
      toast.error("Gabim gjatë fshirjes");
    } finally {
      setDeletingId(null);
    }
  }

  const stats = {
    total: projects.length,
    active: projects.filter((p) => p.status === "ACTIVE").length,
    completed: projects.filter((p) => p.status === "COMPLETED").length,
    planned: projects.filter((p) => p.status === "PLANNED").length,
  };

  return (
    <div className="space-y-5">
      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-foreground" },
          { label: "Aktive", value: stats.active, color: "text-green-400" },
          { label: "Kompletuar", value: stats.completed, color: "text-blue-400" },
          { label: "Planifikuar", value: stats.planned, color: "text-yellow-400" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl px-4 py-3">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Kërko projekte..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium rounded-md transition-colors",
                  statusFilter === s
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {s === "ALL" ? "Të gjitha" :
                 s === "ACTIVE" ? "Aktive" :
                 s === "COMPLETED" ? "Kompletuar" :
                 s === "PLANNED" ? "Planifikuar" : "Pezulluar"}
              </button>
            ))}
          </div>

          {userRole !== "VIEWER" && (
            <Link
              href="/projects/new"
              className="btn-primary whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Projekt i Ri
            </Link>
          )}
        </div>
      </div>

      {/* Projects Grid */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center mx-auto mb-3">
            <Filter className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-foreground font-medium">Asnjë projekt i gjetur</p>
          <p className="text-muted-foreground text-sm mt-1">Ndryshoni filtrat ose krijoni projekt të ri</p>
          {userRole !== "VIEWER" && (
            <Link href="/projects/new" className="btn-primary mt-4 inline-flex">
              <Plus className="w-4 h-4" /> Projekt i Ri
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((project) => {
            const totalExpenses = project.expenses.reduce((s, e) => s + e.amount, 0);
            const totalLabor = project.workerAssignments.reduce(
              (s, a) => s + a.daysWorked * a.worker.dailyRate,
              0
            );
            const totalCost = totalExpenses + totalLabor;
            const profit = project.contractValue - totalCost;
            const profitPercent =
              project.contractValue > 0 ? (profit / project.contractValue) * 100 : 0;

            return (
              <div
                key={project.id}
                className="bg-card border border-border rounded-xl overflow-hidden hover:border-border/60 transition-all duration-200 group hover:shadow-lg hover:shadow-black/20"
              >
                {/* Header */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground text-sm truncate">{project.name}</h3>
                        <span className={`badge ${getStatusColor(project.status)}`}>
                          {getStatusLabel(project.status)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{project.client}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {project.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(project.startDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {project._count.workerAssignments}
                    </span>
                  </div>
                </div>

                {/* Progress */}
                <div className="px-4 pt-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-muted-foreground">Progres</span>
                    <span className="text-xs font-semibold text-foreground">{project.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full transition-all duration-500"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                {/* Financials */}
                <div className="p-4 grid grid-cols-3 gap-2 mt-1">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Kontrata</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5">
                      {formatCurrency(project.contractValue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Shpenzime</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5">
                      {formatCurrency(totalCost)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Fitimi</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {profit >= 0 ? (
                        <TrendingUp className="w-3 h-3 text-green-400" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-red-400" />
                      )}
                      <p className={`text-sm font-semibold ${profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {formatCurrency(profit)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-4 pb-4 flex items-center gap-2">
                  <Link
                    href={`/projects/${project.id}`}
                    className="flex-1 btn-secondary justify-center py-1.5 text-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Shiko
                  </Link>
                  {userRole !== "VIEWER" && (
                    <>
                      <Link
                        href={`/projects/${project.id}?edit=true`}
                        className="btn-ghost py-1.5 text-xs px-2"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Link>
                      {userRole === "ADMIN" && (
                        <button
                          onClick={() => handleDelete(project.id, project.name)}
                          disabled={deletingId === project.id}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
