"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Save, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface WorkerAssignmentFormProps {
  projectId: string;
  workers: any[];
  existingAssignments: any[];
  onSuccess: (assignment: any) => void;
  onCancel: () => void;
}

export default function WorkerAssignmentForm({
  projectId,
  workers,
  existingAssignments,
  onSuccess,
  onCancel,
}: WorkerAssignmentFormProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    workerId: "",
    daysWorked: "0",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    notes: "",
  });

  const selectedWorker = workers.find((w) => w.id === form.workerId);
  const totalPay = selectedWorker ? parseFloat(form.daysWorked || "0") * selectedWorker.dailyRate : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.workerId) {
      toast.error("Zgjidhni punëtorin");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/worker-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, projectId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Punëtori u caktua me sukses");
      onSuccess(data);
    } catch (err: any) {
      toast.error(err.message || "Gabim");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Cakto Punëtor në Projekt</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label-field">Punëtori *</label>
          <select
            className="input-field"
            value={form.workerId}
            onChange={(e) => setForm({ ...form, workerId: e.target.value })}
            required
          >
            <option value="">Zgjidhni punëtorin...</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} — {w.position} ({formatCurrency(w.dailyRate)}/ditë)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label-field">Ditë të Punuara</label>
          <input
            type="number"
            className="input-field"
            placeholder="0"
            value={form.daysWorked}
            onChange={(e) => setForm({ ...form, daysWorked: e.target.value })}
            min="0"
            step="0.5"
          />
        </div>

        <div>
          <label className="label-field">Data Fillimit *</label>
          <input
            type="date"
            className="input-field"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="label-field">Data Mbarimit</label>
          <input
            type="date"
            className="input-field"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          />
        </div>

        {selectedWorker && (
          <div className="sm:col-span-2 bg-orange-500/5 border border-orange-500/20 rounded-xl px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Norma ditore</p>
                <p className="text-sm font-semibold text-foreground">{formatCurrency(selectedWorker.dailyRate)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ditë</p>
                <p className="text-sm font-semibold text-foreground">{form.daysWorked || 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Pagesa</p>
                <p className="text-base font-bold text-orange-400">{formatCurrency(totalPay)}</p>
              </div>
            </div>
          </div>
        )}

        <div className="sm:col-span-2">
          <label className="label-field">Shënime</label>
          <input
            type="text"
            className="input-field"
            placeholder="Shënime opsionale..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 justify-end">
        <button type="button" onClick={onCancel} className="btn-secondary">
          <X className="w-4 h-4" /> Anulo
        </button>
        <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Cakto Punëtorin
        </button>
      </div>
    </form>
  );
}
