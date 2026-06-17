"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Euro,
  Calendar,
  Briefcase,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  CreditCard,
} from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

type Project = { id: string; name: string; client?: string };

type Payment = {
  id: string;
  amount: number;
  date: string;
  description: string | null;
  method: string;
};

type Assignment = {
  id: string;
  workDescription: string;
  agreedAmount: number;
  startDate: string;
  endDate: string | null;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  notes: string | null;
  project: { id: string; name: string; client?: string };
  payments: Payment[];
};

type Subcontractor = {
  id: string;
  name: string;
  specialty: string | null;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  taxId: string | null;
  notes: string | null;
  assignments: Assignment[];
};

interface Props {
  subcontractor: Subcontractor;
  projects: Project[];
  userRole: string;
}

const ASSIGNMENT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Aktiv",
  COMPLETED: "Përfunduar",
  CANCELLED: "Anuluar",
};

const ASSIGNMENT_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  COMPLETED: "bg-green-500/10 text-green-400 border-green-500/30",
  CANCELLED: "bg-red-500/10 text-red-400 border-red-500/30",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "Pagesë në dorë",
  BANK_TRANSFER: "Transfer bankar",
  CHECK: "Çek",
  OTHER: "Tjetër",
};

export default function SubcontractorDetail({ subcontractor: initial, projects, userRole }: Props) {
  const router = useRouter();
  const [sub, setSub] = useState(initial);
  const canEdit = userRole !== "VIEWER";

  // Caktim i ri
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [workDesc, setWorkDesc] = useState("");
  const [agreedAmount, setAgreedAmount] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [assignNotes, setAssignNotes] = useState("");
  const [savingAssignment, setSavingAssignment] = useState(false);

  // Pagese e re
  const [payingFor, setPayingFor] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payDesc, setPayDesc] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [savingPayment, setSavingPayment] = useState(false);

  async function saveAssignment() {
    if (!projectId || !workDesc || !agreedAmount || !startDate) {
      toast.error("Plotëso projektin, përshkrimin, vlerën dhe datën");
      return;
    }
    setSavingAssignment(true);
    try {
      const res = await fetch("/api/subcontractor-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subcontractorId: sub.id,
          projectId,
          workDescription: workDesc,
          agreedAmount,
          startDate,
          endDate: endDate || null,
          notes: assignNotes,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gabim");
      }
      const created = await res.json();
      setSub((prev) => ({ ...prev, assignments: [created, ...prev.assignments] }));
      toast.success("Caktimi u shtua");
      setShowAssignmentForm(false);
      setProjectId(""); setWorkDesc(""); setAgreedAmount(""); setEndDate(""); setAssignNotes("");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Gabim");
    } finally {
      setSavingAssignment(false);
    }
  }

  async function deleteAssignment(id: string) {
    if (!confirm("Fshi këtë caktim? Të gjitha pagesat dhe shpenzimet e lidhura do fshihen!")) return;
    try {
      const res = await fetch(`/api/subcontractor-assignments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gabim");
      setSub((prev) => ({ ...prev, assignments: prev.assignments.filter((a) => a.id !== id) }));
      toast.success("U fshi");
      router.refresh();
    } catch {
      toast.error("Gabim gjatë fshirjes");
    }
  }

  async function savePayment() {
    if (!payingFor || !payAmount || !payDate) {
      toast.error("Plotëso shumën dhe datën");
      return;
    }
    setSavingPayment(true);
    try {
      const res = await fetch("/api/subcontractor-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: payingFor,
          amount: payAmount,
          date: payDate,
          description: payDesc,
          method: payMethod,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gabim");
      }
      const created = await res.json();
      setSub((prev) => ({
        ...prev,
        assignments: prev.assignments.map((a) =>
          a.id === payingFor ? { ...a, payments: [created, ...a.payments] } : a
        ),
      }));
      toast.success("Pagesa u shtua. U krijua shpenzim në projekt automatikisht.");
      setPayingFor(null);
      setPayAmount(""); setPayDesc(""); setPayMethod("CASH");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Gabim");
    } finally {
      setSavingPayment(false);
    }
  }

  async function deletePayment(paymentId: string, assignmentId: string) {
    if (!confirm("Fshi këtë pagesë? Shpenzimi i lidhur në projekt do fshihet gjithashtu.")) return;
    try {
      const res = await fetch(`/api/subcontractor-payments/${paymentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gabim");
      setSub((prev) => ({
        ...prev,
        assignments: prev.assignments.map((a) =>
          a.id === assignmentId
            ? { ...a, payments: a.payments.filter((p) => p.id !== paymentId) }
            : a
        ),
      }));
      toast.success("U fshi");
      router.refresh();
    } catch {
      toast.error("Gabim gjatë fshirjes");
    }
  }

  async function updateAssignmentStatus(id: string, status: "ACTIVE" | "COMPLETED" | "CANCELLED") {
    try {
      const res = await fetch(`/api/subcontractor-assignments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Gabim");
      const updated = await res.json();
      setSub((prev) => ({
        ...prev,
        assignments: prev.assignments.map((a) => (a.id === id ? { ...a, ...updated } : a)),
      }));
      toast.success("Statusi u përditësua");
    } catch {
      toast.error("Gabim");
    }
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/subcontractors" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" />
        Kthehu te lista
      </Link>

      {/* Header / Info */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Specialiteti</p>
            <p className="text-sm font-medium text-foreground">{sub.specialty || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Personi i kontaktit</p>
            <p className="text-sm font-medium text-foreground">{sub.contactName || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Telefoni</p>
            <p className="text-sm font-medium text-foreground">{sub.phone || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">NIPT</p>
            <p className="text-sm font-medium text-foreground">{sub.taxId || "-"}</p>
          </div>
        </div>
      </div>

      {/* Caktimet ne projekte */}
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-orange-400" />
              Caktimet në Projekte
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Punët që i ke dhënë këtij bashkëpuntori
            </p>
          </div>
          {canEdit && (
            <button onClick={() => setShowAssignmentForm(true)} className="btn-primary">
              <Plus className="w-4 h-4" />
              Cakto në Projekt
            </button>
          )}
        </div>

        {sub.assignments.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-10 text-center">
            <Briefcase className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Asnjë caktim akoma. Cakto punë në një projekt.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sub.assignments.map((a) => {
              const paid = a.payments.reduce((s, p) => s + p.amount, 0);
              const outstanding = a.agreedAmount - paid;
              const percent = a.agreedAmount > 0 ? (paid / a.agreedAmount) * 100 : 0;

              return (
                <div key={a.id} className="bg-card border border-border rounded-xl overflow-hidden">
                  {/* Header */}
                  <div className="p-5 border-b border-border">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="text-base font-bold text-foreground">{a.workDescription}</h3>
                          <span className={cn("badge", ASSIGNMENT_STATUS_COLORS[a.status])}>
                            {ASSIGNMENT_STATUS_LABELS[a.status]}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <Link href={`/projects/${a.project.id}`} className="text-orange-400 hover:underline">
                            {a.project.name}
                          </Link>
                          {a.project.client && <span>· {a.project.client}</span>}
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(a.startDate)}</span>
                          {a.endDate && <span>→ {formatDate(a.endDate)}</span>}
                        </div>
                        {a.notes && <p className="text-xs text-muted-foreground mt-2 italic">{a.notes}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Vlera e dakorduar</p>
                        <p className="text-xl font-bold text-orange-400">{formatCurrency(a.agreedAmount)}</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">Pagesa: <span className="text-green-400 font-semibold">{formatCurrency(paid)}</span></span>
                        <span className="text-muted-foreground">Borxh: <span className={cn("font-semibold", outstanding > 0 ? "text-red-400" : "text-green-400")}>{formatCurrency(outstanding)}</span></span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all", percent >= 100 ? "bg-green-500" : percent >= 50 ? "bg-yellow-500" : "bg-orange-500")}
                          style={{ width: `${Math.min(100, percent)}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 text-right">{percent.toFixed(0)}% paguar</p>
                    </div>

                    {/* Veprimet */}
                    {canEdit && (
                      <div className="flex items-center gap-2 mt-4 flex-wrap">
                        <button onClick={() => { setPayingFor(a.id); setPayAmount(""); }} className="btn-primary text-xs py-1.5">
                          <Euro className="w-3.5 h-3.5" />
                          Shto Pagesë
                        </button>
                        {a.status === "ACTIVE" && (
                          <button onClick={() => updateAssignmentStatus(a.id, "COMPLETED")} className="btn-secondary text-xs py-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Përfundo
                          </button>
                        )}
                        {a.status !== "ACTIVE" && (
                          <button onClick={() => updateAssignmentStatus(a.id, "ACTIVE")} className="btn-secondary text-xs py-1.5">
                            Riaktivizo
                          </button>
                        )}
                        <button onClick={() => deleteAssignment(a.id)} className="btn-ghost text-xs text-red-400 hover:bg-red-400/10">
                          <Trash2 className="w-3.5 h-3.5" />
                          Fshi
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Pagesat */}
                  {a.payments.length > 0 && (
                    <div className="px-5 py-3 bg-secondary/10 border-t border-border">
                      <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5" />
                        Pagesat ({a.payments.length})
                      </p>
                      <div className="space-y-1.5">
                        {a.payments.map((p) => (
                          <div key={p.id} className="flex items-center justify-between bg-background rounded-lg px-3 py-2 text-xs">
                            <div className="flex-1 min-w-0">
                              <p className="text-foreground font-medium">{formatCurrency(p.amount)} · <span className="text-muted-foreground font-normal">{PAYMENT_METHOD_LABELS[p.method] || p.method}</span></p>
                              <p className="text-muted-foreground text-[10px]">{formatDate(p.date)}{p.description ? ` · ${p.description}` : ""}</p>
                            </div>
                            {canEdit && (
                              <button onClick={() => deletePayment(p.id, a.id)} className="p-1 rounded hover:bg-red-400/10 text-muted-foreground hover:text-red-400">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Caktim i ri */}
      {showAssignmentForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg p-5 space-y-4 my-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Caktim i Ri</h3>
              <button onClick={() => setShowAssignmentForm(false)} className="p-1 rounded hover:bg-secondary"><X className="w-4 h-4" /></button>
            </div>

            <div>
              <label className="label-field">Projekti *</label>
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="input-field">
                <option value="">— Zgjedh projektin —</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}{p.client ? ` (${p.client})` : ""}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-field">Përshkrimi i punës *</label>
              <textarea value={workDesc} onChange={(e) => setWorkDesc(e.target.value)} rows={2} className="input-field" placeholder="P.sh. Instalim elektrik për katin 1" />
            </div>

            <div>
              <label className="label-field">Vlera e dakorduar (€) *</label>
              <input type="number" step="0.01" value={agreedAmount} onChange={(e) => setAgreedAmount(e.target.value)} className="input-field" placeholder="0.00" />
              <p className="text-[10px] text-muted-foreground mt-1">Sa do paguash në total për këtë punë</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-field">Data fillimi *</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="label-field">Data përfundimi</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input-field" />
              </div>
            </div>

            <div>
              <label className="label-field">Shënime</label>
              <textarea value={assignNotes} onChange={(e) => setAssignNotes(e.target.value)} rows={2} className="input-field" />
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-300">
                Pas krijimit, kur të shtosh pagesa ndaj këtij bashkëpuntori, ato do regjistrohen automatikisht si shpenzime në projektin e zgjedhur.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => setShowAssignmentForm(false)} className="btn-secondary">Anulo</button>
              <button onClick={saveAssignment} disabled={savingAssignment} className="btn-primary">
                {savingAssignment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Shto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Pagese e re */}
      {payingFor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Shto Pagesë</h3>
              <button onClick={() => setPayingFor(null)} className="p-1 rounded hover:bg-secondary"><X className="w-4 h-4" /></button>
            </div>

            <div>
              <label className="label-field">Shuma (€) *</label>
              <input type="number" step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="input-field" placeholder="0.00" autoFocus />
            </div>

            <div>
              <label className="label-field">Data *</label>
              <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} className="input-field" />
            </div>

            <div>
              <label className="label-field">Mënyra</label>
              <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className="input-field">
                <option value="CASH">Pagesë në dorë</option>
                <option value="BANK_TRANSFER">Transfer bankar</option>
                <option value="CHECK">Çek</option>
                <option value="OTHER">Tjetër</option>
              </select>
            </div>

            <div>
              <label className="label-field">Përshkrim</label>
              <textarea value={payDesc} onChange={(e) => setPayDesc(e.target.value)} rows={2} className="input-field" placeholder="P.sh. Avanc 30%" />
            </div>

            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-orange-300">
                Kjo pagesë do regjistrohet automatikisht si shpenzim në projekt.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => setPayingFor(null)} className="btn-secondary">Anulo</button>
              <button onClick={savePayment} disabled={savingPayment} className="btn-primary">
                {savingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Euro className="w-4 h-4" />}
                Paguaj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
