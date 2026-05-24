"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Edit, Trash2, X, Repeat, Calendar, Paperclip, FolderKanban, Eye } from "lucide-react";
import { formatCurrency, getGeneralExpenseCategoryLabel, getMonthName } from "@/lib/utils";

const CATEGORIES = [
  { value: "MATERIALS", label: "Materiale" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "SALARIES", label: "Paga" },
  { value: "RENT", label: "Qiraja" },
  { value: "ELECTRICITY", label: "Rryma" },
  { value: "INTERNET", label: "Internet" },
  { value: "MAINTENANCE", label: "Mirëmbajtja" },
  { value: "VEHICLES", label: "Automjetet" },
  { value: "MARKETING", label: "Marketingu" },
  { value: "INSURANCE", label: "Sigurimi" },
  { value: "OTHER", label: "Të tjera" },
];

const now = new Date();
const DEFAULT_FORM = {
  category: "MATERIALS",
  description: "",
  amount: "",
  month: (now.getMonth() + 1).toString(),
  year: now.getFullYear().toString(),
  recurring: false,
  projectId: "",
};

interface Project { id: string; name: string; client: string }

export default function ExpensesClient({ expenses: initial, projects, userRole }: { expenses: any[]; projects: Project[]; userRole: string }) {
  const [expenses, setExpenses] = useState<any[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(DEFAULT_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [monthFilter, setMonthFilter] = useState("ALL");
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [receiptModal, setReceiptModal] = useState<string | null>(null);

  const months = Array.from(
    new Set(expenses.map((e: any) => `${e.year}-${e.month}`))
  ).sort().reverse() as string[];

  const filtered = expenses.filter((e: any) => {
    if (monthFilter !== "ALL" && `${e.year}-${e.month}` !== monthFilter) return false;
    if (projectFilter === "NONE" && e.projectId) return false;
    if (projectFilter !== "ALL" && projectFilter !== "NONE" && e.projectId !== projectFilter) return false;
    if (categoryFilter !== "ALL" && e.category !== categoryFilter) return false;
    return true;
  });

  const total = filtered.reduce((s: number, e: any) => s + e.amount, 0);
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
        projectId: expense.projectId || "",
      });
    } else {
      setEditing(null);
      setForm(DEFAULT_FORM);
    }
    setFile(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description || !form.amount) { toast.error("Plotësoni fushat"); return; }
    setLoading(true);
    try {
      let res: Response;
      if (editing) {
        res = await fetch(`/api/general-expenses/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else if (file) {
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
        fd.append("file", file);
        res = await fetch("/api/general-expenses", { method: "POST", body: fd });
      } else {
        res = await fetch("/api/general-expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (editing) {
        setExpenses((prev) => prev.map((x) => (x.id === editing.id ? { ...x, ...data } : x)));
        toast.success("Shpenzimi u përditësua");
      } else {
        setExpenses((prev) => [data, ...prev]);
        toast.success("Shpenzimi u shtua");
      }
      setShowForm(false);
      setEditing(null);
      setForm(DEFAULT_FORM);
      setFile(null);
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
      setExpenses((prev) => prev.filter((x) => x.id !== id));
      toast.success("Shpenzimi u fshi");
    } else { toast.error("Gabim gjatë fshirjes"); }
  }

  return (
    <div className="space-y-5">
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
          <p className="text-xs text-muted-foreground">Lidhur me Projekt</p>
          <p className="text-xl font-bold text-foreground">{filtered.filter((e: any) => e.projectId).length}</p>
        </div>
      </div>

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

      <div className="flex items-center gap-3 flex-wrap">
        <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="input-field w-auto">
          <option value="ALL">Të gjithë muajt</option>
          {months.map((m) => {
            const [y, mn] = m.split("-");
            return <option key={m} value={m}>{getMonthName(parseInt(mn))} {y}</option>;
          })}
        </select>
        <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="input-field w-auto">
          <option value="ALL">Të gjitha projektet</option>
          <option value="NONE">Pa projekt</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input-field w-auto">
          <option value="ALL">Të gjitha kategoritë</option>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>

        {userRole !== "VIEWER" && (
          <button onClick={() => openForm()} className="btn-primary ml-auto">
            <Plus className="w-4 h-4" /> Shpenzim i Ri
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">
              {editing ? "Edito Shpenzimin" : "Shpenzim i Ri"}
            </h3>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Kategoria *</label>
              <select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label-field">Shuma (€) *</label>
              <input type="number" step="0.01" className="input-field" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} min="0" required />
            </div>
            <div className="sm:col-span-2">
              <label className="label-field">Përshkrimi *</label>
              <input type="text" className="input-field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Përshkrim i shpenzimit" required />
            </div>
            <div>
              <label className="label-field">Lidh me projekt (opsional)</label>
              <select className="input-field" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                <option value="">— Pa projekt —</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label-field">Foto fature (opsional)</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={!!editing}
                className="input-field text-xs"
              />
              {editing && <p className="text-[10px] text-muted-foreground mt-1">Foto nuk mund të editohet</p>}
            </div>
            <div>
              <label className="label-field">Muaji *</label>
              <select className="input-field" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })}>
                {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>)}
              </select>
            </div>
            <div>
              <label className="label-field">Viti *</label>
              <input type="number" className="input-field" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} min="2020" max="2030" />
            </div>
            <div className="sm:col-span-2 flex items-center gap-2">
              <input type="checkbox" id="recurring" checked={form.recurring} onChange={(e) => setForm({ ...form, recurring: e.target.checked })} className="accent-orange-500 w-4 h-4" />
              <label htmlFor="recurring" className="text-sm text-muted-foreground">Shpenzim i përsëritur mujor</label>
            </div>

            <div className="sm:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="btn-secondary">Anulo</button>
              <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
                {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {editing ? "Përditëso" : "Shto"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-border">
              <th className="table-header px-4 py-3 text-left">Kategoria</th>
              <th className="table-header px-4 py-3 text-left">Përshkrimi</th>
              <th className="table-header px-4 py-3 text-left">Projekti</th>
              <th className="table-header px-4 py-3 text-left">Periudha</th>
              <th className="table-header px-4 py-3 text-center">Faturë</th>
              <th className="table-header px-4 py-3 text-right">Shuma</th>
              {userRole !== "VIEWER" && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">Asnjë shpenzim</td></tr>
            ) : (
              filtered.map((expense: any) => (
                <tr key={expense.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-secondary text-muted-foreground rounded-md px-2 py-1">
                        {getGeneralExpenseCategoryLabel(expense.category)}
                      </span>
                      {expense.recurring && <Repeat className="w-3 h-3 text-orange-400" />}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">{expense.description}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {expense.project ? (
                      <span className="inline-flex items-center gap-1 bg-orange-500/10 text-orange-400 rounded-md px-2 py-1">
                        <FolderKanban className="w-3 h-3" />
                        {expense.project.name}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {getMonthName(expense.month)} {expense.year}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {expense.receiptUrl ? (
                      <button onClick={() => setReceiptModal(expense.receiptUrl)} className="text-orange-400 hover:text-orange-300" title={expense.receiptName || "Foto"}>
                        <Paperclip className="w-4 h-4 mx-auto" />
                      </button>
                    ) : <span className="text-muted-foreground/50">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-foreground text-right">{formatCurrency(expense.amount)}</td>
                  {userRole !== "VIEWER" && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openForm(expense)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(expense.id)} className="p-1.5 rounded-md hover:bg-red-400/10 text-muted-foreground hover:text-red-400">
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
                <td colSpan={5} className="px-4 py-3 text-sm font-semibold text-foreground">Total</td>
                <td className="px-4 py-3 text-sm font-bold text-orange-400 text-right">{formatCurrency(total)}</td>
                {userRole !== "VIEWER" && <td />}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {receiptModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setReceiptModal(null)}>
          <div className="relative max-w-3xl w-full">
            <button onClick={() => setReceiptModal(null)} className="absolute -top-10 right-0 text-white hover:text-orange-400">
              <X className="w-6 h-6" />
            </button>
            {receiptModal.endsWith(".pdf") ? (
              <iframe src={receiptModal} className="w-full h-[80vh] bg-white rounded-lg" />
            ) : (
              <img src={receiptModal} alt="Faturë" className="w-full max-h-[80vh] object-contain rounded-lg" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
