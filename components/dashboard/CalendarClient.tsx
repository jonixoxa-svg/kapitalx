"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MapPin, Clock } from "lucide-react";
import { getStatusColor, getStatusLabel, getMonthName, formatDate, cn } from "@/lib/utils";

interface CalProject {
  id: string;
  name: string;
  client: string;
  status: string;
  startDate: string | Date;
  endDate: string | Date | null;
  progress: number;
}

const WEEKDAYS = ["Hën", "Mar", "Mër", "Enj", "Pre", "Sht", "Die"];

export default function CalendarClient({ projects }: { projects: CalProject[] }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  // Monday-first offset
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function projectsOnDay(day: number) {
    const date = new Date(year, month, day);
    return projects.filter((p) => {
      const start = new Date(p.startDate);
      const end = p.endDate ? new Date(p.endDate) : start;
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end;
    });
  }

  // Projects in this month for the list
  const monthProjects = projects.filter((p) => {
    const start = new Date(p.startDate);
    const end = p.endDate ? new Date(p.endDate) : start;
    return (
      (start.getFullYear() === year && start.getMonth() === month) ||
      (end.getFullYear() === year && end.getMonth() === month) ||
      (start < firstDay && end > lastDay)
    );
  });

  function prevMonth() {
    setViewDate(new Date(year, month - 1, 1));
  }
  function nextMonth() {
    setViewDate(new Date(year, month + 1, 1));
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Calendar */}
      <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-foreground">
            {getMonthName(month + 1)} {year}
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1))}
              className="px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              Sot
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={i} className="aspect-square" />;

            const dayProjects = projectsOnDay(day);
            const isToday =
              day === today.getDate() &&
              month === today.getMonth() &&
              year === today.getFullYear();

            return (
              <div
                key={i}
                className={cn(
                  "aspect-square rounded-lg p-1.5 border transition-colors",
                  isToday
                    ? "border-orange-500/50 bg-orange-500/5"
                    : "border-border/40 hover:border-border"
                )}
              >
                <div className={cn(
                  "text-xs font-medium",
                  isToday ? "text-orange-400" : "text-muted-foreground"
                )}>
                  {day}
                </div>
                <div className="mt-0.5 space-y-0.5">
                  {dayProjects.slice(0, 2).map((p) => (
                    <div
                      key={p.id}
                      className={cn(
                        "text-[8px] leading-tight rounded px-1 py-0.5 truncate",
                        p.status === "ACTIVE" ? "bg-green-400/20 text-green-300" :
                        p.status === "COMPLETED" ? "bg-blue-400/20 text-blue-300" :
                        p.status === "PLANNED" ? "bg-yellow-400/20 text-yellow-300" :
                        "bg-red-400/20 text-red-300"
                      )}
                      title={p.name}
                    >
                      {p.name}
                    </div>
                  ))}
                  {dayProjects.length > 2 && (
                    <div className="text-[8px] text-muted-foreground px-1">
                      +{dayProjects.length - 2}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Side: Projects this month */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Projekte në {getMonthName(month + 1)}
        </h3>
        <div className="space-y-2">
          {monthProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Asnjë projekt këtë muaj
            </p>
          ) : (
            monthProjects.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="block bg-secondary/40 hover:bg-secondary rounded-lg p-3 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                  <span className={`badge text-[10px] ${getStatusColor(p.status)}`}>
                    {getStatusLabel(p.status)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{p.client}</p>
                <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {formatDate(p.startDate)}
                  {p.endDate && ` → ${formatDate(p.endDate)}`}
                </div>
                <div className="h-1 bg-background rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
