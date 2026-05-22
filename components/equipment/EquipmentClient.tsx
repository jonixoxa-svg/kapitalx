"use client";

import { useState } from "react";
import { Plus, Truck, Trash2, Edit2, X, Loader2, Calendar, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn, formatCurrency, formatDate, getEquipmentTypeLabel } from "@/lib/utils";

type Project = { id: string; name: string; status: string };

type EquipmentAssignment = {
  id: string;
  equipmentId: string;
  projectId: string;
  project: Project;
  startDate: string;
  endDate: string | null;
  daysUsed: number;
  notes: string | null;
};

type Equipment = {
  id: string;
  name: string;
  type: "TRUCK" | "CRANE" | "EXCAVATOR" | "WELDER" | "GENERATOR" | "SCAFFOLDING" | "OTHER";
  dailyRate: number;
  description: string | null;
  active: boolean;
  assignments: EquipmentAssignment[];
};

const TYPES: Equipment["type"][] = ["TRUCK", "CRANE", "EXCAVATOR", "WELDER", "GENERATOR", "SCAFFOLDING", "OTHER"];

export default function EquipmentClient({
  equipment,
  projects,
  userRole,
}: {
  equipment: Equipment[];
  projects: Project[];
  userRole: string;
}) {
  const router = useRouter();
  const canEdit = userRole !== "VIEWER";
  const canDelete = userRole === "ADMIN";

  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [editing, setEditing] = useState<Equipment | null>(null);
  const [assigningTo, setAssigningTo] = useState<Equipment | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ name: "", type: "OTHER" as Equipment["type"], dailyRate: "", description: "" });
  const [assignForm, setAssignForm] = useState({
    projectId: "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    daysUsed: "",
    notes: "",
  });

  function openAdd() {
    setForm({ name: "", type: "OTHER", dailyRate: "", description: "" });
    setEditing(null);
    setShowAddEquipment(true);
  }

  function openEdit(e: Equipment) {
    setForm({
      name: e.name,
      type: e.type,
      dailyRate: String(e.dailyRate),
      description: e.description || "",
    });
    setEditing(e);
    setShowAddEquipment(true);
  }

  async function saveEquipment() {
    if (!form.name) return toast.error("Emri i pajisjes mungon");
    setSaving(true);
    try {
      const url = editing ? `/api/equipment/${editing.id}` : "/api/equipment";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success(editing ? "Pajisja u përditësua" : "Pajisja u krijua");
      setShowAddEquipment(false);
      router.refresh();
    } catch {
      toast.error("Gabim gjatë ruajtjes");
    } finally {
      setSaving(false);
    }
  }

  async function deleteEquipment(id: string) {
    if (!confirm("Sigurohu që dëshiron ta fshish? Të gjitha caktimet do të humbasin.")) return;
    try {
      const res = await fetch(`/api/equipment/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Pajisja u fshi");
      router.refresh();
    } catch {
      toast.error("Gabim");
    }
  }

  async function toggleActive(e: Equipment) {
    try {
      await fetch(`/api/equipment/${e.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !e.active }),
      });
      router.refresh();
    } catch {
      toast.error("Gabim");
    }
  }

  function openAssign(e: Equipment) {
    setAssigningTo(e);
    setAssignForm({
      projectId: "",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: "",
      daysUsed: "",
      notes: "",
    });
  }

  async function saveAssignment() {
    if (!assigningTo) return;
    if (!assignForm.projectId) return toast.error("Zgjedh projektin");
    setSaving(true);
    try {
      const res = await fetch("/api/equipment-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipmentId: assigningTo.id,
          projectId: assignForm.projectId,
          startDate: assignForm.startDate,
          endDate: assignForm.endDate || null,
          daysUsed: assignForm.daysUsed || 0,
          notes: assignForm.notes,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Caktimi u shtua");
      setAssigningTo(null);
      router.refresh();
    } catch {
      toast.error("Gabim gjatë ruajtjes");
    } finally {
      setSaving(false);
    }
  }

  async function deleteAssignment(id: string) {
    if (!confirm("Fshij caktimin?")) return;
    try {
      const res = await fetch(`/api/equipment-assignments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("U fshi");
      router.refresh();
    } catch {
      toast.error("Gabim");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {equipment.length} pajisje · {equipment.filter((e) => e.active).length} aktive
          </p>
        </div>
        {canEdit && (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" /> Shto pajisje
          </button>
        )}
      </div>

      {/* List */}
      {equipment.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground">
          Nuk ke shtuar ende asnjë pajisje. Kliko "Shto pajisje" për të filluar.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {equipment.map((e) => {
            const totalCost = e.assignments.reduce((sum, a) => sum + a.daysUsed * e.dailyRate, 0);
            return (
              <div key={e.id} className={cn("bg-card border border-border rounded-xl p-5", !e.active && "opacity-60")}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-orange-500/20 rounded-lg flex items-center justify-center">
                      <Truck className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{e.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {getEquipmentTypeLabel(e.type)} · {formatCurrency(e.dailyRate)}/ditë
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {canEdit && (
                      <>
                        <button
                          onClick={() => toggleActive(e)}
                          className={cn(
                            "text-[10px] px-2 py-1 rounded-md font-medium border",
                            e.active
                              ? "bg-green-400/10 text-green-400 border-green-400/20"
                              : "bg-secondary text-muted-foreground border-border"
                          )}
                        >
                          {e.active ? "Aktive" : "Joaktive"}
                        </button>
                        <button
                          onClick={() => openEdit(e)}
                          className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground"
                          title="Edito"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => deleteEquipment(e.id)}
                        className="p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
                        title="Fshij"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {e.description && (
                  <p className="text-xs text-muted-foreground mb-3">{e.description}</p>
                )}

                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Caktimet</p>
                  {canEdit && e.active && (
                    <button
                      onClick={() => openAssign(e)}
                      className="text-xs text-orange-400 hover:text-orange-300 font-medium flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Cakto në projekt
                    </button>
                  )}
                </div>

                {e.assignments.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Nuk është caktuar në asnjë projekt.</p>
                ) : (
                  <div className="space-y-2">
                    {e.assignments.map((a) => (
                      <div key={a.id} className="bg-secondary/40 rounded-lg p-3 flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <FolderOpen className="w-3.5 h-3.5 text-muted-foreground" />
                            <p className="text-sm font-medium text-foreground truncate">{a.project.name}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(a.startDate)}</span>
                            {a.endDate && <><span>—</span><span>{formatDate(a.endDate)}</span></>}
                            <span>·</span>
                            <span>{a.daysUsed} ditë</span>
                            <span className="text-orange-400 font-semibold">{formatCurrency(a.daysUsed * e.dailyRate)}</span>
                          </div>
                          {a.notes && <p className="text-[11px] text-muted-foreground mt-1 italic">{a.notes}</p>}
                        </div>
                        {canEdit && (
                          <button
                            onClick={() => deleteAssignment(a.id)}
                            className="p-1 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground ml-2"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <p className="text-xs text-right pt-2 border-t border-border">
                      <span className="text-muted-foreground">Kosto totale: </span>
                      <span className="font-bold text-orange-400">{formatCurrency(totalCost)}</span>
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit equipment modal */}
      {showAddEquipment && (
        <Modal title={editing ? "Edito pajisje" : "Shto pajisje"} onClose={() => setShowAddEquipment(false)}>
          <div className="space-y-3">
            <Field label="Emri">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="P.sh. Kamion Mercedes Actros"
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-orange-500"
              />
            </Field>
            <Field label="Lloji">
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as Equipment["type"] })}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-orange-500"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>{getEquipmentTypeLabel(t)}</option>
                ))}
              </select>
            </Field>
            <Field label="Kosto ditore (€)">
              <input
                type="number"
                step="0.01"
                value={form.dailyRate}
                onChange={(e) => setForm({ ...form, dailyRate: e.target.value })}
                placeholder="0"
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-orange-500"
              />
            </Field>
            <Field label="Përshkrim (opsional)">
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-orange-500"
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setShowAddEquipment(false)} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground">Anulo</button>
            <button
              onClick={saveEquipment}
              disabled={saving}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {editing ? "Ruaj" : "Krijo"}
            </button>
          </div>
        </Modal>
      )}

      {/* Assign to project modal */}
      {assigningTo && (
        <Modal title={`Cakto "${assigningTo.name}" në projekt`} onClose={() => setAssigningTo(null)}>
          <div className="space-y-3">
            <Field label="Projekti">
              <select
                value={assignForm.projectId}
                onChange={(e) => setAssignForm({ ...assignForm, projectId: e.target.value })}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-orange-500"
              >
                <option value="">— zgjedh projektin —</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nga data">
                <input
                  type="date"
                  value={assignForm.startDate}
                  onChange={(e) => setAssignForm({ ...assignForm, startDate: e.target.value })}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-orange-500"
                />
              </Field>
              <Field label="Deri më (opsional)">
                <input
                  type="date"
                  value={assignForm.endDate}
                  onChange={(e) => setAssignForm({ ...assignForm, endDate: e.target.value })}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-orange-500"
                />
              </Field>
            </div>
            <Field label="Ditë të përdorura">
              <input
                type="number"
                step="0.5"
                min={0}
                value={assignForm.daysUsed}
                onChange={(e) => setAssignForm({ ...assignForm, daysUsed: e.target.value })}
                placeholder="0"
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-orange-500"
              />
            </Field>
            <Field label="Shënime (opsional)">
              <textarea
                value={assignForm.notes}
                onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                rows={2}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-orange-500"
              />
            </Field>
            {assignForm.daysUsed && assigningTo.dailyRate > 0 && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Kosto e llogaritur:</p>
                <p className="text-lg font-bold text-orange-400">
                  {formatCurrency(parseFloat(assignForm.daysUsed) * assigningTo.dailyRate)}
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setAssigningTo(null)} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground">Anulo</button>
            <button
              onClick={saveAssignment}
              disabled={saving}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Cakto
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-secondary text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      {children}
    </div>
  );
}
