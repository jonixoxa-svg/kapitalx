"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowRight,
  FolderKanban,
  Wallet,
  Trash2,
  X,
  Plus,
  Loader2,
  Calendar,
  FileText,
  CreditCard,
} from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

type Project = { id: string; name: string; client?: string };

type PendingItem = {
  id: string;
  description: string;
  amount: number;
  date: string;
  source: string | null;
  reason: string | null;
  notes: string | null;
  type: string;
  receiptUrl: string | null;
  receiptName: string | null;
  createdAt: string;
};

interface Props {
  items: PendingItem[];
  projects: Project[];
  userRole: string;
}

const PROJECT_CATEGORIES = [
  { value: "MATERIALS", label: "Materiale" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "FUEL", label: "Karburant" },
  { value: "EQUIPMENT", label: "Pajisje" },
  { value: "FOOD", label: "Ushqim" },
  { value: "ACCOMMODATION", label: "Akomodim" },
  { value: "SUBCONTRACTOR", label: "Bashkëpuntor" },
  { value: "OTHER", label: "Të tjera" },
];

const GENERAL_CATEGORIES = [
  { value: "MATERIALS", label: "Materiale" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "SALARIES", label: "Paga" },
  { value: "RENT", label: "Qira" },
  { value: "ELECTRICITY", label: "Energji elektrike" },
  { value: "INTERNET", label: "Internet" },
  { value: "ADMIN_SALARIES", label: "Paga administrative" },
  { value: "MAINTENANCE", label: "Mirëmbajtje" },
  { value: "VEHICLES", label: "Automjete" },
  { value: "MARKETING", label: "Marketing" },
  { value: "INSURANCE", label: "Sigurime" },
  { value: "OTHER", label: "Të tjera" },
];

export default function PendingExpensesClient({ items: initial, projects, userRole }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const canEdit = userRole !== "VIEWER";

  // Modal per "Coj te projekti"
  const [movingItem, setMovingItem] = useState<PendingItem | null>(null);
  const [moveType, setMoveType] = useState<"project" | "general" | "project-payment">("general");
  const [moveProjectId, setMoveProjectId] = useState("");
  const [moveCategory, setMoveCategory] = useState("OTHER");
  const [moveMethod, setMoveMethod] = useState("CASH");
  const [moving, setMoving] = useState(false);

  // Modal per shtim manual te ri
  const [showAdd, setShowAdd] = useState(false);
  const [newDesc, setNewDesc] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [newReason, setNewReason] = useState("");
  const [newType, setNewType] = useState<"EXPENSE" | "PAYMENT">("EXPENSE");
  const [adding, setAdding] = useState(false);

  async function addNew() {
    if (!newDesc || !newAmount) {
      toast.error("Plotëso përshkrimin dhe shumën");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch("/api/pending-expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: newDesc,
          amount: newAmount,
          date: newDate,
          reason: newReason,
          type: newType,
        }),
      });
      if (!res.ok) throw new Error("Gabim");
      const created = await res.json();
      setItems((prev) => [created, ...prev]);
      toast.success("U shtua te të dyshimtat");
      setShowAdd(false);
      setNewDesc(""); setNewAmount(""); setNewReason(""); setNewType("EXPENSE");
    } catch {
      toast.error("Gabim");
    } finally {
      setAdding(false);
    }
  }

  async function moveItem() {
    if (!movingItem) return;
    if (moveType === "project" && (!moveProjectId || !moveCategory)) {
      toast.error("Zgjedh projektin dhe kategorinë");
      return;
    }
    if (moveType === "general" && !moveCategory) {
      toast.error("Zgjedh kategorinë");
      return;
    }
    if (moveType === "project-payment" && !moveProjectId) {
      toast.error("Zgjedh projektin");
      return;
    }
    setMoving(true);
    try {
      const res = await fetch(`/api/pending-expenses/${movingItem.id}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: moveType,
          projectId: moveProjectId || undefined,
          category: moveCategory,
          method: moveMethod,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gabim");
      }
      setItems((prev) => prev.filter((i) => i.id !== movingItem.id));
      const targetLabel =
        moveType === "project" ? "shpenzime të projektit"
          : moveType === "project-payment" ? "pagesë në projekt"
            : "shpenzime të përgjithshme";
      toast.success(`U çua te ${targetLabel}`);
      setMovingItem(null);
      setMoveProjectId(""); setMoveCategory("OTHER"); setMoveMethod("CASH");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Gabim");
    } finally {
      setMoving(false);
    }
  }

  async function deleteItem(id: string) {
    if (!confirm("Fshi këtë artikull nga të dyshimtat?")) return;
    try {
      const res = await fetch(`/api/pending-expenses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gabim");
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("U fshi");
    } catch {
      toast.error("Gabim");
    }
  }

  const totalAmount = items.reduce((s, i) => s + i.amount, 0);
  const expenseItems = items.filter((i) => i.type === "EXPENSE");
  const paymentItems = items.filter((i) => i.type === "PAYMENT");

  return (
    <div className="space-y-6">
      {/* Statistika */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card border-yellow-500/30">
          <div className="w-9 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
          </div>
          <p className="text-xs text-muted-foreground mb-1">Total Të Dyshimta</p>
          <p className="text-xl font-bold text-yellow-400">{items.length}</p>
        </div>
        <div className="stat-card border-red-500/30">
          <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center mb-2">
            <Wallet className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-xs text-muted-foreground mb-1">Shpenzime në pritje</p>
          <p className="text-xl font-bold text-foreground">{expenseItems.length}</p>
          <p className="text-xs text-muted-foreground">{formatCurrency(expenseItems.reduce((s, i) => s + i.amount, 0))}</p>
        </div>
        <div className="stat-card border-green-500/30">
          <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center mb-2">
            <CreditCard className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-xs text-muted-foreground mb-1">Pagesa në pritje</p>
          <p className="text-xl font-bold text-foreground">{paymentItems.length}</p>
          <p className="text-xs text-muted-foreground">{formatCurrency(paymentItems.reduce((s, i) => s + i.amount, 0))}</p>
        </div>
      </div>

      {canEdit && (
        <div className="flex justify-end">
          <button onClick={() => setShowAdd(true)} className="btn-secondary">
            <Plus className="w-4 h-4" />
            Shto Manualisht
          </button>
        </div>
      )}

      {/* Lista */}
      {items.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-400/40 mx-auto mb-3" />
          <p className="text-base font-semibold text-foreground mb-1">Asnjë artikull i dyshimtë</p>
          <p className="text-sm text-muted-foreground">
            Të gjitha shpenzimet dhe pagesat janë kategorizuar saktë.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-card border border-yellow-500/20 rounded-xl p-4 hover:border-yellow-500/40 transition-colors">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={cn(
                      "text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded border",
                      item.type === "PAYMENT"
                        ? "bg-green-500/10 text-green-400 border-green-500/30"
                        : "bg-red-500/10 text-red-400 border-red-500/30"
                    )}>
                      {item.type === "PAYMENT" ? "Pagesë" : "Shpenzim"}
                    </span>
                    <p className="text-base font-bold text-foreground">{formatCurrency(item.amount)}</p>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />{formatDate(item.date)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground mb-2">{item.description}</p>
                  {item.reason && (
                    <div className="flex items-start gap-1.5 text-xs text-yellow-300 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span><strong>Arsyeja:</strong> {item.reason}</span>
                    </div>
                  )}
                  {item.source && (
                    <p className="text-[11px] text-muted-foreground">Burimi: {item.source}</p>
                  )}
                </div>

                {canEdit && (
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => {
                        setMovingItem(item);
                        setMoveType(item.type === "PAYMENT" ? "project-payment" : "general");
                        setMoveCategory("OTHER");
                        setMoveProjectId("");
                      }}
                      className="btn-primary text-xs py-1.5"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      Klasifiko
                    </button>
                    <button onClick={() => deleteItem(item.id)} className="btn-ghost text-xs py-1.5 text-red-400 hover:bg-red-400/10">
                      <Trash2 className="w-3.5 h-3.5" />
                      Fshi
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Klasifiko */}
      {movingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg p-5 space-y-4 my-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Klasifiko Artikullin</h3>
              <button onClick={() => setMovingItem(null)} className="p-1 rounded hover:bg-secondary"><X className="w-4 h-4" /></button>
            </div>

            {/* Pamja e artikullit */}
            <div className="bg-secondary/30 rounded-lg p-3 text-sm">
              <p className="text-foreground font-medium">{movingItem.description}</p>
              <p className="text-orange-400 font-bold mt-1">{formatCurrency(movingItem.amount)} · {formatDate(movingItem.date)}</p>
            </div>

            {/* Zgjedhja e tipit */}
            <div>
              <label className="label-field">Ku duhet të shkojë?</label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => setMoveType("general")}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border text-left transition-colors",
                    moveType === "general" ? "bg-orange-500/10 border-orange-500/40" : "border-border hover:border-orange-500/30"
                  )}
                >
                  <Wallet className="w-5 h-5 text-orange-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Shpenzime të Përgjithshme</p>
                    <p className="text-xs text-muted-foreground">Shpenzim i firmës (jo për projekt specifik)</p>
                  </div>
                </button>
                <button
                  onClick={() => setMoveType("project")}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border text-left transition-colors",
                    moveType === "project" ? "bg-orange-500/10 border-orange-500/40" : "border-border hover:border-orange-500/30"
                  )}
                >
                  <FolderKanban className="w-5 h-5 text-orange-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Shpenzim në Projekt Specifik</p>
                    <p className="text-xs text-muted-foreground">Caktoje në një projekt të caktuar</p>
                  </div>
                </button>
                <button
                  onClick={() => setMoveType("project-payment")}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border text-left transition-colors",
                    moveType === "project-payment" ? "bg-orange-500/10 border-orange-500/40" : "border-border hover:border-orange-500/30"
                  )}
                >
                  <CreditCard className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Pagesë në Projekt (Të Ardhura)</p>
                    <p className="text-xs text-muted-foreground">Para që na ka paguar klienti për një projekt</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Projekti (nese kerkohet) */}
            {(moveType === "project" || moveType === "project-payment" || (moveType === "general")) && (
              <div>
                <label className="label-field">
                  Projekti {moveType === "general" && <span className="text-muted-foreground">(opsionale)</span>}
                </label>
                <select value={moveProjectId} onChange={(e) => setMoveProjectId(e.target.value)} className="input-field">
                  <option value="">— Zgjedh projektin —</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}{p.client ? ` (${p.client})` : ""}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Kategoria (per shpenzime) */}
            {(moveType === "project" || moveType === "general") && (
              <div>
                <label className="label-field">Kategoria</label>
                <select value={moveCategory} onChange={(e) => setMoveCategory(e.target.value)} className="input-field">
                  {(moveType === "project" ? PROJECT_CATEGORIES : GENERAL_CATEGORIES).map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Metoda e pageses (per project-payment) */}
            {moveType === "project-payment" && (
              <div>
                <label className="label-field">Mënyra e pagesës</label>
                <select value={moveMethod} onChange={(e) => setMoveMethod(e.target.value)} className="input-field">
                  <option value="CASH">Pagesë në dorë</option>
                  <option value="BANK_TRANSFER">Transfer bankar</option>
                  <option value="CHECK">Çek</option>
                  <option value="OTHER">Tjetër</option>
                </select>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => setMovingItem(null)} className="btn-secondary">Anulo</button>
              <button onClick={moveItem} disabled={moving} className="btn-primary">
                {moving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Klasifiko
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Shto manual */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Shto Të Dyshimtë</h3>
              <button onClick={() => setShowAdd(false)} className="p-1 rounded hover:bg-secondary"><X className="w-4 h-4" /></button>
            </div>

            <div>
              <label className="label-field">Tipi</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setNewType("EXPENSE")}
                  className={cn(
                    "px-3 py-2 rounded-lg border text-sm font-medium",
                    newType === "EXPENSE" ? "bg-red-500/10 border-red-500/40 text-red-400" : "border-border text-muted-foreground"
                  )}
                >
                  Shpenzim
                </button>
                <button
                  onClick={() => setNewType("PAYMENT")}
                  className={cn(
                    "px-3 py-2 rounded-lg border text-sm font-medium",
                    newType === "PAYMENT" ? "bg-green-500/10 border-green-500/40 text-green-400" : "border-border text-muted-foreground"
                  )}
                >
                  Pagesë
                </button>
              </div>
            </div>

            <div>
              <label className="label-field">Përshkrimi *</label>
              <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={2} className="input-field" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-field">Shuma (€) *</label>
                <input type="number" step="0.01" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="label-field">Data</label>
                <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="input-field" />
              </div>
            </div>

            <div>
              <label className="label-field">Arsyeja pse i dyshimtë</label>
              <textarea value={newReason} onChange={(e) => setNewReason(e.target.value)} rows={2} className="input-field" placeholder="P.sh. Vlerë e përsëritur, përshkrim i paqartë" />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => setShowAdd(false)} className="btn-secondary">Anulo</button>
              <button onClick={addNew} disabled={adding} className="btn-primary">
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Shto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
