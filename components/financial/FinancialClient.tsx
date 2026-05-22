"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, Wallet, Users, Building2,
  FileDown, FileSpreadsheet, ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, getStatusColor, getStatusLabel, cn } from "@/lib/utils";
import { exportToPDF, exportToExcel } from "@/lib/export";

function formatYAxis(value: number) {
  if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toString();
}

const ChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-card border border-border rounded-xl p-3 shadow-xl text-sm">
        <p className="text-muted-foreground font-medium mb-2">{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-semibold text-foreground ml-auto pl-3">
              {new Intl.NumberFormat("de-DE").format(entry.value)} €
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function FinancialClient({ summary, monthlyData, projectFinancials }: any) {
  const [exporting, setExporting] = useState(false);

  async function handleExport(type: "pdf" | "excel") {
    setExporting(true);
    try {
      if (type === "pdf") {
        exportToPDF(summary, projectFinancials, monthlyData);
        toast.success("Raporti PDF u shkarkua");
      } else {
        await exportToExcel(summary, projectFinancials, monthlyData);
        toast.success("Raporti Excel u shkarkua");
      }
    } catch (err) {
      toast.error("Gabim gjatë eksportimit");
    } finally {
      setExporting(false);
    }
  }

  const metrics = [
    { label: "Të Ardhura Totale", value: summary.totalRevenue, icon: DollarSign, color: "text-green-400 bg-green-400/10" },
    { label: "Shpenzime Projekti", value: summary.totalProjectExpenses, icon: Wallet, color: "text-blue-400 bg-blue-400/10" },
    { label: "Kosto Punëtorësh", value: summary.totalLaborCost, icon: Users, color: "text-purple-400 bg-purple-400/10" },
    { label: "Shpenzime Kompanie", value: summary.totalGeneralExpenses, icon: Building2, color: "text-yellow-400 bg-yellow-400/10" },
  ];

  return (
    <div className="space-y-5">
      {/* Export buttons */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-sm font-semibold text-foreground">Raporti Financiar i Plotë</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport("pdf")}
            disabled={exporting}
            className="btn-secondary disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            Export PDF
          </button>
          <button
            onClick={() => handleExport("excel")}
            disabled={exporting}
            className="btn-secondary disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="stat-card">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-3", m.color)}>
                <Icon className="w-4.5 h-4.5" size={18} />
              </div>
              <p className="text-xl font-bold text-foreground">{formatCurrency(m.value)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{m.label}</p>
            </div>
          );
        })}
      </div>

      {/* Profit cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={cn(
          "rounded-xl p-5 border",
          summary.grossProfit >= 0 ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"
        )}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Fitimi Bruto</p>
              <p className={cn(
                "text-2xl font-bold mt-1",
                summary.grossProfit >= 0 ? "text-green-400" : "text-red-400"
              )}>
                {formatCurrency(summary.grossProfit)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Të ardhura − shpenzime projekti − punëtorë
              </p>
            </div>
            {summary.grossProfit >= 0 ? (
              <TrendingUp className="w-8 h-8 text-green-400/40" />
            ) : (
              <TrendingDown className="w-8 h-8 text-red-400/40" />
            )}
          </div>
        </div>

        <div className={cn(
          "rounded-xl p-5 border",
          summary.netProfit >= 0 ? "bg-orange-500/5 border-orange-500/30" : "bg-red-500/5 border-red-500/20"
        )}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Fitimi Neto</p>
              <p className={cn(
                "text-2xl font-bold mt-1",
                summary.netProfit >= 0 ? "text-orange-400" : "text-red-400"
              )}>
                {formatCurrency(summary.netProfit)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Fitimi bruto − shpenzime kompanie
              </p>
            </div>
            {summary.netProfit >= 0 ? (
              <TrendingUp className="w-8 h-8 text-orange-400/40" />
            ) : (
              <TrendingDown className="w-8 h-8 text-red-400/40" />
            )}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Të Ardhura vs Shpenzime</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,14.9%)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "hsl(0,0%,63.9%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatYAxis} tick={{ fill: "hsl(0,0%,63.9%)", fontSize: 11 }} axisLine={false} tickLine={false} width={45} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(0,0%,15%)" }} />
              <Bar dataKey="revenue" name="Të ardhura" fill="#f97316" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Shpenzime" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Trendi i Fitimit Mujor</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={monthlyData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,14.9%)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "hsl(0,0%,63.9%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatYAxis} tick={{ fill: "hsl(0,0%,63.9%)", fontSize: 11 }} axisLine={false} tickLine={false} width={45} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="profit" name="Fitim" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 3, fill: "#22c55e" }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per-project profitability */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Profitabiliteti sipas Projektit</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="table-header px-4 py-3 text-left">Projekti</th>
              <th className="table-header px-4 py-3 text-left">Statusi</th>
              <th className="table-header px-4 py-3 text-right">Kontrata</th>
              <th className="table-header px-4 py-3 text-right">Kosto Totale</th>
              <th className="table-header px-4 py-3 text-right">Fitimi</th>
              <th className="table-header px-4 py-3 text-right">Marzhi</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {projectFinancials.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">
                  Asnjë projekt
                </td>
              </tr>
            ) : (
              projectFinancials.map((p: any) => {
                const margin = p.contractValue > 0 ? (p.profit / p.contractValue) * 100 : 0;
                return (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.client}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${getStatusColor(p.status)}`}>
                        {getStatusLabel(p.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground text-right">
                      {formatCurrency(p.contractValue)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground text-right">
                      {formatCurrency(p.totalCost)}
                    </td>
                    <td className={cn(
                      "px-4 py-3 text-sm font-semibold text-right",
                      p.profit >= 0 ? "text-green-400" : "text-red-400"
                    )}>
                      {formatCurrency(p.profit)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full",
                        margin >= 0 ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"
                      )}>
                        {margin.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/projects/${p.id}`}
                        className="inline-flex p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
