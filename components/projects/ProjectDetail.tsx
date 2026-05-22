"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft, Plus, Trash2, Edit, Save, X, Upload,
  MapPin, Calendar, User, FileText, Activity, DollarSign,
  Users, TrendingUp, TrendingDown, CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate, getStatusColor, getStatusLabel, getExpenseCategoryLabel, cn } from "@/lib/utils";
import ProjectForm from "./ProjectForm";
import ExpenseForm from "./ExpenseForm";
import WorkerAssignmentForm from "./WorkerAssignmentForm";
import DocumentUpload from "./DocumentUpload";
import PaymentsSection from "./PaymentsSection";
import MilestonesSection from "./MilestonesSection";

const TABS = ["overview", "milestones", "payments", "expenses", "workers", "documents", "activity"] as const;
type Tab = typeof TABS[number];

const TAB_LABELS: Record<Tab, string> = {
  overview: "Përmbledhje",
  milestones: "Fazat",
  payments: "Pagesat",
  expenses: "Shpenzime",
  workers: "Punëtorët",
  documents: "Dokumentet",
  activity: "Aktiviteti",
};

export default function ProjectDetail({ project: initialProject, workers, userRole }: any) {
  const router = useRouter();
  const [project, setProject] = useState(initialProject);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [editMode, setEditMode] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showWorkerForm, setShowWorkerForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);

  const totalExpenses = project.expenses.reduce((s: number, e: any) => s + e.amount, 0);
  const totalLabor = project.workerAssignments.reduce(
    (s: number, a: any) => s + a.daysWorked * a.worker.dailyRate,
    0
  );
  const totalCost = totalExpenses + totalLabor;
  const grossProfit = project.contractValue - totalCost;

  async function handleDeleteExpense(id: string) {
    if (!confirm("Fshi këtë shpenzim?")) return;
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    if (res.ok) {
      setProject((p: any) => ({ ...p, expenses: p.expenses.filter((e: any) => e.id !== id) }));
      toast.success("Shpenzimi u fshi");
    } else {
      toast.error("Gabim gjatë fshirjes");
    }
  }

  async function handleDeleteAssignment(id: string) {
    if (!confirm("Hiq punëtorin nga projekti?")) return;
    const res = await fetch(`/api/worker-assignments/${id}`, { method: "DELETE" });
    if (res.ok) {
      setProject((p: any) => ({
        ...p,
        workerAssignments: p.workerAssignments.filter((a: any) => a.id !== id),
      }));
      toast.success("Punëtori u hoq");
    } else {
      toast.error("Gabim gjatë heqjes");
    }
  }

  async function handleProgressUpdate(progress: number) {
    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ progress }),
    });
    if (res.ok) {
      setProject((p: any) => ({ ...p, progress }));
      toast.success("Progresi u përditësua");
    }
  }

  function refreshProject() {
    router.refresh();
    setEditMode(false);
  }

  if (editMode) {
    return (
      <div className="max-w-3xl">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => setEditMode(false)} className="btn-ghost">
            <X className="w-4 h-4" /> Anulo
          </button>
          <h2 className="text-sm font-semibold text-foreground">Edito Projektin</h2>
        </div>
        <ProjectForm project={project} onSuccess={refreshProject} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <Link href="/projects" className="btn-ghost text-xs">
          <ArrowLeft className="w-3.5 h-3.5" />
          Projektet
        </Link>
        <div className="flex items-center gap-2">
          {userRole !== "VIEWER" && (
            <button onClick={() => setEditMode(true)} className="btn-secondary text-xs">
              <Edit className="w-3.5 h-3.5" />
              Edito
            </button>
          )}
        </div>
      </div>

      {/* Project Header */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-foreground">{project.name}</h2>
              <span className={`badge ${getStatusColor(project.status)}`}>
                {getStatusLabel(project.status)}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                {project.client}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {project.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(project.startDate)}
                {project.endDate && ` → ${formatDate(project.endDate)}`}
              </span>
            </div>
            {project.description && (
              <p className="text-sm text-muted-foreground mt-2">{project.description}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Vlera Kontratës</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(project.contractValue)}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Progresi i Projektit</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">{project.progress}%</span>
              {userRole !== "VIEWER" && (
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={project.progress}
                  onChange={(e) => handleProgressUpdate(parseInt(e.target.value))}
                  className="w-24 accent-orange-500"
                />
              )}
            </div>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full transition-all duration-500"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Shpenzime Materiale", value: totalExpenses, color: "text-foreground" },
          { label: "Kosto Punëtorësh", value: totalLabor, color: "text-foreground" },
          { label: "Kosto Totale", value: totalCost, color: "text-foreground" },
          {
            label: "Fitimi Bruto",
            value: grossProfit,
            color: grossProfit >= 0 ? "text-green-400" : "text-red-400",
          },
        ].map((item) => (
          <div key={item.label} className="stat-card">
            <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
            <p className={`text-lg font-bold ${item.color}`}>{formatCurrency(item.value)}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab
                  ? "border-orange-500 text-orange-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {TAB_LABELS[tab]}
              {tab === "expenses" && (
                <span className="ml-1.5 text-xs bg-secondary rounded-full px-1.5 py-0.5">
                  {project.expenses.length}
                </span>
              )}
              {tab === "workers" && (
                <span className="ml-1.5 text-xs bg-secondary rounded-full px-1.5 py-0.5">
                  {project.workerAssignments.length}
                </span>
              )}
              {tab === "milestones" && (project.milestones?.length ?? 0) > 0 && (
                <span className="ml-1.5 text-xs bg-secondary rounded-full px-1.5 py-0.5">
                  {project.milestones.filter((m: any) => m.completed).length}/{project.milestones.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {/* Overview */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Shpenzime sipas Kategorisë</h3>
              {Object.entries(
                project.expenses.reduce((acc: any, e: any) => {
                  acc[e.category] = (acc[e.category] || 0) + e.amount;
                  return acc;
                }, {})
              ).map(([cat, amount]: any) => (
                <div key={cat} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <span className="text-sm text-muted-foreground">{getExpenseCategoryLabel(cat)}</span>
                  <span className="text-sm font-semibold text-foreground">{formatCurrency(amount)}</span>
                </div>
              ))}
              {project.expenses.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Asnjë shpenzim akoma</p>
              )}
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Punëtorët</h3>
              {project.workerAssignments.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{a.worker.name}</p>
                    <p className="text-xs text-muted-foreground">{a.worker.position}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">
                      {formatCurrency(a.daysWorked * a.worker.dailyRate)}
                    </p>
                    <p className="text-xs text-muted-foreground">{a.daysWorked} ditë</p>
                  </div>
                </div>
              ))}
              {project.workerAssignments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Asnjë punëtor i caktuar</p>
              )}
            </div>
          </div>
        )}

        {/* Expenses */}
        {activeTab === "expenses" && (
          <div className="space-y-4">
            {userRole !== "VIEWER" && (
              <button
                onClick={() => setShowExpenseForm(!showExpenseForm)}
                className="btn-primary"
              >
                <Plus className="w-4 h-4" />
                Shto Shpenzim
              </button>
            )}

            {showExpenseForm && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Shpenzim i Ri</h3>
                <ExpenseForm
                  projectId={project.id}
                  expense={editingExpense}
                  onSuccess={(expense) => {
                    if (editingExpense) {
                      setProject((p: any) => ({
                        ...p,
                        expenses: p.expenses.map((e: any) => e.id === expense.id ? expense : e),
                      }));
                    } else {
                      setProject((p: any) => ({ ...p, expenses: [expense, ...p.expenses] }));
                    }
                    setShowExpenseForm(false);
                    setEditingExpense(null);
                  }}
                  onCancel={() => { setShowExpenseForm(false); setEditingExpense(null); }}
                />
              </div>
            )}

            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="table-header px-4 py-3 text-left">Kategoria</th>
                    <th className="table-header px-4 py-3 text-left">Përshkrimi</th>
                    <th className="table-header px-4 py-3 text-left">Data</th>
                    <th className="table-header px-4 py-3 text-right">Shuma</th>
                    {userRole !== "VIEWER" && <th className="px-4 py-3" />}
                  </tr>
                </thead>
                <tbody>
                  {project.expenses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">
                        Asnjë shpenzim akoma. Shtoni shpenzimin e parë.
                      </td>
                    </tr>
                  ) : (
                    project.expenses.map((expense: any) => (
                      <tr key={expense.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                        <td className="px-4 py-3">
                          <span className="text-xs bg-secondary text-muted-foreground rounded-md px-2 py-1">
                            {getExpenseCategoryLabel(expense.category)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">{expense.description}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(expense.date)}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-foreground text-right">
                          {formatCurrency(expense.amount)}
                        </td>
                        {userRole !== "VIEWER" && (
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 justify-end">
                              <button
                                onClick={() => {
                                  setEditingExpense(expense);
                                  setShowExpenseForm(true);
                                }}
                                className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(expense.id)}
                                className="p-1.5 rounded-md hover:bg-red-400/10 text-muted-foreground hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
                {project.expenses.length > 0 && (
                  <tfoot>
                    <tr className="bg-secondary/30">
                      <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-foreground">Total</td>
                      <td className="px-4 py-3 text-sm font-bold text-orange-400 text-right">
                        {formatCurrency(totalExpenses)}
                      </td>
                      {userRole !== "VIEWER" && <td />}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {/* Workers */}
        {activeTab === "workers" && (
          <div className="space-y-4">
            {userRole !== "VIEWER" && (
              <button
                onClick={() => setShowWorkerForm(!showWorkerForm)}
                className="btn-primary"
              >
                <Plus className="w-4 h-4" />
                Cakto Punëtor
              </button>
            )}

            {showWorkerForm && (
              <div className="bg-card border border-border rounded-xl p-5">
                <WorkerAssignmentForm
                  projectId={project.id}
                  workers={workers}
                  existingAssignments={project.workerAssignments}
                  onSuccess={(assignment) => {
                    setProject((p: any) => {
                      const exists = p.workerAssignments.find((a: any) => a.workerId === assignment.workerId);
                      if (exists) {
                        return {
                          ...p,
                          workerAssignments: p.workerAssignments.map((a: any) =>
                            a.workerId === assignment.workerId ? assignment : a
                          ),
                        };
                      }
                      return { ...p, workerAssignments: [assignment, ...p.workerAssignments] };
                    });
                    setShowWorkerForm(false);
                  }}
                  onCancel={() => setShowWorkerForm(false)}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {project.workerAssignments.length === 0 ? (
                <div className="col-span-full bg-card border border-border rounded-xl p-8 text-center">
                  <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">Asnjë punëtor i caktuar akoma</p>
                </div>
              ) : (
                project.workerAssignments.map((a: any) => (
                  <div key={a.id} className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="w-8 h-8 bg-orange-500/10 rounded-full flex items-center justify-center mb-2">
                          <span className="text-sm font-bold text-orange-400">
                            {a.worker.name.charAt(0)}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-foreground">{a.worker.name}</p>
                        <p className="text-xs text-muted-foreground">{a.worker.position}</p>
                      </div>
                      {userRole !== "VIEWER" && (
                        <button
                          onClick={() => handleDeleteAssignment(a.id)}
                          className="p-1.5 rounded-md hover:bg-red-400/10 text-muted-foreground hover:text-red-400 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Ditë punuar</p>
                        <p className="text-sm font-semibold text-foreground">{a.daysWorked}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Norma/ditë</p>
                        <p className="text-sm font-semibold text-foreground">{formatCurrency(a.worker.dailyRate)}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[10px] text-muted-foreground uppercase">Total pagesa</p>
                        <p className="text-base font-bold text-orange-400">
                          {formatCurrency(a.daysWorked * a.worker.dailyRate)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {project.workerAssignments.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">Kosto Totale e Punëtorëve</span>
                  <span className="text-lg font-bold text-orange-400">{formatCurrency(totalLabor)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Milestones / Fazat */}
        {activeTab === "milestones" && (
          <MilestonesSection
            projectId={project.id}
            milestones={project.milestones || []}
            userRole={userRole}
          />
        )}

        {/* Payments */}
        {activeTab === "payments" && (
          <PaymentsSection
            projectId={project.id}
            payments={project.payments || []}
            contractValue={project.contractValue}
            userRole={userRole}
          />
        )}

        {/* Documents */}
        {activeTab === "documents" && (
          <div className="space-y-4">
            {userRole !== "VIEWER" && (
              <DocumentUpload
                projectId={project.id}
                onSuccess={(doc) =>
                  setProject((p: any) => ({ ...p, documents: [doc, ...p.documents] }))
                }
              />
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {project.documents.length === 0 ? (
                <div className="col-span-full bg-card border border-border rounded-xl p-8 text-center">
                  <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">Asnjë dokument i ngarkuar</p>
                </div>
              ) : (
                project.documents.map((doc: any) => (
                  <a
                    key={doc.id}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-card border border-border rounded-xl p-4 hover:border-orange-500/30 transition-colors flex items-center gap-3"
                  >
                    <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(doc.size / 1024).toFixed(0)} KB • {formatDate(doc.createdAt)}
                      </p>
                    </div>
                  </a>
                ))
              )}
            </div>
          </div>
        )}

        {/* Activity */}
        {activeTab === "activity" && (
          <div className="space-y-2">
            {project.activityLogs.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-8 text-center">
                <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">Asnjë aktivitet akoma</p>
              </div>
            ) : (
              project.activityLogs.map((log: any) => (
                <div key={log.id} className="flex items-start gap-3 bg-card border border-border rounded-xl px-4 py-3">
                  <div className="w-7 h-7 bg-orange-500/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{log.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{log.user?.name}</span>
                      <span className="text-xs text-muted-foreground/50">•</span>
                      <span className="text-xs text-muted-foreground">{formatDate(log.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
