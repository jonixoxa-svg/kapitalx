"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, Hammer, FolderKanban,
  X, Save, Edit, StickyNote, Trash2,
} from "lucide-react";
import { cn, formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";

type ViewType = "week" | "month" | "6month";

interface Milestone {
  id: string;
  projectId: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
  completed: boolean;
  order: number;
}

interface Project {
  id: string;
  name: string;
  client: string;
  status: string;
  startDate: string;
  endDate: string | null;
  milestones: Milestone[];
  workerAssignments: { worker: { id: string; name: string } }[];
}

interface Production {
  id: string;
  itemName: string;
  quantity: number;
  estimatedHours: number;
  startDate: string;
  endDate: string | null;
  status: string;
  workers: { worker: { id: string; name: string } }[];
}

interface Worker {
  id: string;
  name: string;
  position: string;
}

interface WorkerVacation {
  id: string;
  workerId: string;
  startDate: string | Date;
  endDate: string | Date;
  notes: string | null;
  worker?: { id: string; name: string; position: string };
}

interface Props {
  projects: Project[];
  productions: Production[];
  workers: Worker[];
  vacations?: WorkerVacation[];
  userRole: string;
}

// Helpers
function startOfWeek(d: Date) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday-start
  return new Date(d.getFullYear(), d.getMonth(), diff);
}
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function addMonths(d: Date, n: number) { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; }
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function dateOnly(d: Date | string) { const x = new Date(d); return new Date(x.getFullYear(), x.getMonth(), x.getDate()); }
function sameDay(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function fmtShort(d: Date) { return d.toLocaleDateString("sq-AL", { day: "numeric", month: "short" }); }
function monthName(d: Date) { return d.toLocaleDateString("sq-AL", { month: "long", year: "numeric" }); }

interface CalendarEvent {
  id: string;
  type: "project" | "milestone" | "production" | "vacation";
  title: string;
  subtitle?: string;
  start: Date;
  end: Date;
  color: string;
  raw: any;
}

export default function ProjectCalendar({ projects, productions, workers, vacations = [], userRole }: Props) {
  const router = useRouter();
  const [view, setView] = useState<ViewType>("month");
  const [refDate, setRefDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [notes, setNotes] = useState<Record<string, { id: string; text: string }>>({});
  const canEdit = userRole !== "VIEWER";

  // Load notes for the visible period
  useEffect(() => {
    const from = refDate.toISOString().slice(0, 10);
    const toEnd = addMonths(refDate, view === "6month" ? 6 : view === "month" ? 1 : 1);
    const to = toEnd.toISOString().slice(0, 10);
    fetch(`/api/calendar-notes?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((data: any[]) => {
        const map: Record<string, { id: string; text: string }> = {};
        for (const n of data) {
          const key = new Date(n.date).toISOString().slice(0, 10);
          map[key] = { id: n.id, text: n.text };
        }
        setNotes(map);
      })
      .catch(() => {});
  }, [refDate, view, selectedDay]);

  function dayKey(d: Date) {
    return d.toISOString().slice(0, 10);
  }

  // Build events
  const events: CalendarEvent[] = useMemo(() => {
    const evs: CalendarEvent[] = [];

    projects.forEach((p) => {
      const start = dateOnly(p.startDate);
      const end = p.endDate ? dateOnly(p.endDate) : addDays(start, 30);
      evs.push({
        id: `project-${p.id}`,
        type: "project",
        title: p.name,
        subtitle: p.client,
        start,
        end,
        color: "bg-orange-500/20 border-orange-500/50 text-orange-300",
        raw: p,
      });

      p.milestones.forEach((m) => {
        if (m.startDate) {
          const ms = dateOnly(m.startDate);
          const me = m.endDate ? dateOnly(m.endDate) : ms;
          evs.push({
            id: `milestone-${m.id}`,
            type: "milestone",
            title: m.title,
            subtitle: p.name,
            start: ms,
            end: me,
            color: m.completed
              ? "bg-green-500/20 border-green-500/50 text-green-300"
              : "bg-blue-500/20 border-blue-500/50 text-blue-300",
            raw: { ...m, projectName: p.name },
          });
        }
      });
    });

    productions.forEach((pr) => {
      const start = dateOnly(pr.startDate);
      const end = pr.endDate ? dateOnly(pr.endDate) : start;
      evs.push({
        id: `production-${pr.id}`,
        type: "production",
        title: `Prodhim: ${pr.itemName}`,
        subtitle: `${pr.quantity} cope • ${pr.estimatedHours} orë`,
        start,
        end,
        color: "bg-purple-500/20 border-purple-500/50 text-purple-300",
        raw: pr,
      });
    });

    // Pushimet e punëtorëve
    vacations.forEach((v) => {
      evs.push({
        id: `vacation-${v.id}`,
        type: "vacation",
        title: `Pushim: ${v.worker?.name || "?"}`,
        subtitle: v.notes || undefined,
        start: dateOnly(v.startDate),
        end: dateOnly(v.endDate),
        color: "bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-300",
        raw: v,
      });
    });

    return evs;
  }, [projects, productions, vacations]);

  // Period
  const period = useMemo(() => {
    if (view === "week") {
      const start = startOfWeek(refDate);
      return { start, end: addDays(start, 6) };
    }
    if (view === "month") {
      const start = startOfMonth(refDate);
      return { start, end: endOfMonth(refDate) };
    }
    // 6month
    const start = startOfMonth(refDate);
    const end = endOfMonth(addMonths(start, 5));
    return { start, end };
  }, [view, refDate]);

  // Filter events in period
  const visibleEvents = events.filter((e) => e.end >= period.start && e.start <= period.end);

  function navigate(dir: number) {
    if (view === "week") setRefDate((d) => addDays(d, 7 * dir));
    else if (view === "month") setRefDate((d) => addMonths(d, dir));
    else setRefDate((d) => addMonths(d, 6 * dir));
  }

  function todayLabel() {
    if (view === "week") {
      const s = startOfWeek(refDate);
      return `${fmtShort(s)} - ${fmtShort(addDays(s, 6))}`;
    }
    if (view === "month") return monthName(refDate);
    return `${monthName(refDate)} - ${monthName(addMonths(refDate, 5))}`;
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-card border border-border rounded-xl p-3">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="btn-secondary text-xs">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setRefDate(new Date())} className="btn-secondary text-xs">Sot</button>
          <button onClick={() => navigate(1)} className="btn-secondary text-xs">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <span className="text-sm font-semibold text-foreground ml-2">{todayLabel()}</span>
        </div>
        <div className="flex items-center gap-1 bg-secondary/30 rounded-lg p-1">
          {(["week", "month", "6month"] as ViewType[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                view === v ? "bg-orange-500/20 text-orange-400" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {v === "week" ? "Javore" : v === "month" ? "Mujore" : "6-Mujore"}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap text-xs">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-orange-500/40" /> Projekt</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500/40" /> Faze</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500/40" /> Faze e perfunduar</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-purple-500/40" /> Prodhim</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-fuchsia-500/40" /> Pushim punëtori</span>
      </div>

      {/* Calendar */}
      {view === "week" && <WeekView start={period.start} events={visibleEvents} notes={notes} onSelectEvent={setSelectedEvent} onSelectDay={setSelectedDay} />}
      {view === "month" && <MonthView refDate={refDate} events={visibleEvents} notes={notes} onSelectEvent={setSelectedEvent} onSelectDay={setSelectedDay} />}
      {view === "6month" && <SixMonthView refDate={refDate} events={visibleEvents} onSelect={setSelectedEvent} />}

      {selectedEvent && (
        <EventDialog
          event={selectedEvent}
          workers={workers}
          canEdit={canEdit}
          onClose={() => setSelectedEvent(null)}
          onSaved={() => { setSelectedEvent(null); router.refresh(); }}
        />
      )}

      {selectedDay && (
        <DayDialog
          day={selectedDay}
          events={visibleEvents.filter((e) => selectedDay >= e.start && selectedDay <= e.end)}
          initialNote={notes[dayKey(selectedDay)]?.text || ""}
          canEdit={canEdit}
          onClose={() => setSelectedDay(null)}
          onEventClick={(e) => { setSelectedDay(null); setSelectedEvent(e); }}
        />
      )}
    </div>
  );
}

// ====== WEEK VIEW ======
function WeekView({ start, events, notes, onSelectEvent, onSelectDay }: {
  start: Date;
  events: CalendarEvent[];
  notes: Record<string, { id: string; text: string }>;
  onSelectEvent: (e: CalendarEvent) => void;
  onSelectDay: (d: Date) => void;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const today = new Date();

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
      <div className="grid grid-cols-7 min-w-[700px]">
        {days.map((d) => {
          const key = d.toISOString().slice(0, 10);
          const note = notes[key];
          return (
            <div
              key={d.toISOString()}
              onClick={() => onSelectDay(d)}
              className={cn(
                "border-r border-b border-border last:border-r-0 p-2 min-h-[200px] cursor-pointer hover:bg-secondary/30 transition-colors relative",
                sameDay(d, today) && "bg-orange-500/5"
              )}
              title="Kliko per ta zmadhuar dhe shtuar shenime"
            >
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase">{d.toLocaleDateString("sq-AL", { weekday: "short" })}</div>
                  <div className={cn(
                    "text-sm font-semibold",
                    sameDay(d, today) ? "text-orange-400" : "text-foreground"
                  )}>{d.getDate()}</div>
                </div>
                {note && <StickyNote className="w-3.5 h-3.5 text-yellow-400" />}
              </div>
              <div className="space-y-1">
                {events.filter((e) => d >= e.start && d <= e.end).map((e) => (
                  <button
                    key={e.id + d.toISOString()}
                    onClick={(ev) => { ev.stopPropagation(); onSelectEvent(e); }}
                    className={cn("w-full text-left text-[10px] px-1.5 py-1 rounded border truncate", e.color)}
                    title={e.title}
                  >
                    {e.title}
                  </button>
                ))}
                {note && (
                  <div className="text-[10px] text-yellow-300 bg-yellow-500/10 border border-yellow-500/30 rounded px-1.5 py-1 line-clamp-2">
                    {note.text}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}

// ====== MONTH VIEW ======
function MonthView({ refDate, events, notes, onSelectEvent, onSelectDay }: {
  refDate: Date;
  events: CalendarEvent[];
  notes: Record<string, { id: string; text: string }>;
  onSelectEvent: (e: CalendarEvent) => void;
  onSelectDay: (d: Date) => void;
}) {
  const monthStart = startOfMonth(refDate);
  const monthEnd = endOfMonth(refDate);
  const gridStart = startOfWeek(monthStart);
  const totalDays = Math.ceil((monthEnd.getTime() - gridStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const weeks = Math.ceil(totalDays / 7);
  const cells = Array.from({ length: weeks * 7 }, (_, i) => addDays(gridStart, i));
  const today = new Date();

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
      <div className="min-w-[700px]">
      <div className="grid grid-cols-7 border-b border-border">
        {["Hën", "Mar", "Mër", "Enj", "Pre", "Sht", "Die"].map((d) => (
          <div key={d} className="px-2 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium text-center">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d) => {
          const inMonth = d.getMonth() === refDate.getMonth();
          const dayEvents = events.filter((e) => d >= e.start && d <= e.end);
          const key = d.toISOString().slice(0, 10);
          const note = notes[key];
          return (
            <div
              key={d.toISOString()}
              onClick={() => onSelectDay(d)}
              className={cn(
                "border-r border-b border-border p-1.5 min-h-[110px] cursor-pointer hover:bg-secondary/30 transition-colors relative",
                !inMonth && "bg-secondary/20",
                sameDay(d, today) && "bg-orange-500/5"
              )}
              title="Kliko per ta zmadhuar dhe shtuar shenime"
            >
              <div className="flex items-center justify-between mb-1">
                <div className={cn(
                  "text-xs font-medium",
                  sameDay(d, today) ? "text-orange-400 font-bold" : inMonth ? "text-foreground" : "text-muted-foreground/40"
                )}>{d.getDate()}</div>
                {note && <StickyNote className="w-3 h-3 text-yellow-400" />}
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 2).map((e) => (
                  <button
                    key={e.id + d.toISOString()}
                    onClick={(ev) => { ev.stopPropagation(); onSelectEvent(e); }}
                    className={cn("w-full text-left text-[9px] px-1 py-0.5 rounded border truncate", e.color)}
                    title={e.title}
                  >
                    {e.title}
                  </button>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-[9px] text-muted-foreground px-1">+{dayEvents.length - 2} të tjera</div>
                )}
                {note && (
                  <div className="text-[9px] text-yellow-300 bg-yellow-500/10 border border-yellow-500/30 rounded px-1 py-0.5 line-clamp-2">
                    {note.text}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      </div>
      </div>
    </div>
  );
}

// ====== 6-MONTH VIEW ======
function SixMonthView({ refDate, events, onSelect }: { refDate: Date; events: CalendarEvent[]; onSelect: (e: CalendarEvent) => void }) {
  const months = Array.from({ length: 6 }, (_, i) => addMonths(refDate, i));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {months.map((m) => {
        const monthEvents = events.filter((e) => {
          const ms = startOfMonth(m);
          const me = endOfMonth(m);
          return e.end >= ms && e.start <= me;
        });
        return (
          <div key={m.toISOString()} className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground capitalize mb-3">{monthName(m)}</h3>
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
              {monthEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Asnjë event</p>
              ) : (
                monthEvents.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => onSelect(e)}
                    className={cn("w-full text-left text-xs px-2 py-1.5 rounded-lg border", e.color)}
                  >
                    <div className="font-medium truncate">{e.title}</div>
                    <div className="text-[10px] opacity-70">{fmtShort(e.start)}{!sameDay(e.start, e.end) ? ` → ${fmtShort(e.end)}` : ""}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ====== DAY DIALOG (Expanded day view with notes) ======
function DayDialog({ day, events, initialNote, canEdit, onClose, onEventClick }: {
  day: Date;
  events: CalendarEvent[];
  initialNote: string;
  canEdit: boolean;
  onClose: () => void;
  onEventClick: (e: CalendarEvent) => void;
}) {
  const [note, setNote] = useState(initialNote);
  const [saving, setSaving] = useState(false);
  const today = new Date();
  const isToday = sameDay(day, today);

  async function saveNote() {
    setSaving(true);
    try {
      const res = await fetch("/api/calendar-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: day.toISOString().slice(0, 10), text: note }),
      });
      if (!res.ok) throw new Error();
      toast.success(note.trim() ? "Shenimi u ruajt" : "Shenimi u fshi");
      onClose();
    } catch {
      toast.error("Gabim gjate ruajtjes");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - big and prominent */}
        <div className="flex items-start justify-between mb-5 pb-4 border-b border-border">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              {day.toLocaleDateString("sq-AL", { weekday: "long" })}
            </div>
            <div className={cn(
              "text-3xl font-bold mt-1",
              isToday ? "text-orange-400" : "text-foreground"
            )}>
              {day.getDate()} {day.toLocaleDateString("sq-AL", { month: "long" })} {day.getFullYear()}
              {isToday && <span className="ml-2 text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full">Sot</span>}
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Events */}
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-orange-400" />
            Çfar&euml; ka k&euml;t&euml; dit&euml;
          </h3>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground italic px-3 py-4 bg-secondary/20 rounded-lg text-center">
              Asnj&euml; event i regjistruar p&euml;r k&euml;t&euml; dit&euml;
            </p>
          ) : (
            <div className="space-y-2">
              {events.map((e) => (
                <button
                  key={e.id}
                  onClick={() => onEventClick(e)}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-xl border transition-all hover:scale-[1.01]",
                    e.color
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {e.type === "project" && <FolderKanban className="w-5 h-5" />}
                      {e.type === "milestone" && <CalendarIcon className="w-5 h-5" />}
                      {e.type === "production" && <Hammer className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{e.title}</div>
                      {e.subtitle && <div className="text-xs opacity-80 mt-0.5">{e.subtitle}</div>}
                      <div className="text-[10px] opacity-60 mt-1">
                        {fmtShort(e.start)}{!sameDay(e.start, e.end) ? ` → ${fmtShort(e.end)}` : ""}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notes - big editable area */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <StickyNote className="w-4 h-4 text-yellow-400" />
            Sh&euml;nime p&euml;r k&euml;t&euml; dit&euml;
          </h3>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={!canEdit}
            rows={8}
            placeholder={canEdit ? "Shkruaj çfardo: detyra, takime, kujtues, ngjarje..." : "Vetem shikim"}
            className="w-full bg-secondary/40 border border-border focus:border-yellow-500/40 focus:outline-none rounded-xl px-4 py-3 text-base text-foreground placeholder:text-muted-foreground resize-none"
            style={{ lineHeight: "1.6" }}
          />
          {canEdit && (
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={saveNote}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-medium rounded-lg text-sm"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? "Po ruhet..." : "Ruaj shenimin"}
              </button>
              {initialNote && (
                <button
                  onClick={() => { setNote(""); }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium rounded-lg text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Fshi
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ====== EVENT DIALOG ======
function EventDialog({ event, workers, canEdit, onClose, onSaved }: {
  event: CalendarEvent;
  workers: Worker[];
  canEdit: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [edit, setEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [startDate, setStartDate] = useState(event.start.toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(event.end.toISOString().slice(0, 10));
  const [workerIds, setWorkerIds] = useState<string[]>(
    event.type === "production" ? event.raw.workers.map((w: any) => w.worker.id) : []
  );

  async function handleSave() {
    setSaving(true);
    try {
      if (event.type === "milestone") {
        await fetch(`/api/milestones/${event.raw.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ startDate, endDate }),
        });
      } else if (event.type === "production") {
        await fetch(`/api/production/${event.raw.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ startDate, endDate, workerIds }),
        });
      } else if (event.type === "project") {
        await fetch(`/api/projects/${event.raw.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ startDate, endDate }),
        });
      }
      toast.success("U perditesua");
      onSaved();
    } catch {
      toast.error("Gabim");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl p-5 w-full max-w-md space-y-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {event.type === "project" && <FolderKanban className="w-5 h-5 text-orange-400" />}
            {event.type === "milestone" && <CalendarIcon className="w-5 h-5 text-blue-400" />}
            {event.type === "production" && <Hammer className="w-5 h-5 text-purple-400" />}
            <div>
              <h3 className="text-sm font-semibold text-foreground">{event.title}</h3>
              {event.subtitle && <p className="text-xs text-muted-foreground">{event.subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="pt-3 border-t border-border/50 space-y-3">
          {!edit ? (
            <>
              <div className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Periudha:</span> {fmtShort(event.start)}
                {!sameDay(event.start, event.end) ? ` → ${fmtShort(event.end)}` : ""}
              </div>
              {event.type === "production" && event.raw.workers.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Punëtorët:</span>{" "}
                  {event.raw.workers.map((w: any) => w.worker.name).join(", ")}
                </div>
              )}
              {canEdit && event.type !== "project" && (
                <button onClick={() => setEdit(true)} className="btn-secondary text-xs">
                  <Edit className="w-3.5 h-3.5" />
                  Edito datat{event.type === "production" ? " / punëtorët" : ""}
                </button>
              )}
              {canEdit && event.type === "project" && (
                <button onClick={() => setEdit(true)} className="btn-secondary text-xs">
                  <Edit className="w-3.5 h-3.5" />
                  Edito datat
                </button>
              )}
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Data fillimit</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Data mbarimit</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input-field" />
                </div>
              </div>

              {event.type === "production" && (
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Punëtorët</label>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-secondary/30 rounded-lg">
                    {workers.map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setWorkerIds((arr) => arr.includes(w.id) ? arr.filter((x) => x !== w.id) : [...arr, w.id])}
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full border",
                          workerIds.includes(w.id) ? "bg-orange-500/20 border-orange-500/40 text-orange-400" : "bg-secondary border-border text-muted-foreground"
                        )}
                      >
                        {w.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button onClick={handleSave} disabled={saving} className="btn-primary text-xs disabled:opacity-50">
                  <Save className="w-3.5 h-3.5" />
                  {saving ? "Po ruaj..." : "Ruaj"}
                </button>
                <button onClick={() => setEdit(false)} className="btn-secondary text-xs">Anulo</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
