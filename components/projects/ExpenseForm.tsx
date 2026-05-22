"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Save, X } from "lucide-react";

const EXPENSE_CATEGORIES = [
  { value: "MATERIALS", label: "Materiale" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "FUEL", label: "Karburant" },
  { value: "EQUIPMENT", label: "Pajisje" },
  { value: "FOOD", label: "Ushqim" },
  { value: "ACCOMMODATION", label: "Akomodim" },
  { value: "OTHER", label: "Të tjera" },
];

interface ExpenseFormProps {
  projectId: string;
  expense?: any;
  onSuccess: (expense: any) => void;
  onCancel: () => void;
}

export default function ExpenseForm({ projectId, expense, onSuccess, onCancel }: ExpenseFormProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    category: expense?.category || "MATERIALS",
    description: expense?.description || "",
    amount: expense?.amount?.toString() || "",
    date: expense?.date
      ? new Date(expense.date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
  });

  const isEdit = !!expense;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description || !form.amount) {
      toast.error("Plotësoni të gjitha fushat");
      return;
    }

    setLoading(true);
    try {
      const url = isEdit ? `/api/expenses/${expense.id}` : "/api/expenses";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, projectId, amount: parseFloat(form.amount) }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(isEdit ? "Shpenzimi u përditësua" : "Shpenzimi u shtua");
      onSuccess(data);
    } catch (err: any) {
      toast.error(err.message || "Gabim");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="label-field">Kategoria *</label>
        <select
          className="input-field"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label-field">Data</label>
        <input
          type="date"
          className="input-field"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />
      </div>

      <div>
        <label className="label-field">Përshkrimi *</label>
        <input
          type="text"
          className="input-field"
          placeholder="Përshkrim i shpenzimit"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
        />
      </div>

      <div>
        <label className="label-field">Shuma (ALL) *</label>
        <input
          type="number"
          className="input-field"
          placeholder="0"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          min="0"
          step="0.01"
          required
        />
      </div>

      <div className="sm:col-span-2 flex items-center gap-3 justify-end pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">
          <X className="w-4 h-4" /> Anulo
        </button>
        <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isEdit ? "Përditëso" : "Shto"}
        </button>
      </div>
    </form>
  );
}
