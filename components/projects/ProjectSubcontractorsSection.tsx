"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Plus,
  Handshake,
  Briefcase,
  Euro,
  Trash2,
  X,
  Loader2,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

interface Assignment {
  id: string;
  workDescription: string;
  agreedAmount: number;
  startDate: string;
  endDate: string | null;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  notes: string | null;
  subcontractor: { id: string; name: string; specialty: string | null };
  payments: { id: string; amount: number; date: string; method: string; description: string | null }[];
}

interface Sub {
  id: string;
  name: string;
  specialty: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Aktiv",
  COMPLETED: "Përfunduar",
  CANCELLED: "Anuluar",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  COMPLETED: "bg-green-500/10 text-green-400 border-green-500/30",
  CANCELLED: "bg-red-500/10 text-red-400 border-red-500/30",
};

export default function ProjectSubcontractorsSection({ projectId, userRole }: { projectId: string; userRole: string }) {
  const router = useRouter();
  const canEdit = userRole !== "VIEWER";
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);

  // Form per caktim te ri
  const [showForm, setShowForm] = useState(false);
  const [subId, setSubId] = useState("");
  const [workDesc, setWorkDesc] = useState("");
  const [agreedAmount, setAgreedAmount] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Pagesa
  const [payingFor, setPayingFor] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payDesc, setPayDesc] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [savingPay, setSavingPay] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/subcontractor-assignments?projectId=${projectId}`).then((r) => r.json()),
      fetch("/api/subcontractors").then((r) => r.json()),
    ])
      .then(([assigns, subList]) => {
        setAssignments(assigns || []);
        setSubs(subList || []);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  async function saveAssignment() {
    if (!subId || !workDesc || !agreedAmount || !startDate) {
      toast.error("Plotëso bashkëpuntorin, përshkrimin, vlerën dhe datën");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/subcontractor-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subcontractorId: subId,
          projectId,
          workDescription: workDesc,
          agreedAmount,
          startDate,
          endDate: endDate || null,
          notes,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gabim");
      }
      const created = await res.json();
      setAssignments((prev) => [created, ...prev]);
      toast.success("Caktimi u shtua");
      setShowForm(false);
      setSubId(""); setWorkDesc(""); setAgreedAmount(""); setEndDate(""); setNotes("");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Gabim");
    } finally {
      setSaving(false);
    }
  }

  async function deleteAssignment(id: string) {
    if (!confirm("Fshi këtë caktim? Pagesat dhe shpenzimet e lidhura do fshihen.")) return;
    try {
      const res = await fetch(`/api/subcontractor-assignments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gabim");
      setAssignments((prev) => prev.filter((a) => a.id !== id));
      toast.success("U fshi");
      router.refresh();
    } catch {
      toast.error("Gabim");
    }
  }

  async function savePayment() {
    if (!payingFor || !payAmount || !payDate) {
      toast.error("Plotëso shumën dhe datën");
      return;
    }
    setSavingPay(true);
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
      setAssignments((prev) =>
        prev.map((a) => (a.id === payingFor ? { ...a, payments: [created, ...a.payments] } : a))
      );
      toast.success("Pagesa u shtua dhe u krijua shpenzim në projekt");
      setPayingFor(null); setPayAmount(""); setPayDesc(""); setPayMethod("CASH");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Gabim");
    } finally {
      setSavingPay(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-10 text-center">
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin mx-auto" />
      </div>
    );
  }

  // Statistika
  const totalAgreed = assignments.reduce((s, a) => s + a.agreedAmount, 0);
  const totalPaid = assignments.reduce(
    (s, a) => s + a.payments.reduce((ps, p) => ps + p.amount, 0),
    0
  );
  const outstanding = totalAgreed - totalPaid;

  return (
    <div className="space-y-4">
      {/* Permbledhje */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="text-[10px] text-muted-foreground">Total caktimi</p>
          <p className="text-base font-bold text-orange-400">{formatCurrency(totalAgreed)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="text-[10px] text-muted-foreground">Paguar</p>
          <p className="text-base font-bold text-green-400">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="text-[10px] text-muted-foreground">Borxh</p>
          <p className={cn("text-base font-bold", outstanding > 0 ? "text-red-400" : "text-muted-foreground")}>
            {formatCurrency(outstanding)}
          </p>
        </div>
      </div>

      {canEdit && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm text-muted-foreground">
            Bashkëpuntorët e këtij projekti. Pagesat → shpenzime automatike.
          </p>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            Cakto Bashkëpuntor
          </button>
        </div>
      )}

      {/* Lista */}
      {assignments.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <Handshake className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-3">Asnjë bashkëpuntor i caktuar në këtë projekt.</p>
          {subs.length === 0 && (
            <Link href="/subcontractors" className="text-xs text-orange-400 hover:underline">
              Krijo bashkëpuntorë në faqen Bashkëpunëtorët
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => {
            const paid = a.payments.reduce((s, p) => s + p.amount, 0);
            const remaining = a.agreedAmount - paid;
            const percent = a.agreedAmount > 0 ? (paid / a.agreedAmount) * 100 : 0;
            return (
              <div key={a.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Link href={`/subcontractors/${a.subcontractor.id}`} className="text-base font-bold text-foreground hover:text-orange-400">
                        {a.subcontractor.name}
                      </Link>
                      {a.subcontractor.specialty && (
                        <span className="text-xs text-orange-400">{a.subcontractor.specialty}</span>
                      )}
                      <span className={cn("badge", STATUS_COLORS[a.status])}>{STATUS_LABELS[a.status]}</span>
                    </div>
                    <p className="text-sm text-foreground">{a.workDescription}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(a.startDate)}{a.endDate ? ` → ${formatDate(a.endDate)}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Vlera</p>
                    <p className="text-lg font-bold text-orange-400">{formatCurrency(a.agreedAmount)}</p>
                  </div>
                </div>

                <div className="space-y-1 mb-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Paguar: <span className="text-green-400 font-medium">{formatCurrency(paid)}</span></span>
                    <span className="text-muted-foreground">Mbetur: <span className={cn("font-medium", remaining > 0 ? "text-red-400" : "text-green-400")}>{formatCurrency(remaining)}</span></span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", percent >= 100 ? "bg-green-500" : "bg-orange-500")}
                      style={{ width: `${Math.min(100, percent)}%` }}
                    />
                  </div>
                </div>

                {canEdit && (
                  <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-border">
                    <button onClick={() => { setPayingFor(a.id); setPayAmount(""); }} className="btn-primary text-xs py-1.5">
                      <Euro className="w-3.5 h-3.5" />
                      Pagesë
                    </button>
                    <Link href={`/subcontractors/${a.subcontractor.id}`} className="btn-secondary text-xs py-1.5">
                      Detajet <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <button onClick={() => deleteAssignment(a.id)} className="btn-ghost text-xs text-red-400 hover:bg-red-400/10">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Caktim i ri */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Cakto Bashkëpuntor</h3>
              <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-secondary"><X className="w-4 h-4" /></button>
            </div>

            <div>
              <label className="label-field">Bashkëpuntori *</label>
              <select value={subId} onChange={(e) => setSubId(e.target.value)} className="input-field">
                <option value="">— Zgjedh —</option>
                {subs.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}{s.specialty ? ` (${s.specialty})` : ""}</option>
                ))}
              </select>
              {subs.length === 0 && (
                <p className="text-xs text-yellow-400 mt-1">
                  Nuk ka bashkëpuntorë. <Link href="/subcontractors" className="underline">Krijo një</Link> së pari.
                </p>
              )}
            </div>

            <div>
              <label className="label-field">Përshkrimi i punës *</label>
              <textarea value={workDesc} onChange={(e) => setWorkDesc(e.target.value)} rows={2} className="input-field" />
            </div>

            <div>
              <label className="label-field">Vlera e dakorduar (€) *</label>
              <input type="number" step="0.01" value={agreedAmount} onChange={(e) => setAgreedAmount(e.target.value)} className="input-field" />
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
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="input-field" />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="btn-secondary">Anulo</button>
              <button onClick={saveAssignment} disabled={saving || subs.length === 0} className="btn-primary">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Cakto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Pagese */}
      {payingFor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Shto Pagesë</h3>
              <button onClick={() => setPayingFor(null)} className="p-1 rounded hover:bg-secondary"><X className="w-4 h-4" /></button>
            </div>
            <div>
              <label className="label-field">Shuma (€) *</label>
              <input type="number" step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="input-field" autoFocus />
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
              <textarea value={payDesc} onChange={(e) => setPayDesc(e.target.value)} rows={2} className="input-field" />
            </div>
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-2.5 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-orange-300">Kjo pagesë do regjistrohet automatikisht si shpenzim në projekt.</p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setPayingFor(null)} className="btn-secondary">Anulo</button>
              <button onClick={savePayment} disabled={savingPay} className="btn-primary">
                {savingPay ? <Loader2 className="w-4 h-4 animate-spin" /> : <Euro className="w-4 h-4" />}
                Paguaj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
