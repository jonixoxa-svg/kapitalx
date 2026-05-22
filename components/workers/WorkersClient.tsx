"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Search, Edit, Trash2, Phone, Mail, Briefcase, X } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";

interface WorkerFormState {
  name: string;
  position: string;
  phone: string;
  email: string;
  dailyRate: string;
}

const DEFAULT_FORM: WorkerFormState = {
  name: "",
  position: "",
  phone: "",
  email: "",
  dailyRate: "",
};

export default function WorkersClient({ workers: initialWorkers, userRole }: any) {
  const [workers, setWorkers] = useState(initialWorkers);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingWorker, setEditingWorker] = useState<any>(null);
  const [form, setForm] = useState<WorkerFormState>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);

  const filtered = workers.filter((w: any) =>
    !search ||
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.position.toLowerCase().includes(search.toLowerCase())
  );

  function openForm(worker?: any) {
    if (worker) {
      setEditingWorker(worker);
      setForm({
        name: worker.name,
        position: worker.position,
        phone: worker.phone || "",
        email: worker.email || "",
        dailyRate: worker.dailyRate.toString(),
      });
    } else {
      setEditingWorker(null);
      setForm(DEFAULT_FORM);
    }
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.position || !form.dailyRate) {
      toast.error("Plotësoni fushat e detyrueshme");
      return;
    }

    setLoading(true);
    try {
      const url = editingWorker ? `/api/workers/${editingWorker.id}` : "/api/workers";
      const method = editingWorker ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, dailyRate: parseFloat(form.dailyRate) }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (editingWorker) {
        setWorkers((prev: any[]) =>
          prev.map((w) => (w.id === editingWorker.id ? { ...w, ...data } : w))
        );
        toast.success("Punëtori u përditësua");
      } else {
        setWorkers((prev: any[]) => [...prev, { ...data, assignments: [] }]);
        toast.success("Punëtori u shtua");
      }

      setShowForm(false);
      setEditingWorker(null);
      setForm(DEFAULT_FORM);
    } catch (err: any) {
      toast.error(err.message || "Gabim");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Fshi punëtorin "${name}"?`)) return;
    const res = await fetch(`/api/workers/${id}`, { method: "DELETE" });
    if (res.ok) {
      setWorkers((prev: any[]) => prev.filter((w) => w.id !== id));
      toast.success("Punëtori u fshi");
    } else {
      toast.error("Nuk mund të fshihet (ka asignime)");
    }
  }

  async function toggleActive(worker: any) {
    const res = await fetch(`/api/workers/${worker.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !worker.active }),
    });
    if (res.ok) {
      setWorkers((prev: any[]) =>
        prev.map((w) => (w.id === worker.id ? { ...w, active: !w.active } : w))
      );
    }
  }

  const totalLabor = workers.reduce(
    (s: number, w: any) =>
      s + w.assignments.reduce((ws: number, a: any) => ws + a.daysWorked * w.dailyRate, 0),
    0
  );

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Punëtorë", value: workers.length, color: "text-foreground" },
          { label: "Aktivë", value: workers.filter((w: any) => w.active).length, color: "text-green-400" },
          { label: "Joaktivë", value: workers.filter((w: any) => !w.active).length, color: "text-muted-foreground" },
          { label: "Kosto Totale", value: formatCurrency(totalLabor), color: "text-orange-400", isText: true },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl px-4 py-3">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Kërko punëtorë..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 w-full"
          />
        </div>
        {userRole !== "VIEWER" && (
          <button onClick={() => openForm()} className="btn-primary whitespace-nowrap">
            <Plus className="w-4 h-4" /> Punëtor i Ri
          </button>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">
              {editingWorker ? "Edito Punëtorin" : "Punëtor i Ri"}
            </h3>
            <button
              onClick={() => { setShowForm(false); setEditingWorker(null); }}
              className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Emri i Plotë *</label>
              <input
                type="text"
                className="input-field"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Emri Mbiemri"
                required
              />
            </div>
            <div>
              <label className="label-field">Pozita *</label>
              <input
                type="text"
                className="input-field"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                placeholder="p.sh. Elektricist, Saldator"
                required
              />
            </div>
            <div>
              <label className="label-field">Telefoni</label>
              <input
                type="tel"
                className="input-field"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+355 69 xxx xxxx"
              />
            </div>
            <div>
              <label className="label-field">Email</label>
              <input
                type="email"
                className="input-field"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@domain.com"
              />
            </div>
            <div>
              <label className="label-field">Pagesa Ditore (ALL) *</label>
              <input
                type="number"
                className="input-field"
                value={form.dailyRate}
                onChange={(e) => setForm({ ...form, dailyRate: e.target.value })}
                placeholder="p.sh. 4500"
                min="0"
                required
              />
            </div>

            <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingWorker(null); }}
                className="btn-secondary"
              >
                <X className="w-4 h-4" /> Anulo
              </button>
              <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : null}
                {editingWorker ? "Përditëso" : "Shto Punëtorin"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Workers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-card border border-border rounded-xl p-10 text-center">
            <p className="text-muted-foreground">Asnjë punëtor i gjetur</p>
          </div>
        ) : (
          filtered.map((worker: any) => {
            const totalWorked = worker.assignments.reduce((s: number, a: any) => s + a.daysWorked, 0);
            const totalEarned = totalWorked * worker.dailyRate;

            return (
              <div
                key={worker.id}
                className={cn(
                  "bg-card border rounded-xl overflow-hidden transition-all duration-200",
                  worker.active ? "border-border" : "border-border/50 opacity-60"
                )}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                        worker.active ? "bg-orange-500/10 text-orange-400" : "bg-secondary text-muted-foreground"
                      )}>
                        {worker.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{worker.name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Briefcase className="w-3 h-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">{worker.position}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {userRole !== "VIEWER" && (
                        <>
                          <button
                            onClick={() => openForm(worker)}
                            className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {userRole === "ADMIN" && (
                            <button
                              onClick={() => handleDelete(worker.id, worker.name)}
                              className="p-1.5 rounded-md hover:bg-red-400/10 text-muted-foreground hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {(worker.phone || worker.email) && (
                    <div className="mt-3 space-y-1">
                      {worker.phone && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          {worker.phone}
                        </div>
                      )}
                      {worker.email && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          {worker.email}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="px-4 pb-3 border-t border-border/50 pt-3 grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Norma/ditë</p>
                    <p className="text-xs font-semibold text-foreground">{formatCurrency(worker.dailyRate)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Ditë punuar</p>
                    <p className="text-xs font-semibold text-foreground">{totalWorked}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Total fituar</p>
                    <p className="text-xs font-semibold text-orange-400">{formatCurrency(totalEarned)}</p>
                  </div>
                </div>

                {worker.assignments.length > 0 && (
                  <div className="px-4 pb-3">
                    <p className="text-[10px] text-muted-foreground uppercase mb-1.5">Projekte</p>
                    <div className="flex flex-wrap gap-1.5">
                      {worker.assignments.slice(0, 3).map((a: any) => (
                        <span
                          key={a.id}
                          className="text-[10px] bg-secondary text-muted-foreground rounded-md px-2 py-0.5 truncate max-w-[120px]"
                        >
                          {a.project.name}
                        </span>
                      ))}
                      {worker.assignments.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{worker.assignments.length - 3} të tjerë
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
