"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Edit, X, CheckCircle2, Circle, ListChecks } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";

interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  completed: boolean;
  completedAt: string | Date | null;
  order: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface Props {
  projectId: string;
  milestones: Milestone[];
  userRole: string;
}

const SUGJERIME = [
  "Fillimi i punes / Mobilizimi",
  "Themelet",
  "Muret / Konstruksioni",
  "Catia",
  "Instalimet elektrike",
  "Instalimet sanitare",
  "Suvatimi",
  "Lyerja",
  "Dyer dhe dritare",
  "Pastrimi final",
  "Dorezimi i projektit",
];

export default function MilestonesSection({ projectId, milestones: initial, userRole }: Props) {
  const router = useRouter();
  const [milestones, setMilestones] = useState<Milestone[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Milestone | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const canEdit = userRole !== "VIEWER";
  const totalCount = milestones.length;
  const completedCount = milestones.filter((m) => m.completed).length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  function resetForm() {
    setTitle("");
    setDescription("");
    setEditing(null);
    setShowForm(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Titulli mungon");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const res = await fetch(`/api/milestones/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description }),
        });
        if (!res.ok) throw new Error();
        const updated = await res.json();
        setMilestones((arr) => arr.map((m) => (m.id === updated.id ? updated : m)));
        toast.success("Faza u perditesua");
      } else {
        const res = await fetch(`/api/milestones`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, title, description }),
        });
        if (!res.ok) throw new Error();
        const created = await res.json();
        setMilestones((arr) => [...arr, created]);
        toast.success("Faza u shtua");
      }
      resetForm();
      router.refresh();
    } catch {
      toast.error("Gabim gjate ruajtjes");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(m: Milestone) {
    const newCompleted = !m.completed;
    // Optimistic update
    setMilestones((arr) =>
      arr.map((x) =>
        x.id === m.id
          ? { ...x, completed: newCompleted, completedAt: newCompleted ? new Date().toISOString() : null }
          : x
      )
    );
    try {
      const res = await fetch(`/api/milestones/${m.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: newCompleted }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      // Revert
      setMilestones((arr) =>
        arr.map((x) =>
          x.id === m.id ? { ...x, completed: m.completed, completedAt: m.completedAt } : x
        )
      );
      toast.error("Gabim gjate perditesimit");
    }
  }

  async function handleDelete(m: Milestone) {
    if (!confirm(`Fshi fazen "${m.title}"?`)) return;
    try {
      const res = await fetch(`/api/milestones/${m.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setMilestones((arr) => arr.filter((x) => x.id !== m.id));
      toast.success("Faza u fshi");
      router.refresh();
    } catch {
      toast.error("Gabim gjate fshirjes");
    }
  }

  async function addSuggestion(s: string) {
    if (milestones.some((m) => m.title.toLowerCase() === s.toLowerCase())) {
      toast.error("Eshte shtuar tashme");
      return;
    }
    try {
      const res = await fetch(`/api/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, title: s }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setMilestones((arr) => [...arr, created]);
      toast.success(`U shtua: ${s}`);
      router.refresh();
    } catch {
      toast.error("Gabim");
    }
  }

  function startEdit(m: Milestone) {
    setEditing(m);
    setTitle(m.title);
    setDescription(m.description || "");
    setShowForm(true);
  }

  return (
    <div className="space-y-5">
      {/* Header me progresin */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <div className="flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-orange-400" />
            <h3 className="text-base font-semibold text-foreground">Fazat e Projektit</h3>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              {completedCount} nga {totalCount} faza të përfunduara
            </p>
            <p className="text-2xl font-bold text-orange-400">{progress}%</p>
          </div>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Sa here qe shenon nje faze si te perfunduar, progresi i projektit perditesohet automatikisht.
        </p>
      </div>

      {/* Sugjerime / Butoni shto */}
      {canEdit && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setShowForm(!showForm)} className="btn-primary">
              <Plus className="w-4 h-4" />
              {showForm && !editing ? "Mbyll" : "Shto Faze te Re"}
            </button>
          </div>

          {milestones.length === 0 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-2">
                Sugjerime te shpejta (kliko per ti shtuar):
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGJERIME.map((s) => (
                  <button
                    key={s}
                    onClick={() => addSuggestion(s)}
                    className="text-xs px-3 py-1.5 rounded-full bg-secondary hover:bg-orange-500/20 hover:text-orange-400 text-muted-foreground transition-colors border border-border"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showForm && (
            <form onSubmit={handleSave} className="bg-card border border-border rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">
                {editing ? "Edito Fazen" : "Faze e Re"}
              </h3>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Titulli *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="P.sh. Themelet u perfunduan"
                  className="input-field"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  Pershkrim (opsional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detaje shtese..."
                  rows={2}
                  className="input-field"
                />
              </div>
              <div className="flex items-center gap-2">
                <button type="submit" disabled={saving} className="btn-primary text-xs">
                  {saving ? "Po ruaj..." : editing ? "Ruaj" : "Shto Fazen"}
                </button>
                <button type="button" onClick={resetForm} className="btn-secondary text-xs">
                  Anulo
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Lista e milestones */}
      <div className="space-y-2">
        {milestones.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <ListChecks className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">
              Nuk ka faza akoma. {canEdit ? "Shto fazen e pare ose perdor sugjerimet me siper." : ""}
            </p>
          </div>
        ) : (
          milestones.map((m, idx) => (
            <div
              key={m.id}
              className={cn(
                "flex items-start gap-3 bg-card border rounded-xl px-4 py-3 transition-colors",
                m.completed
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-border hover:border-orange-500/30"
              )}
            >
              <button
                onClick={() => canEdit && handleToggle(m)}
                disabled={!canEdit}
                className={cn(
                  "mt-0.5 flex-shrink-0 transition-colors",
                  canEdit ? "cursor-pointer" : "cursor-not-allowed"
                )}
                title={m.completed ? "Shënoje si të papërfunduar" : "Shënoje si të përfunduar"}
              >
                {m.completed ? (
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                ) : (
                  <Circle className="w-6 h-6 text-muted-foreground hover:text-orange-400" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground font-mono">#{idx + 1}</span>
                  <p
                    className={cn(
                      "text-sm font-medium",
                      m.completed ? "text-muted-foreground line-through" : "text-foreground"
                    )}
                  >
                    {m.title}
                  </p>
                </div>
                {m.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>
                )}
                {m.completed && m.completedAt && (
                  <p className="text-[10px] text-green-400/80 mt-1">
                    Përfunduar më {formatDate(m.completedAt as any)}
                  </p>
                )}
              </div>

              {canEdit && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => startEdit(m)}
                    className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                    title="Edito"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(m)}
                    className="p-1.5 rounded-md hover:bg-red-400/10 text-muted-foreground hover:text-red-400 transition-colors"
                    title="Fshi"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
