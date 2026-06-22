"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  PlusCircle,
  Trash2,
  X,
  Loader2,
  Calendar,
  TrendingUp,
  Edit3,
  Check,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

interface ExtraWork {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  agreedDate: string;
  approvedBy: string | null;
  status: "APPROVED" | "PENDING" | "REJECTED";
  notes: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  APPROVED: "Aprovuar",
  PENDING: "Në pritje",
  REJECTED: "Refuzuar",
};

const STATUS_COLORS: Record<string, string> = {
  APPROVED: "bg-green-500/10 text-green-400 border-green-500/30",
  PENDING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  REJECTED: "bg-red-500/10 text-red-400 border-red-500/30",
};

const STATUS_ICONS: Record<string, any> = {
  APPROVED: CheckCircle2,
  PENDING: Clock,
  REJECTED: XCircle,
};

export default function ProjectExtraWorksSection({
  projectId,
  contractValue,
  userRole,
}: {
  projectId: string;
  contractValue: number;
  userRole: string;
}) {
  const router = useRouter();
  const canEdit = userRole !== "VIEWER";
  const [extras, setExtras] = useState<ExtraWork[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [agreedDate, setAgreedDate] = useState(new Date().toISOString().slice(0, 10));
  const [approvedBy, setApprovedBy] = useState("");
  const [status, setStatus] = useState<"APPROVED" | "PENDING" | "REJECTED">("APPROVED");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/project-extras?projectId=${projectId}`)
      .then((r) => r.json())
      .then((data) => setExtras(data || []))
      .finally(() => setLoading(false));
  }, [projectId]);

  function resetForm() {
    setTitle(""); setDescription(""); setAmount("");
    setAgreedDate(new Date().toISOString().slice(0, 10));
    setApprovedBy(""); setStatus("APPROVED"); setNotes("");
    setEditingId(null);
  }

  function openEdit(extra: ExtraWork) {
    setEditingId(extra.id);
    setTitle(extra.title);
    setDescription(extra.description || "");
    setAmount(String(extra.amount));
    setAgreedDate(new Date(extra.agreedDate).toISOString().slice(0, 10));
    setApprovedBy(extra.approvedBy || "");
    setStatus(extra.status);
    setNotes(extra.notes || "");
    setShowForm(true);
  }

  async function save() {
    if (!title || !amount) {
      toast.error("Plotëso titullin dhe vlerën");
      return;
    }
    setSaving(true);
    try {
      const payload = { projectId, title, description, amount, agreedDate, approvedBy, status, notes };
      const url = editingId ? `/api/project-extras/${editingId}` : "/api/project-extras";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Gabim");
      const result = await res.json();
      if (editingId) {
        setExtras((prev) => prev.map((e) => (e.id === editingId ? result : e)));
      } else {
        setExtras((prev) => [result, ...prev]);
      }
      toast.success(editingId ? "U përditësua" : "Pune shtesë u shtua");
      setShowForm(false);
      resetForm();
      router.refresh();
    } catch {
      toast.error("Gabim gjatë ruajtjes");
    } finally {
      setSaving(false);
    }
  }

  async function deleteExtra(id: string) {
    if (!confirm("Fshi këtë pune shtesë? Vlera totale e projektit do zvogëlohet.")) return;
    try {
      const res = await fetch(`/api/project-extras/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gabim");
      setExtras((prev) => prev.filter((e) => e.id !== id));
      toast.success("U fshi");
      router.refresh();
    } catch {
      toast.error("Gabim");
    }
  }

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-10 text-center">
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin mx-auto" />
      </div>
    );
  }

  // Total i punet shtese te aprovuara
  const approvedExtras = extras.filter((e) => e.status === "APPROVED");
  const pendingExtras = extras.filter((e) => e.status === "PENDING");
  const totalApproved = approvedExtras.reduce((s, e) => s + e.amount, 0);
  const totalPending = pendingExtras.reduce((s, e) => s + e.amount, 0);
  const newContractValue = contractValue + totalApproved;

  return (
    <div className="space-y-4">
      {/* Permbledhje */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Kontrata Origjinale</p>
          <p className="text-lg font-bold text-foreground">{formatCurrency(contractValue)}</p>
        </div>
        <div className="bg-card border border-green-500/30 rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <PlusCircle className="w-3 h-3" /> Punët Shtesë (aprovuar)
          </p>
          <p className="text-lg font-bold text-green-400">+{formatCurrency(totalApproved)}</p>
          {totalPending > 0 && (
            <p className="text-[10px] text-yellow-400 mt-0.5">+{formatCurrency(totalPending)} në pritje</p>
          )}
        </div>
        <div className="bg-card border border-orange-500/30 rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Vlera Totale e Re</p>
          <p className="text-lg font-bold text-orange-400">{formatCurrency(newContractValue)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Origjinale + Shtese</p>
        </div>
      </div>

      {/* Veprimet */}
      {canEdit && (
        <div className="flex justify-end">
          <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary">
            <Plus className="w-4 h-4" />
            Shto Pune Shtesë
          </button>
        </div>
      )}

      {/* Lista */}
      {extras.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center">
          <PlusCircle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-foreground font-medium mb-1">Asnjë pune shtesë akoma</p>
          <p className="text-xs text-muted-foreground">
            Nëse klienti kërkon pune shtesë gjatë projektit, shtoni këtu për të rritur vlerën.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {extras.map((extra) => {
            const StatusIcon = STATUS_ICONS[extra.status];
            return (
              <div key={extra.id} className="bg-card border border-border rounded-xl p-4 hover:border-orange-500/30 transition-colors">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-base font-bold text-foreground">{extra.title}</h3>
                      <span className={cn("badge", STATUS_COLORS[extra.status])}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {STATUS_LABELS[extra.status]}
                      </span>
                    </div>
                    {extra.description && (
                      <p className="text-sm text-muted-foreground mb-2">{extra.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(extra.agreedDate)}
                      </span>
                      {extra.approvedBy && <span>· Aprovuar nga: <strong className="text-foreground">{extra.approvedBy}</strong></span>}
                    </div>
                    {extra.notes && (
                      <p className="text-xs text-muted-foreground/80 mt-2 italic">{extra.notes}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={cn(
                      "text-xl font-bold",
                      extra.status === "APPROVED" ? "text-green-400" : extra.status === "PENDING" ? "text-yellow-400" : "text-red-400"
                    )}>
                      +{formatCurrency(extra.amount)}
                    </p>
                  </div>
                </div>

                {canEdit && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                    <button onClick={() => openEdit(extra)} className="btn-secondary text-xs py-1.5">
                      <Edit3 className="w-3.5 h-3.5" /> Edito
                    </button>
                    {extra.status === "PENDING" && (
                      <button
                        onClick={async () => {
                          const res = await fetch(`/api/project-extras/${extra.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status: "APPROVED" }),
                          });
                          if (res.ok) {
                            setExtras((prev) => prev.map((e) => (e.id === extra.id ? { ...e, status: "APPROVED" } : e)));
                            toast.success("Aprovuar");
                            router.refresh();
                          }
                        }}
                        className="btn-secondary text-xs py-1.5 text-green-400"
                      >
                        <Check className="w-3.5 h-3.5" /> Aprovo
                      </button>
                    )}
                    <button onClick={() => deleteExtra(extra.id)} className="btn-ghost text-xs py-1.5 text-red-400 hover:bg-red-400/10">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Info per pagesat */}
      {totalApproved > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 flex items-start gap-2">
          <TrendingUp className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-orange-300">
            <strong>Vlera totale e kontratës u rrit nga {formatCurrency(contractValue)} në {formatCurrency(newContractValue)}.</strong> Borxhi i klientit dhe progresi i pagesave llogaritet bazuar në vlerën e re.
          </p>
        </div>
      )}

      {/* Modal për shtim/edit */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg p-5 space-y-4 my-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">
                {editingId ? "Edito Pune Shtesë" : "Pune Shtesë e Re"}
              </h3>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="p-1 rounded hover:bg-secondary"><X className="w-4 h-4" /></button>
            </div>

            <div>
              <label className="label-field">Titulli *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="P.sh. Dyer shtesë të oborrit" />
            </div>

            <div>
              <label className="label-field">Përshkrimi</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="input-field" placeholder="Detaje për punën që do bëhet" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-field">Vlera (€) *</label>
                <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="input-field" placeholder="0.00" />
              </div>
              <div>
                <label className="label-field">Data e dakordimit</label>
                <input type="date" value={agreedDate} onChange={(e) => setAgreedDate(e.target.value)} className="input-field" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-field">Aprovuar nga</label>
                <input value={approvedBy} onChange={(e) => setApprovedBy(e.target.value)} className="input-field" placeholder="Emri i klientit" />
              </div>
              <div>
                <label className="label-field">Statusi</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="input-field">
                  <option value="APPROVED">Aprovuar</option>
                  <option value="PENDING">Në pritje</option>
                  <option value="REJECTED">Refuzuar</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label-field">Shënime</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="input-field" />
            </div>

            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-orange-300">
                Vlera e këtij artikulli do <strong>shtohet automatikisht</strong> në vlerën totale të kontratës (vetëm nëse statusi është "Aprovuar").
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => { setShowForm(false); resetForm(); }} className="btn-secondary">Anulo</button>
              <button onClick={save} disabled={saving} className="btn-primary">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {editingId ? "Ruaj" : "Shto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
