"use client";

import { useState, useEffect, useMemo } from "react";
import { Calendar, CheckCircle2, AlertCircle, BadgeCheck, XCircle, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  cn,
  formatCurrency,
  getAttendanceStatusLabel,
  getAttendanceStatusColor,
  isAttendanceDayPaid,
} from "@/lib/utils";

type Worker = {
  id: string;
  name: string;
  position: string;
  dailyRate: number;
  active: boolean;
};

type Project = { id: string; name: string };

type AttendanceRecord = {
  id: string;
  workerId: string;
  date: string;
  status: "PRESENT" | "SICK" | "PAID_LEAVE" | "UNEXCUSED";
  projectId: string | null;
  notes: string | null;
};

const STATUSES: AttendanceRecord["status"][] = ["PRESENT", "SICK", "PAID_LEAVE", "UNEXCUSED"];

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

  const canEdit = userRole !== "VIEWER";
  const activeWorkers = workers.filter((w) => w.active);

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

  // Fetch last 30 days for the bottom summary
  useEffect(() => {
    const to = todayISO();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30);
    const from = fromDate.toISOString().slice(0, 10);
    fetch(`/api/attendance?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((data) => setHistory(data));
  }, [records]);

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
    const byWorker: Record<string, { present: number; sick: number; paidLeave: number; unexcused: number }> = {};
    for (const r of history) {
      if (!byWorker[r.workerId]) byWorker[r.workerId] = { present: 0, sick: 0, paidLeave: 0, unexcused: 0 };
      const b = byWorker[r.workerId];
      if (r.status === "PRESENT") b.present++;
      else if (r.status === "SICK") b.sick++;
      else if (r.status === "PAID_LEAVE") b.paidLeave++;
      else if (r.status === "UNEXCUSED") b.unexcused++;
    }
    return byWorker;
  }, [history]);

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

      {/* Last 30 days summary */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Përmbledhje 30 ditët e fundit</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Pagohen vetëm ditët <span className="text-green-400">Prezent</span> dhe <span className="text-blue-400">Leje me pagesë</span>.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase text-muted-foreground bg-secondary/30">
                <th className="px-5 py-3 font-medium">Punëtori</th>
                <th className="px-3 py-3 font-medium text-center">Prezent</th>
                <th className="px-3 py-3 font-medium text-center">Sëmurë</th>
                <th className="px-3 py-3 font-medium text-center">Leje</th>
                <th className="px-3 py-3 font-medium text-center">Mungesë</th>
                <th className="px-5 py-3 font-medium text-right">Pagesa e llogaritur</th>
              </tr>
            </thead>
            <tbody>
              {activeWorkers.map((w) => {
                const s = summary[w.id] || { present: 0, sick: 0, paidLeave: 0, unexcused: 0 };
                const paidDays = s.present + s.paidLeave;
                const pay = paidDays * w.dailyRate;
                return (
                  <tr key={w.id} className="border-t border-border">
                    <td className="px-5 py-3 text-foreground">{w.name}</td>
                    <td className="px-3 py-3 text-center text-green-400 font-semibold">{s.present}</td>
                    <td className="px-3 py-3 text-center text-yellow-400">{s.sick}</td>
                    <td className="px-3 py-3 text-center text-blue-400">{s.paidLeave}</td>
                    <td className="px-3 py-3 text-center text-red-400">{s.unexcused}</td>
                    <td className="px-5 py-3 text-right font-bold text-orange-400">{formatCurrency(pay)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
