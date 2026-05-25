"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { FileBarChart, ChevronDown, Download, Wallet, FolderCheck, Hammer, Package, Receipt, Calendar } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Props {
  initialData: any;
  initialYear: number;
  initialHalf: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  MATERIALS: "Materiale",
  TRANSPORT: "Transport",
  SALARIES: "Paga",
  RENT: "Qira",
  ELECTRICITY: "Rrymë",
  INTERNET: "Internet",
  ADMIN_SALARIES: "Paga adm.",
  MAINTENANCE: "Mirëmbajtje",
  VEHICLES: "Automjete",
  MARKETING: "Marketing",
  INSURANCE: "Sigurim",
  OTHER: "Tjetër",
  FUEL: "Karburant",
  EQUIPMENT: "Pajisje",
  FOOD: "Ushqim",
  ACCOMMODATION: "Akomodim",
};

export default function HalfYearReport({ initialData, initialYear, initialHalf }: Props) {
  const [data, setData] = useState(initialData);
  const [year, setYear] = useState(initialYear);
  const [half, setHalf] = useState(initialHalf);
  const [loading, setLoading] = useState(false);

  async function loadReport(y: number, h: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/half-year?year=${y}&half=${h}`);
      if (!res.ok) throw new Error();
      const d = await res.json();
      setData(d);
      setYear(y);
      setHalf(h);
    } catch {
      toast.error("Gabim gjate ngarkimit");
    } finally {
      setLoading(false);
    }
  }

  function exportCSV() {
    const lines: string[] = [];
    lines.push(`Raport: ${data.period.label}`);
    lines.push("");
    lines.push("--- PERMBLEDHJE ---");
    lines.push(`Shpenzime projekti, ${data.summary.totalProjectExpenses} EUR`);
    lines.push(`Shpenzime te pergjithshme, ${data.summary.totalGeneralExpenses} EUR`);
    lines.push(`Pagesa te marra, ${data.summary.totalPayments} EUR`);
    lines.push(`Projekte te perfunduara, ${data.summary.projectsCompleted}`);
    lines.push(`Prodhime, ${data.summary.productionsCount}`);
    lines.push(`Ore prodhimi, ${data.summary.totalProductionHours}`);
    lines.push("");
    lines.push("--- SHPENZIME PROJEKTI ---");
    lines.push("Data,Projekti,Kategoria,Pershkrim,Shuma");
    data.projectExpenses.forEach((e: any) => {
      lines.push(`${formatDate(e.date)},"${e.project?.name || ""}",${e.category},"${e.description}",${e.amount}`);
    });
    lines.push("");
    lines.push("--- SHPENZIME TE PERGJITHSHME ---");
    lines.push("Periudha,Kategoria,Pershkrim,Projekti,Shuma");
    data.generalExpenses.forEach((e: any) => {
      lines.push(`${e.month}/${e.year},${e.category},"${e.description}","${e.project?.name || "-"}",${e.amount}`);
    });
    lines.push("");
    lines.push("--- PRODHIMI ---");
    lines.push("Data,Artikulli,Sasia,Ore,Punetoret,Statusi");
    data.production.forEach((p: any) => {
      lines.push(`${formatDate(p.startDate)},"${p.itemName}",${p.quantity},${p.estimatedHours},"${p.workers.map((w: any) => w.worker.name).join(", ")}",${p.status}`);
    });
    lines.push("");
    lines.push("--- LEVIZJET E STOKUT ---");
    lines.push("Data,Materiali,Tipi,Sasia,Arsyeja");
    data.stockMovements.forEach((m: any) => {
      lines.push(`${formatDate(m.createdAt)},"${m.stockItem.name}",${m.type},${m.quantity},"${m.reason || ""}"`);
    });

    const csv = lines.join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `raport-${year}-h${half}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV u shkarkua");
  }

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <select
            value={year}
            onChange={(e) => loadReport(parseInt(e.target.value), half)}
            className="input-field w-32"
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <div className="flex bg-secondary/30 rounded-lg p-1">
            <button
              onClick={() => loadReport(year, 1)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                half === 1 ? "bg-orange-500/20 text-orange-400" : "text-muted-foreground"
              }`}
            >
              1 Janar - 30 Qershor
            </button>
            <button
              onClick={() => loadReport(year, 2)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                half === 2 ? "bg-orange-500/20 text-orange-400" : "text-muted-foreground"
              }`}
            >
              1 Korrik - 31 Dhjetor
            </button>
          </div>
        </div>
        <button onClick={exportCSV} className="btn-secondary text-xs">
          <Download className="w-3.5 h-3.5" />
          Eksporto CSV
        </button>
      </div>

      {loading && <p className="text-sm text-muted-foreground text-center py-8">Po ngarkohet...</p>}

      {!loading && (
        <>
          {/* Period title */}
          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground">{data.period.label}</h2>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard
              icon={<Wallet className="w-5 h-5" />}
              label="Shpenzime totale"
              value={formatCurrency(data.summary.totalExpenses)}
              color="text-red-400 bg-red-400/10"
            />
            <SummaryCard
              icon={<Receipt className="w-5 h-5" />}
              label="Pagesa te marra"
              value={formatCurrency(data.summary.totalPayments)}
              color="text-green-400 bg-green-400/10"
            />
            <SummaryCard
              icon={<FolderCheck className="w-5 h-5" />}
              label="Projekte perfunduar"
              value={String(data.summary.projectsCompleted)}
              color="text-orange-400 bg-orange-400/10"
            />
            <SummaryCard
              icon={<Hammer className="w-5 h-5" />}
              label="Prodhime / ore"
              value={`${data.summary.productionsCount} / ${data.summary.totalProductionHours}h`}
              color="text-purple-400 bg-purple-400/10"
            />
          </div>

          {/* Sections */}
          <Section title="Shpenzime projekti" icon={<Wallet />} count={data.projectExpenses.length}>
            <div className="overflow-x-auto"><table className="w-full text-xs min-w-[500px]">
              <thead className="text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="text-left py-2">Data</th>
                  <th className="text-left">Projekti</th>
                  <th className="text-left">Kategoria</th>
                  <th className="text-left">Përshkrimi</th>
                  <th className="text-right">Shuma</th>
                </tr>
              </thead>
              <tbody>
                {data.projectExpenses.length === 0 && <tr><td colSpan={5} className="text-center py-4 text-muted-foreground">Asnjë shpenzim</td></tr>}
                {data.projectExpenses.map((e: any) => (
                  <tr key={e.id} className="border-b border-border/30">
                    <td className="py-2">{formatDate(e.date)}</td>
                    <td>{e.project?.name || "-"}</td>
                    <td>{CATEGORY_LABELS[e.category] || e.category}</td>
                    <td>{e.description}</td>
                    <td className="text-right font-semibold">{formatCurrency(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </Section>

          <Section title="Shpenzime te pergjithshme" icon={<Wallet />} count={data.generalExpenses.length}>
            <div className="overflow-x-auto"><table className="w-full text-xs min-w-[500px]">
              <thead className="text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="text-left py-2">Periudha</th>
                  <th className="text-left">Kategoria</th>
                  <th className="text-left">Përshkrimi</th>
                  <th className="text-left">Projekti</th>
                  <th className="text-right">Shuma</th>
                </tr>
              </thead>
              <tbody>
                {data.generalExpenses.length === 0 && <tr><td colSpan={5} className="text-center py-4 text-muted-foreground">Asnjë shpenzim</td></tr>}
                {data.generalExpenses.map((e: any) => (
                  <tr key={e.id} className="border-b border-border/30">
                    <td className="py-2">{e.month}/{e.year}</td>
                    <td>{CATEGORY_LABELS[e.category] || e.category}</td>
                    <td>{e.description}</td>
                    <td>{e.project?.name || "-"}</td>
                    <td className="text-right font-semibold">{formatCurrency(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </Section>

          <Section title="Projekte te perfunduara" icon={<FolderCheck />} count={data.completedProjects.length}>
            {data.completedProjects.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Asnjë projekt i përfunduar në këtë periudhë</p>
            ) : (
              <div className="space-y-2">
                {data.completedProjects.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between bg-secondary/20 rounded-lg px-3 py-2 text-xs">
                    <div>
                      <p className="font-semibold text-foreground">{p.name}</p>
                      <p className="text-muted-foreground">{p.client} - {p.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-foreground font-semibold">{formatCurrency(p.contractValue)}</p>
                      <p className="text-muted-foreground">{p.expenses.length} shpenzime</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Prodhimi" icon={<Hammer />} count={data.production.length}>
            <div className="overflow-x-auto"><table className="w-full text-xs min-w-[500px]">
              <thead className="text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="text-left py-2">Data</th>
                  <th className="text-left">Artikulli</th>
                  <th className="text-right">Sasia</th>
                  <th className="text-right">Orë</th>
                  <th className="text-left">Punëtorët</th>
                  <th className="text-left">Statusi</th>
                </tr>
              </thead>
              <tbody>
                {data.production.length === 0 && <tr><td colSpan={6} className="text-center py-4 text-muted-foreground">Asnjë prodhim</td></tr>}
                {data.production.map((p: any) => (
                  <tr key={p.id} className="border-b border-border/30">
                    <td className="py-2">{formatDate(p.startDate)}</td>
                    <td className="font-medium">{p.itemName}</td>
                    <td className="text-right">{p.quantity}</td>
                    <td className="text-right">{p.estimatedHours}h</td>
                    <td>{p.workers.map((w: any) => w.worker.name).join(", ") || "-"}</td>
                    <td>{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </Section>

          <Section title="Levizjet e stokut" icon={<Package />} count={data.stockMovements.length}>
            <div className="overflow-x-auto"><table className="w-full text-xs min-w-[500px]">
              <thead className="text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="text-left py-2">Data</th>
                  <th className="text-left">Materiali</th>
                  <th className="text-left">Tipi</th>
                  <th className="text-right">Sasia</th>
                  <th className="text-left">Arsyeja</th>
                </tr>
              </thead>
              <tbody>
                {data.stockMovements.length === 0 && <tr><td colSpan={5} className="text-center py-4 text-muted-foreground">Asnjë lëvizje</td></tr>}
                {data.stockMovements.map((m: any) => (
                  <tr key={m.id} className="border-b border-border/30">
                    <td className="py-2">{formatDate(m.createdAt)}</td>
                    <td className="font-medium">{m.stockItem.name}</td>
                    <td>{m.type}</td>
                    <td className={`text-right ${m.quantity < 0 ? "text-red-400" : "text-green-400"}`}>
                      {m.quantity > 0 ? "+" : ""}{m.quantity} {m.stockItem.unit}
                    </td>
                    <td>{m.reason || m.project?.name || m.production?.itemName || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </Section>
        </>
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value, color }: any) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-base font-bold text-foreground truncate">{value}</p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, count, children }: any) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-card border border-border rounded-xl">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="text-orange-400">{icon}</span>
          <span>{title}</span>
          <span className="text-xs text-muted-foreground bg-secondary rounded-full px-2 py-0.5">{count}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-4 pb-4 overflow-x-auto">{children}</div>}
    </div>
  );
}
