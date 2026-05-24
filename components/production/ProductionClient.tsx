"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Hammer, Plus, Edit, Trash2, Clock, Users, Calendar, X, Save } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";

interface Worker {
  id: string;
  name: string;
  position: string;
}

interface Production {
  id: string;
  itemName: string;
  quantity: number;
  estimatedHours: number;
  startDate: string;
  endDate: string | null;
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED";
  notes: string | null;
  workers: { id: string; worker: Worker; hoursAssigned: number }[];
}

interface Props {
  initialItems: Production[];
  workers: Worker[];
  userRole: string;
}

const STATUS_LABEL: Record<string, string> = {
  PLANNED: "Planifikuar",
  IN_PROGRESS: "Ne progres",
  COMPLETED: "Perfunduar",
};
const STATUS_COLOR: Record<string, string> = {
  PLANNED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  IN_PROGRESS: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  COMPLETED: "bg-green-500/10 text-green-400 border-green-500/20",
};

export default function ProductionClient({ initialItems, workers, userRole }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<Production[]>(initialItems);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Production | null>(null);
  const [form, setForm] = useState({
    itemName: "",
    quantity: "1",
    estimatedHours: "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    status: "PLANNED",
    notes: "",
    workerIds: [] as string[],
  });

  const canEdit = userRole !== "VIEWER";

  function openForm(item?: Production) {
    if (item) {
      setEditing(item);
      setForm({
        itemName: item.itemName,
        quantity: String(item.quantity),
        estimatedHours: String(item.estimatedHours),
        startDate: new Date(item.startDate).toISOString().slice(0, 10),
        endDate: item.endDate ? new Date(item.endDate).toISOString().slice(0, 10) : "",
        status: item.status,
        notes: item.notes || "",
        workerIds: item.workers.map((w) => w.worker.id),
      });
    } else {
      setEditing(null);
      setForm({
        itemName: "",
        quantity: "1",
        estimatedHours: "",
        startDate: new Date().toISOString().slice(0, 10),
        endDate: "",
        status: "PLANNED",
        notes: "",
        workerIds: [],
      });
    }
    setShowForm(true);
  }

  function toggleWorker(id: string) {
    setForm((f) => ({
      ...f,
      workerIds: f.workerIds.includes(id) ? f.workerIds.filter((x) => x !== id) : [...f.workerIds, id],
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.itemName.trim()) { toast.error("Emri mungon"); return; }
    if (!form.startDate) { toast.error("Data e fillimit mungon"); return; }

    try {
      const url = editing ? `/api/production/${editing.id}` : "/api/production";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (editing) {
        setItems((arr) => arr.map((it) => (it.id === data.id ? data : it)));
        toast.success("U perditesua");
      } else {
        setItems((arr) => [data, ...arr]);
        toast.success("U shtua");
      }
      setShowForm(false);
      router.refresh();
    } catch {
      toast.error("Gabim");
    }
  }

  async function handleDelete(item: Production) {
    if (!confirm(`Fshi prodhimin "${item.itemName}"?`)) return;
    try {
      const res = await fetch(`/api/production/${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setItems((arr) => arr.filter((it) => it.id !== item.id));
      toast.success("U fshi");
    } catch {
      toast.error("Gabim");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Prodhimi ne Punetori</h2>
          <p className="text-sm text-muted-foreground">{items.length} artikuj prodhimi</p>
        </div>
        {canEdit && (
          <button onClick={() => openForm()} className="btn-primary">
            <Plus className="w-4 h-4" />
            Shto Prodhim
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.length === 0 ? (
          <div className="col-span-full bg-card border border-border rounded-xl p-8 text-center">
            <Hammer className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">Asnjë prodhim akoma</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <Hammer className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.itemName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Sasia: {item.quantity}</p>
                  </div>
                </div>
                {canEdit && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => openForm(item)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(item)} className="p-1.5 rounded-md hover:bg-red-400/10 text-muted-foreground hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                <span className={cn("inline-block text-[10px] px-2 py-0.5 rounded-full border", STATUS_COLOR[item.status])}>
                  {STATUS_LABEL[item.status]}
                </span>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{item.estimatedHours} orë</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDate(item.startDate)}{item.endDate ? ` → ${formatDate(item.endDate)}` : ""}</span>
                </div>

                <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <Users className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>
                    {item.workers.length === 0 ? "Asnjë punëtor" : item.workers.map((w) => w.worker.name).join(", ")}
                  </span>
                </div>

                {item.notes && (
                  <p className="text-xs text-muted-foreground italic pt-1 border-t border-border/50">{item.notes}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={handleSave} className="bg-card border border-border rounded-xl p-5 w-full max-w-lg space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                {editing ? "Edito Prodhim" : "Prodhim i Ri"}
              </h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">Emri i artikullit *</label>
              <input
                type="text"
                value={form.itemName}
                onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                placeholder="P.sh. Ankera"
                className="input-field"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Sasia</label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Koha (orë)</label>
                <input
                  type="number"
                  step="0.5"
                  value={form.estimatedHours}
                  onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Data fillimit *</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Data mbarimit</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">Statusi</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="input-field"
              >
                <option value="PLANNED">Planifikuar</option>
                <option value="IN_PROGRESS">Ne progres</option>
                <option value="COMPLETED">Perfunduar</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">Punetoret e caktuar</label>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-secondary/30 rounded-lg">
                {workers.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Asnjë punëtor i regjistruar</p>
                ) : (
                  workers.map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => toggleWorker(w.id)}
                      className={cn(
                        "text-xs px-2.5 py-1 rounded-full border transition-colors",
                        form.workerIds.includes(w.id)
                          ? "bg-orange-500/20 border-orange-500/40 text-orange-400"
                          : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {w.name}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">Shenime</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="input-field"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button type="submit" className="btn-primary text-xs">
                <Save className="w-3.5 h-3.5" />
                {editing ? "Ruaj" : "Shto"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-xs">Anulo</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
