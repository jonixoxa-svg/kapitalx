"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Target,
  TrendingUp,
  Edit3,
  Check,
  X,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Receipt,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";

interface Props {
  monthlyExpensesAverage: number;
  targetMonthlyProfit: number;
  actualMonthlyRevenue: number;
  actualMonthlyExpenses: number;
  canEdit: boolean;
}

export default function MonthlyTargetSection({
  monthlyExpensesAverage,
  targetMonthlyProfit,
  actualMonthlyRevenue,
  actualMonthlyExpenses,
  canEdit,
}: Props) {
  const router = useRouter();
  const [editingExpenses, setEditingExpenses] = useState(false);
  const [editingProfit, setEditingProfit] = useState(false);
  const [expensesValue, setExpensesValue] = useState(String(monthlyExpensesAverage));
  const [profitValue, setProfitValue] = useState(String(targetMonthlyProfit));
  const [saving, setSaving] = useState(false);

  // Te ardhura te nevojshme per cdo muaj = shpenzime + profit i synuar
  const requiredMonthlyRevenue = monthlyExpensesAverage + targetMonthlyProfit;

  // A jemi duke arritur synimin?
  const actualMonthlyProfit = actualMonthlyRevenue - actualMonthlyExpenses;
  const profitGap = actualMonthlyProfit - targetMonthlyProfit;
  const revenueGap = actualMonthlyRevenue - requiredMonthlyRevenue;

  // Status
  let status: "good" | "warning" | "danger" = "danger";
  if (revenueGap >= 0) status = "good";
  else if (revenueGap >= -monthlyExpensesAverage * 0.2) status = "warning";

  async function saveField(field: "monthlyExpensesAverage" | "targetMonthlyProfit", value: string) {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error("Gabim");
      toast.success("U ruajt");
      router.refresh();
      if (field === "monthlyExpensesAverage") setEditingExpenses(false);
      else setEditingProfit(false);
    } catch (e: any) {
      toast.error(e.message || "Gabim");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          <Target className="w-5 h-5 text-orange-400" />
          <h2 className="text-base font-bold text-foreground">Objektivi Mujor</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Sa duhet të sjellim çdo muaj për të mbuluar shpenzimet dhe për të pasur profit
        </p>
      </div>

      {/* 4 kartelat kryesore */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-border">
        {/* Shpenzime mesatare mujore (editable) */}
        <div className="bg-card p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Receipt className="w-4 h-4 text-red-400" />
            </div>
            {canEdit && !editingExpenses && (
              <button
                onClick={() => setEditingExpenses(true)}
                className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-1">Shpenzime mesatare/muaj</p>
          {editingExpenses ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.01"
                value={expensesValue}
                onChange={(e) => setExpensesValue(e.target.value)}
                className="flex-1 bg-secondary border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-red-500"
                autoFocus
              />
              <button onClick={() => saveField("monthlyExpensesAverage", expensesValue)} disabled={saving} className="p-1 rounded bg-green-500/20 text-green-400">
                <Check className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => { setEditingExpenses(false); setExpensesValue(String(monthlyExpensesAverage)); }} className="p-1 rounded bg-red-500/20 text-red-400">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <p className="text-lg font-bold text-red-400">{formatCurrency(monthlyExpensesAverage)}</p>
          )}
          <p className="text-[10px] text-muted-foreground mt-1">Paga, qira, karburante, etj.</p>
        </div>

        {/* Profit i synuar (editable) */}
        <div className="bg-card p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-orange-400" />
            </div>
            {canEdit && !editingProfit && (
              <button
                onClick={() => setEditingProfit(true)}
                className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-1">Profit i synuar/muaj</p>
          {editingProfit ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.01"
                value={profitValue}
                onChange={(e) => setProfitValue(e.target.value)}
                className="flex-1 bg-secondary border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-orange-500"
                autoFocus
              />
              <button onClick={() => saveField("targetMonthlyProfit", profitValue)} disabled={saving} className="p-1 rounded bg-green-500/20 text-green-400">
                <Check className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => { setEditingProfit(false); setProfitValue(String(targetMonthlyProfit)); }} className="p-1 rounded bg-red-500/20 text-red-400">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <p className="text-lg font-bold text-orange-400">{formatCurrency(targetMonthlyProfit)}</p>
          )}
          <p className="text-[10px] text-muted-foreground mt-1">Sa profit duam në fund të muajit</p>
        </div>

        {/* Te ardhura te nevojshme */}
        <div className="bg-card p-4">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center mb-2">
            <Calendar className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-xs text-muted-foreground mb-1">Të ardhura të nevojshme/muaj</p>
          <p className="text-lg font-bold text-purple-400">{formatCurrency(requiredMonthlyRevenue)}</p>
          <p className="text-[10px] text-muted-foreground mt-1">= Shpenzime + Profit i synuar</p>
        </div>

        {/* Aktual vs synim */}
        <div className={cn(
          "bg-card p-4 border-l-2",
          status === "good" ? "border-green-500" : status === "warning" ? "border-yellow-500" : "border-red-500"
        )}>
          <div className="w-8 h-8 rounded-lg bg-foreground/10 flex items-center justify-center mb-2">
            {status === "good" ? (
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            ) : (
              <AlertTriangle className={cn("w-4 h-4", status === "warning" ? "text-yellow-400" : "text-red-400")} />
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-1">Realiteti aktual (mes. 6 muaj)</p>
          <p className={cn(
            "text-lg font-bold",
            status === "good" ? "text-green-400" : status === "warning" ? "text-yellow-400" : "text-red-400"
          )}>
            {formatCurrency(actualMonthlyRevenue)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {revenueGap >= 0 ? "+" : ""}{formatCurrency(revenueGap)} ndaj synimit
          </p>
        </div>
      </div>

      {/* Mesazh i statusit */}
      <div className={cn(
        "p-4 border-t border-border",
        status === "good" ? "bg-green-500/5" : status === "warning" ? "bg-yellow-500/5" : "bg-red-500/5"
      )}>
        {status === "good" && (
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-400 mb-1">Po e arrini objektivin!</p>
              <p className="text-xs text-muted-foreground">
                Të ardhurat mujore mesatare ({formatCurrency(actualMonthlyRevenue)}) janë <strong className="text-green-400">{formatCurrency(revenueGap)}</strong> mbi synimin.
                Profit mujor faktik: <strong className="text-green-400">{formatCurrency(actualMonthlyProfit)}</strong>.
              </p>
            </div>
          </div>
        )}
        {status === "warning" && (
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-400 mb-1">Pothuajse aty, por...</p>
              <p className="text-xs text-muted-foreground">
                Mungojnë <strong className="text-yellow-400">{formatCurrency(Math.abs(revenueGap))}</strong> në muaj për të arritur synimin. Profit aktual: <strong className="text-yellow-400">{formatCurrency(actualMonthlyProfit)}</strong> (synimi: {formatCurrency(targetMonthlyProfit)}).
              </p>
            </div>
          </div>
        )}
        {status === "danger" && (
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-400 mb-1">Nën synimin mujor!</p>
              <p className="text-xs text-muted-foreground">
                Të ardhurat aktuale ({formatCurrency(actualMonthlyRevenue)}) janë <strong className="text-red-400">{formatCurrency(Math.abs(revenueGap))}</strong> nën nevojës.
                Duhet të sjellim më shumë projekte ose të reduktojmë shpenzimet. Profit faktik: <strong className={actualMonthlyProfit < 0 ? "text-red-400" : "text-yellow-400"}>{formatCurrency(actualMonthlyProfit)}</strong>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
