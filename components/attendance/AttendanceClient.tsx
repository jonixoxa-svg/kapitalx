"use client";

import { useState, useEffect, useMemo } from "react";
import { Calendar, Loader2, Plus, Plane, Trash2, X, Save, Edit3 } from "lucide-react";
import { toast } from "sonner";
import {
  cn,
  formatCurrency,
  getAttendanceStatusLabel,
  getAttendanceStatusColor,
} from "@/lib/utils";

type Worker = {
  id: string;
  name: string;
  position: string;
  dailyRate: number;
  active: boolean;
  vacationDaysPerYear?: number;
};

type Project = { id: string; name: string };

type AttendanceRecord = {
  id: string;
  workerId: string;
  date: string;
  status: "PRESENT" | "SICK" | "PAID_LEAVE" | "UNEXCUSED" | "VACATION" | "MAKEUP";
  projectId: string | null;
  notes: string | null;
};

type WorkerVacation = {
  id: string;
  workerId: string;
  startDate: string;
  endDate: string;
  workDays?: number;
  notes: string | null;
  worker?: { id: string; name: string; position: string };
};

const STATUSES: AttendanceRecord["status"][] = ["PRESENT", "SICK", "PAID_LEAVE", "UNEXCUSED", "VACATION", "MAKEUP"];

function todayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export default function AttendanceClient({
  workers,
  projects,
  userRole,
}: {
  workers: Worker[];
  projects: Project[];
  userRole: string;
}) {
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [records, setRecords] = useState<Record<string, AttendanceRecord>>({});
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [periodType, setPeriodType] = useState<"month" | "h1" | "h2">("month");
  const [periodYear, setPeriodYear] = useState(new Date().getFullYear());
  const [periodMonth, setPeriodMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [vacations, setVacations] = useState<WorkerVacation[]>([]);
  const [showVacationDialog, setShowVacationDialog] = useState(false);
  const [vacWorkerId, setVacWorkerId] = useState("");
  const [vacStart, setVacStart] = useState("");
  const [vacEnd, setVacEnd] = useState("");
  const [vacWorkDays, setVacWorkDays] = useState("");
  const [vacNotes, setVacNotes] = useState("");
  const [vacSaving, setVacSaving] = useState(false);
  const [editingDaysId, setEditingDaysId] = useState<string | null>(null);
  const [editingDaysValue, setEditingDaysValue] = useState("");

  // Llogarit dite pune (Mon-Fri) ne nje periudhe
  function calcWorkDays(start: string, end: string) {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    let n = 0;
    for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
      const day = d.getDay();
      if (day !== 0 && day !== 6) n++;
    }
    return n;
  }

  const canEdit = userRole !== "VIEWER";
  const activeWorkers = workers.filter((w) => w.active);

  // Fetch all vacations
  useEffect(() => {
    fetch("/api/worker-vacations")
      .then((r) => r.json())
      .then((data) => setVacations(data || []));
  }, []);

  // Fetch records for the selected date
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/attendance?from=${selectedDate}&to=${selectedDate}`)
      .then((r) => r.json())
      .then((data: AttendanceRecord[]) => {
        if (cancelled) return;
        const map: Record<string, AttendanceRecord> = {};
        for (const r of data) map[r.workerId] = r;
        setRecords(map);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  // Fetch records for the selected summary period
  useEffect(() => {
    let from = "", to = "";
    if (periodType === "month") {
      const m = String(periodMonth).padStart(2, "0");
      const lastDay = new Date(periodYear, periodMonth, 0).getDate();
      from = `${periodYear}-${m}-01`;
      to = `${periodYear}-${m}-${String(lastDay).padStart(2, "0")}`;
    } else if (periodType === "h1") {
      from = `${periodYear}-01-01`;
      to = `${periodYear}-06-30`;
    } else {
      from = `${periodYear}-07-01`;
      to = `${periodYear}-12-31`;
    }
    fetch(`/api/attendance?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((data) => setHistory(data));
  }, [records, periodType, periodYear, periodMonth]);

  async function setStatus(workerId: string, status: AttendanceRecord["status"], projectId?: string | null) {
    if (!canEdit) return;
    setSaving(workerId);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerId,
          date: selectedDate,
          status,
          projectId: projectId ?? records[workerId]?.projectId ?? null,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      const r = await res.json();
      setRecords((prev) => ({ ...prev, [workerId]: r }));
      toast.success("Statusi u ruajt");
    } catch {
      toast.error("Gabim gjatë ruajtjes");
    } finally {
      setSaving(null);
    }
  }

  const summary = useMemo(() => {
    const byWorker: Record<string, { present: number; sick: number; paidLeave: number; unexcused: number; vacation: number; makeup: number }> = {};
    for (const r of history) {
      if (!byWorker[r.workerId]) byWorker[r.workerId] = { present: 0, sick: 0, paidLeave: 0, unexcused: 0, vacation: 0, makeup: 0 };
      const b = byWorker[r.workerId];
      if (r.status === "PRESENT") b.present++;
      else if (r.status === "SICK") b.sick++;
      else if (r.status === "PAID_LEAVE") b.paidLeave++;
      else if (r.status === "UNEXCUSED") b.unexcused++;
      else if (r.status === "VACATION") b.vacation++;
      else if (r.status === "MAKEUP") b.makeup++;
    }
    return byWorker;
  }, [history]);

  async function saveVacation() {
    if (!vacWorkerId || !vacStart || !vacEnd) {
      toast.error("Plotëso punëtorin dhe datat");
      return;
    }
    setVacSaving(true);
    try {
      const res = await fetch("/api/worker-vacations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerId: vacWorkerId,
          startDate: vacStart,
          endDate: vacEnd,
          workDays: vacWorkDays !== "" ? parseInt(vacWorkDays) : undefined,
          notes: vacNotes,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gabim");
      }
      const created = await res.json();
      setVacations((prev) => [...prev, created]);
      toast.success("Pushimi u shtua");
      setShowVacationDialog(false);
      setVacWorkerId("");
      setVacStart("");
      setVacEnd("");
      setVacWorkDays("");
      setVacNotes("");
    } catch (e: any) {
      toast.error(e.message || "Gabim");
    } finally {
      setVacSaving(false);
    }
  }

  async function saveDaysEdit(vacationId: string) {
    const value = parseInt(editingDaysValue);
    if (isNaN(value) || value < 0) {
      toast.error("Vlerë jo e vlefshme");
      return;
    }
    try {
      const res = await fetch(`/api/worker-vacations/${vacationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workDays: value }),
      });
      if (!res.ok) throw new Error("Gabim");
      const updated = await res.json();
      setVacations((prev) => prev.map((v) => (v.id === vacationId ? updated : v)));
      toast.success("U ruajt");
      setEditingDaysId(null);
    } catch {
      toast.error("Gabim gjatë ruajtjes");
    }
  }

  async function deleteVacation(id: string) {
    if (!confirm("Fshi këtë pushim? Mungesat e ditëve do hiqen.")) return;
    try {
      const res = await fetch(`/api/worker-vacations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gabim");
      setVacations((prev) => prev.filter((v) => v.id !== id));
      toast.success("Pushimi u fshi");
    } catch {
      toast.error("Gabim gjatë fshirjes");
    }
  }

  // Lista e pushimeve aktive sot
  const activeVacations = useMemo(() => {
    const today = new Date(selectedDate);
    return vacations.filter((v) => new Date(v.startDate) <= today && new Date(v.endDate) >= today);
  }, [vacations, selectedDate]);

  return (
    <div className="space-y-6">
      {/* Date picker */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-foreground">
            <Calendar className="w-5 h-5 text-orange-400" />
            <span className="font-semibold">Data:</span>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-orange-500"
          />
          <button
            onClick={() => setSelectedDate(todayISO())}
            className="text-xs px-3 py-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground border border-border"
          >
            Sot
          </button>
          {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
      </div>

      {/* Worker grid */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Evidenca për {new Date(selectedDate).toLocaleDateString("sq-AL")}</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {activeWorkers.length} punëtorë aktivë. Statusi vendoset për këtë ditë.
          </p>
        </div>

        {activeWorkers.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-sm">
            Nuk ka punëtorë aktivë. Shto së pari nga faqja "Punëtorët".
          </div>
        ) : (
          <div className="divide-y divide-border">
            {activeWorkers.map((w) => {
              const rec = records[w.id];
              const currentStatus = rec?.status ?? null;
              return (
                <div key={w.id} className="p-4 flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-orange-400">
                        {w.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{w.name}</p>
                      <p className="text-[11px] text-muted-foreground">{w.position} · {formatCurrency(w.dailyRate)}/ditë</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {STATUSES.map((s) => {
                      const isActive = currentStatus === s;
                      return (
                        <button
                          key={s}
                          disabled={!canEdit || saving === w.id}
                          onClick={() => setStatus(w.id, s)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                            isActive
                              ? getAttendanceStatusColor(s)
                              : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary",
                            !canEdit && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {getAttendanceStatusLabel(s)}
                        </button>
                      );
                    })}
                  </div>

                  {/* Project picker, only when PRESENT */}
                  {rec?.status === "PRESENT" && projects.length > 0 && (
                    <select
                      value={rec.projectId || ""}
                      onChange={(e) => setStatus(w.id, "PRESENT", e.target.value || null)}
                      disabled={!canEdit}
                      className="bg-secondary border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-orange-500 min-w-[160px]"
                    >
                      <option value="">— pa projekt —</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  )}

                  {saving === w.id && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary section with period switcher */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-bold text-foreground">
              Përmbledhje {periodType === "month"
                ? `${new Date(periodYear, periodMonth - 1).toLocaleDateString("sq-AL", { month: "long" })} ${periodYear}`
                : periodType === "h1"
                ? `Janar-Qershor ${periodYear}`
                : `Korrik-Dhjetor ${periodYear}`}
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex bg-secondary/30 rounded-lg p-1">
                <button
                  onClick={() => setPeriodType("month")}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                    periodType === "month" ? "bg-orange-500/20 text-orange-400" : "text-muted-foreground"
                  )}
                >
                  Mujore
                </button>
                <button
                  onClick={() => setPeriodType("h1")}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                    periodType === "h1" ? "bg-orange-500/20 text-orange-400" : "text-muted-foreground"
                  )}
                >
                  6-mujori i parë
                </button>
                <button
                  onClick={() => setPeriodType("h2")}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                    periodType === "h2" ? "bg-orange-500/20 text-orange-400" : "text-muted-foreground"
                  )}
                >
                  6-mujori i dytë
                </button>
              </div>
              {periodType === "month" && (
                <select
                  value={periodMonth}
                  onChange={(e) => setPeriodMonth(parseInt(e.target.value))}
                  className="bg-secondary border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-orange-500"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {new Date(2026, m - 1).toLocaleDateString("sq-AL", { month: "long" })}
                    </option>
                  ))}
                </select>
              )}
              <select
                value={periodYear}
                onChange={(e) => setPeriodYear(parseInt(e.target.value))}
                className="bg-secondary border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-orange-500"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Pagohen <span className="text-green-400">Prezent</span>, <span className="text-blue-400">Leje me pagesë</span>, <span className="text-purple-400">Pushim</span>, dhe <span className="text-cyan-400">Kompensim</span>. Mungesa neto = Mungesë − Kompensim.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase text-muted-foreground bg-secondary/30">
                <th className="px-5 py-3 font-medium">Punëtori</th>
                <th className="px-2 py-3 font-medium text-center">Prezent</th>
                <th className="px-2 py-3 font-medium text-center">Sëmurë</th>
                <th className="px-2 py-3 font-medium text-center">Leje</th>
                <th className="px-2 py-3 font-medium text-center">Pushim</th>
                <th className="px-2 py-3 font-medium text-center">Kompensim</th>
                <th className="px-2 py-3 font-medium text-center">Mungesë</th>
                <th className="px-2 py-3 font-medium text-center text-red-400">Mungesë Neto</th>
                <th className="px-5 py-3 font-medium text-right">Pagesa</th>
              </tr>
            </thead>
            <tbody>
              {activeWorkers.map((w) => {
                const s = summary[w.id] || { present: 0, sick: 0, paidLeave: 0, unexcused: 0, vacation: 0, makeup: 0 };
                const netMungesa = Math.max(0, s.unexcused - s.makeup);
                const paidDays = s.present + s.paidLeave + s.vacation + s.makeup;
                const pay = paidDays * w.dailyRate;
                return (
                  <tr key={w.id} className="border-t border-border">
                    <td className="px-5 py-3 text-foreground">{w.name}</td>
                    <td className="px-2 py-3 text-center text-green-400 font-semibold">{s.present}</td>
                    <td className="px-2 py-3 text-center text-yellow-400">{s.sick}</td>
                    <td className="px-2 py-3 text-center text-blue-400">{s.paidLeave}</td>
                    <td className="px-2 py-3 text-center text-purple-400">{s.vacation}</td>
                    <td className="px-2 py-3 text-center text-cyan-400">{s.makeup}</td>
                    <td className="px-2 py-3 text-center text-red-400/70">{s.unexcused}</td>
                    <td className="px-2 py-3 text-center font-bold text-red-400">{netMungesa}</td>
                    <td className="px-5 py-3 text-right font-bold text-orange-400">{formatCurrency(pay)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Seksioni i Pushimeve */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Plane className="w-4 h-4 text-purple-400" />
              Pushimet e Punëtorëve
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              14 ditë në vit për secilin. Kur janë në pushim, nuk caktohen në punë.
            </p>
          </div>
          {canEdit && (
            <button
              onClick={() => setShowVacationDialog(true)}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" />
              Shto Pushim
            </button>
          )}
        </div>

        {/* Pushimet aktive sot */}
        {activeVacations.length > 0 && (
          <div className="p-4 border-b border-border bg-purple-500/5">
            <p className="text-xs font-semibold text-purple-400 mb-2">Në pushim sot ({new Date(selectedDate).toLocaleDateString("sq-AL")}):</p>
            <div className="flex flex-wrap gap-2">
              {activeVacations.map((v) => (
                <span key={v.id} className="text-xs px-2 py-1 rounded-md bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  {v.worker?.name || "?"}
                </span>
              ))}
            </div>
          </div>
        )}

        {vacations.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Asnjë pushim i regjistruar.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase text-muted-foreground bg-secondary/30">
                  <th className="px-5 py-3 font-medium">Punëtori</th>
                  <th className="px-3 py-3 font-medium">Nga</th>
                  <th className="px-3 py-3 font-medium">Deri</th>
                  <th className="px-3 py-3 font-medium text-center">Total Ditë</th>
                  <th className="px-3 py-3 font-medium text-center">Ditë Pune (editueshme)</th>
                  <th className="px-3 py-3 font-medium">Shënime</th>
                  {canEdit && <th className="px-3 py-3" />}
                </tr>
              </thead>
              <tbody>
                {vacations.map((v) => {
                  const start = new Date(v.startDate);
                  const end = new Date(v.endDate);
                  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                  const workDays = v.workDays ?? totalDays;
                  const isEditing = editingDaysId === v.id;
                  return (
                    <tr key={v.id} className="border-t border-border">
                      <td className="px-5 py-3 text-foreground">{v.worker?.name || "?"}</td>
                      <td className="px-3 py-3 text-muted-foreground">{start.toLocaleDateString("sq-AL")}</td>
                      <td className="px-3 py-3 text-muted-foreground">{end.toLocaleDateString("sq-AL")}</td>
                      <td className="px-3 py-3 text-center text-muted-foreground">{totalDays}</td>
                      <td className="px-3 py-3 text-center">
                        {isEditing && canEdit ? (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min="0"
                              value={editingDaysValue}
                              onChange={(e) => setEditingDaysValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveDaysEdit(v.id);
                                if (e.key === "Escape") setEditingDaysId(null);
                              }}
                              className="w-16 bg-secondary border border-border rounded px-2 py-1 text-xs text-center text-foreground focus:outline-none focus:border-purple-500"
                              autoFocus
                            />
                            <button onClick={() => saveDaysEdit(v.id)} className="p-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30">
                              <Save className="w-3 h-3" />
                            </button>
                            <button onClick={() => setEditingDaysId(null)} className="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            disabled={!canEdit}
                            onClick={() => { setEditingDaysId(v.id); setEditingDaysValue(String(workDays)); }}
                            className={cn(
                              "px-3 py-1 rounded text-purple-400 font-semibold inline-flex items-center gap-1.5",
                              canEdit && "hover:bg-purple-500/10 cursor-pointer"
                            )}
                            title={canEdit ? "Kliko për të edituar" : ""}
                          >
                            {workDays}
                            {canEdit && <Edit3 className="w-3 h-3 opacity-60" />}
                          </button>
                        )}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground text-xs">{v.notes || "-"}</td>
                      {canEdit && (
                        <td className="px-3 py-3">
                          <button
                            onClick={() => deleteVacation(v.id)}
                            className="p-1.5 rounded-md hover:bg-red-400/10 text-muted-foreground hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dialog për shtim pushimi */}
      {showVacationDialog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Shto Pushim</h3>
              <button onClick={() => setShowVacationDialog(false)} className="p-1 rounded hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">Punëtori *</label>
              <select value={vacWorkerId} onChange={(e) => setVacWorkerId(e.target.value)} className="input-field">
                <option value="">— Zgjedh punëtorin —</option>
                {activeWorkers.map((w) => (
                  <option key={w.id} value={w.id}>{w.name} ({w.position})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Nga *</label>
                <input type="date" value={vacStart} onChange={(e) => setVacStart(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Deri *</label>
                <input type="date" value={vacEnd} onChange={(e) => setVacEnd(e.target.value)} className="input-field" />
              </div>
            </div>

            {vacStart && vacEnd && (
              <div className="text-xs text-muted-foreground bg-secondary/30 rounded-lg p-2 space-y-1">
                <div>Total periudha: <span className="text-foreground font-medium">{Math.ceil((new Date(vacEnd).getTime() - new Date(vacStart).getTime()) / (1000 * 60 * 60 * 24)) + 1} ditë kalendarike</span></div>
                <div>Ditë pune të llogaritura (Hen-Pre): <span className="text-purple-400 font-medium">{calcWorkDays(vacStart, vacEnd)} ditë</span></div>
              </div>
            )}

            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Ditë pune që humben *
                <span className="text-[10px] text-muted-foreground/70 ml-1">(lëre bosh për të përdorur llogaritjen automatike)</span>
              </label>
              <input
                type="number"
                min="0"
                value={vacWorkDays}
                onChange={(e) => setVacWorkDays(e.target.value)}
                placeholder={vacStart && vacEnd ? `${calcWorkDays(vacStart, vacEnd)} (auto)` : "0"}
                className="input-field"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                P.sh. nëse pushimi është 1-17 Gusht (17 ditë kalendarike) por humbasin vetëm 10 ditë pune, shkruaj 10.
              </p>
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">Shënime (opsionale)</label>
              <textarea value={vacNotes} onChange={(e) => setVacNotes(e.target.value)} rows={2} className="input-field" placeholder="P.sh. Pushim verues" />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setShowVacationDialog(false)} className="btn-secondary">Anulo</button>
              <button onClick={saveVacation} disabled={vacSaving} className="btn-primary">
                {vacSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Ruaj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
