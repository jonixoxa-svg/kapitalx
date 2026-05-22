"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Edit, Trash2, X, Repeat, Calendar } from "lucide-react";
import { formatCurrency, getGeneralExpenseCategoryLabel, getMonthName, cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "RENT", label: "Qiraja" },
  { value: "ELECTRICITY", label: "Rryma" },
  { value: "INTERNET", label: "Internet" },
  { value: "ADMIN_SALARIES", label: "Pagat Administrative" },
  { value: "MAINTENANCE", label: "Mirëmbajtja" },
  { value: "VEHICLES", label: "Automjetet" },
  { value: "MARKETING", label: "Marketingu" },
  { value: "INSURANCE", label: "Sigurimi" },
  { value: "OTHER", label: "Të tjera" },
];

const now = new Date();
const DEFAULT_FORM = {
  category: "RENT",
  description: "",
  amount: "",
  month: (now.getMonth() + 1).toString(),
  year: now.getFullYear().toString(),
  recurring: false,
};

export default function ExpensesClient({ expenses: initial, userRole }: any) {
  const [expenses, setExpenses] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [monthFilter, setMonthFilter] = useState("ALL");

  const months = Array.from(
    new Set(expenses.map((e: any) => `${e.year}-${e.month}`))
  ).sort().reverse() as string[];

  const filtered = monthFilter === "ALL"
    ? expenses
    : expenses.filter((e: any) => `${e.year}-${e.month}` === monthFilter);

  const total = filtered.reduce((s: number, e: any) => s + e.amount, 0);

  // Group by category
  const byCategory = filtered.reduce((acc: any, e: any) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  function openForm(expense?: any) {
    if (expense) {
      setEditing(expense);
      setForm({
        category: expense.category,
        description: expense.description,
        amount: expense.amount.toString(),
        month: expense.month.toString(),
        year: expense.year.toString(),
        recurring: expense.recurring,
      });
    } else {
      setEditing(null);
      setForm(DEFAULT_FORM);
    }
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description || !form.amount) {
      toast.error("Plotësoni fushat");
      return;
    }
    setLoading(true);
    try {
      const url = editing ? `/api/general-expenses/${editing.id}` : "/api/general-expenses";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (editing) {
        setExpenses((prev: any[]) => prev.map((x) => (x.id === editing.id ? data : x)));
        toast.success("Shpenzimi u përditësua");
      } else {
        setExpenses((prev: any[]) => [data, ...prev]);
        toast.success("Shpenzimi u shtua");
      }
      setShowForm(false);
      setEditing(null);
      setForm(DEFAULT_FORM);
    } catch (err: any) {
      toast.error(err.message || "Gabim");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Fshi këtë shpenzim?")) return;
    const res = await fetch(`/api/general-expenses/${id}`, { method: "DELETE" });
    if (res.ok) {
      setExpenses((prev: any[]) => prev.filter((x) => x.id !== id));
      toast.success("Shpenzimi u fshi");
    } else {
      toast.error("Gabim gjatë fshirjes");
    }
  }

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-card border border-orange-500/30 rounded-xl px-4 py-3">
          <p className="text-xs text-muted-foreground">Total Shpenzime</p>
          <p className="text-xl font-bold text-orange-400">{formatCurrency(total)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl px-4 py-3">
          <p className="text-xs text-muted-foreground">Numri i Zërave</p>
          <p className="text-xl font-bold text-foreground">{filtered.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl px-4 py-3">
          <p className="text-xs text-muted-foreground">Zëra të Përsëritur</p>
          <p className="text-xl font-bold text-foreground">
            {filtered.filter((e: any) => e.recurring).length}
          </p>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Sipas Kategorisë</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(byCategory).map(([cat, amount]: any) => (
            <div key={cat} className="bg-secondary/40 rounded-lg px-3 py-2">
              <p className="text-xs text-muted-foreground">{getGeneralExpenseCategoryLabel(cat)}</p>
              <p className="text-sm font-semibold text-foreground">{formatCurrency(amount)}</p>
            </div>
          ))}
          {Object.keys(byCategory).length === 0 && (
            <p className="text-sm text-muted-foreground col-span-full">Asnjë të dhënë</p>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="input-field w-auto"
        >
          <option value="ALL">Të gjithë muajt</option>
          {months.map((m) => {
            const [year, month] = m.split("-");
            return (
              <option key={m} value={m}>
                {getMonthName(parseInt(month))} {year}
              </option>
            );
          })}
        </select>

        {userRole !== "VIEWER" && (
          <button onClick={() => openForm()} className="btn-primary ml-auto">
            <Plus className="w-4 h-4" /> Shpenzim i Ri
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">
              {editing ? "Edito Shpenzimin" : "Shpenzim i Ri"}
            </h3>
            <button
              onClick={() => { setShowForm(false); setEditing(null); }}
              className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Kategoria *</label>
              <select
                className="input-field"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Shuma (ALL) *</label>
              <input
                type="number"
                className="input-field"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                min="0"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label-field">Përshkrimi *</label>
              <input
                type="text"
                className="input-field"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Përshkrim i shpenzimit"
                required
              />
            </div>
            <div>
              <label className="label-field">Muaji *</label>
              <select
                className="input-field"
                value={form.month}
                onChange={(e) => setForm({ ...form, month: e.target.value })}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Viti *</label>
              <input
                type="number"
                className="input-field"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                min="2020"
                max="2030"
              />
            </div>
            <div className="sm:col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="recurring"
                checked={form.recurring}
                onChange={(e) => setForm({ ...form, recurring: e.target.checked })}
                className="accent-orange-500 w-4 h-4"
              />
              <label htmlFor="recurring" className="text-sm text-muted-foreground">
                Shpenzim i përsëritur mujor
              </label>
            </div>

            <div className="sm:col-span-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditing(null); }}
                className="btn-secondary"
              >
                Anulo
              </button>
              <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
                {loading && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {editing ? "Përditëso" : "Shto"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="table-header px-4 py-3 text-left">Kategoria</th>
              <th className="table-header px-4 py-3 text-left">Përshkrimi</th>
              <th className="table-header px-4 py-3 text-left">Periudha</th>
              <th className="table-header px-4 py-3 text-right">Shuma</th>
              {userRole !== "VIEWER" && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">
                  Asnjë shpenzim
                </td>
              </tr>
            ) : (
              filtered.map((expense: any) => (
                <tr key={expense.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-secondary text-muted-foreground rounded-md px-2 py-1">
                        {getGeneralExpenseCategoryLabel(expense.category)}
                      </span>
                      {expense.recurring && (
                        <span title="I përsëritur">
                          <Repeat className="w-3 h-3 text-orange-400" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">{expense.description}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {getMonthName(expense.month)} {expense.year}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-foreground text-right">
                    {formatCurrency(expense.amount)}
                  </td>
                  {userRole !== "VIEWER" && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => openForm(expense)}
                          className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
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
          {filtered.length > 0 && (
            <tfoot>
              <tr className="bg-secondary/30">
                <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-foreground">Total</td>
                <td className="px-4 py-3 text-sm font-bold text-orange-400 text-right">
                  {formatCurrency(total)}
                </td>
                {userRole !== "VIEWER" && <td />}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
