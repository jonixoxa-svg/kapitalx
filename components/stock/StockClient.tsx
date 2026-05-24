"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Package, Plus, Edit, Trash2, AlertTriangle, X, Save, MinusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StockItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  description: string | null;
  minQuantity: number | null;
  movements: any[];
}

interface Props {
  initialItems: StockItem[];
  userRole: string;
}

export default function StockClient({ initialItems, userRole }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<StockItem[]>(initialItems);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<StockItem | null>(null);
  const [form, setForm] = useState({ name: "", quantity: "", unit: "copë", description: "", minQuantity: "" });
  const [useDialog, setUseDialog] = useState<StockItem | null>(null);
  const [useAmount, setUseAmount] = useState("");
  const [useReason, setUseReason] = useState("");

  const canEdit = userRole !== "VIEWER";

  function openForm(item?: StockItem) {
    if (item) {
      setEditing(item);
      setForm({
        name: item.name,
        quantity: String(item.quantity),
        unit: item.unit,
        description: item.description || "",
        minQuantity: item.minQuantity !== null ? String(item.minQuantity) : "",
      });
    } else {
      setEditing(null);
      setForm({ name: "", quantity: "", unit: "copë", description: "", minQuantity: "" });
    }
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Emri mungon"); return; }

    try {
      const url = editing ? `/api/stock/${editing.id}` : "/api/stock";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (editing) {
        setItems((arr) => arr.map((it) => (it.id === data.id ? { ...it, ...data } : it)));
        toast.success("Materiali u perditesua");
      } else {
        setItems((arr) => [...arr, { ...data, movements: [] }]);
        toast.success("Materiali u shtua");
      }
      closeForm();
      router.refresh();
    } catch {
      toast.error("Gabim gjate ruajtjes");
    }
  }

  async function handleDelete(item: StockItem) {
    if (!confirm(`Fshi materialin "${item.name}"?`)) return;
    try {
      const res = await fetch(`/api/stock/${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setItems((arr) => arr.filter((it) => it.id !== item.id));
      toast.success("Materiali u fshi");
    } catch {
      toast.error("Gabim");
    }
  }

  async function handleUse(e: React.FormEvent) {
    e.preventDefault();
    if (!useDialog) return;
    const amt = parseFloat(useAmount);
    if (isNaN(amt) || amt <= 0) { toast.error("Sasi e pavlefshme"); return; }

    try {
      const res = await fetch("/api/stock/use", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockItemId: useDialog.id, quantity: amt, reason: useReason }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Gabim");
        return;
      }
      const data = await res.json();
      setItems((arr) => arr.map((it) => (it.id === useDialog.id ? { ...it, quantity: data.item.quantity } : it)));
      toast.success(`U perdoren ${amt} ${useDialog.unit}`);
      setUseDialog(null);
      setUseAmount("");
      setUseReason("");
      router.refresh();
    } catch {
      toast.error("Gabim");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Stoku i Depozites</h2>
          <p className="text-sm text-muted-foreground">{items.length} materiale ne stok</p>
        </div>
        {canEdit && (
          <button onClick={() => openForm()} className="btn-primary">
            <Plus className="w-4 h-4" />
            Shto Material
          </button>
        )}
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.length === 0 ? (
          <div className="col-span-full bg-card border border-border rounded-xl p-8 text-center">
            <Package className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">Asnjë material akoma</p>
          </div>
        ) : (
          items.map((item) => {
            const low = item.minQuantity !== null && item.quantity <= item.minQuantity;
            return (
              <div
                key={item.id}
                className={cn(
                  "bg-card border rounded-xl p-4",
                  low ? "border-yellow-500/50" : "border-border"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.name}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                      )}
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openForm(item)}
                        className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"
                        title="Edito"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="p-1.5 rounded-md hover:bg-red-400/10 text-muted-foreground hover:text-red-400"
                        title="Fshi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-border/50">
                  <div className="flex items-baseline gap-1">
                    <span className={cn("text-2xl font-bold", low ? "text-yellow-400" : "text-foreground")}>
                      {item.quantity}
                    </span>
                    <span className="text-sm text-muted-foreground">{item.unit}</span>
                    {low && <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 ml-1" />}
                  </div>
                  {item.minQuantity !== null && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">Min: {item.minQuantity} {item.unit}</p>
                  )}
                </div>

                {canEdit && (
                  <button
                    onClick={() => { setUseDialog(item); setUseAmount(""); setUseReason(""); }}
                    className="btn-secondary text-xs w-full mt-3"
                  >
                    <MinusCircle className="w-3.5 h-3.5" />
                    Perdor / Ul Stokun
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={handleSave} className="bg-card border border-border rounded-xl p-5 w-full max-w-md space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                {editing ? "Edito Material" : "Material i Ri"}
              </h3>
              <button type="button" onClick={closeForm} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">Emri *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="P.sh. Çimento"
                className="input-field"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Sasia</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  placeholder="0"
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Njesi</label>
                <input
                  type="text"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  placeholder="copë, kg, m, l..."
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">Min sasia (alarm)</label>
              <input
                type="number"
                step="0.01"
                value={form.minQuantity}
                onChange={(e) => setForm({ ...form, minQuantity: e.target.value })}
                placeholder="Opsional"
                className="input-field"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">Pershkrim</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="input-field"
              />
            </div>

            <div className="flex items-center gap-2">
              <button type="submit" className="btn-primary text-xs">
                <Save className="w-3.5 h-3.5" />
                {editing ? "Ruaj" : "Shto"}
              </button>
              <button type="button" onClick={closeForm} className="btn-secondary text-xs">Anulo</button>
            </div>
          </form>
        </div>
      )}

      {/* Use stock modal */}
      {useDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={handleUse} className="bg-card border border-border rounded-xl p-5 w-full max-w-md space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Perdor: {useDialog.name}</h3>
              <button type="button" onClick={() => setUseDialog(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Stoku aktual: <span className="font-semibold text-foreground">{useDialog.quantity} {useDialog.unit}</span>
            </p>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">Sasia per perdorur *</label>
              <input
                type="number"
                step="0.01"
                value={useAmount}
                onChange={(e) => setUseAmount(e.target.value)}
                placeholder="0"
                className="input-field"
                autoFocus
                required
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">Arsyeja (opsional)</label>
              <input
                type="text"
                value={useReason}
                onChange={(e) => setUseReason(e.target.value)}
                placeholder="P.sh. Projekti X"
                className="input-field"
              />
            </div>

            <div className="flex items-center gap-2">
              <button type="submit" className="btn-primary text-xs">
                <MinusCircle className="w-3.5 h-3.5" />
                Ul nga Stoku
              </button>
              <button type="button" onClick={() => setUseDialog(null)} className="btn-secondary text-xs">Anulo</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
