"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import {
  Wallet,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Edit3,
  Check,
  X,
  ArrowRight,
  Banknote,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";

interface DebtItem {
  projectId: string;
  projectName: string;
  client: string;
  contractValue: number;
  paid: number;
  outstanding: number;
  daysOld?: number;
}

interface Props {
  debts: DebtItem[];
  totalOutstanding: number;
  cashOnHand: number;
  bankOverdraft: number;
  expectedFinalProfit: number;
  currentNetProfit: number;
  monthlyExpenseAverage: number;
  canEdit: boolean;
}

export default function CashFlowSection({
  debts,
  totalOutstanding,
  cashOnHand,
  bankOverdraft,
  expectedFinalProfit,
  currentNetProfit,
  monthlyExpenseAverage,
  canEdit,
}: Props) {
  const router = useRouter();
  const [editingCash, setEditingCash] = useState(false);
  const [editingBank, setEditingBank] = useState(false);
  const [cashValue, setCashValue] = useState(String(cashOnHand));
  const [bankValue, setBankValue] = useState(String(bankOverdraft));
  const [saving, setSaving] = useState(false);

  // Likuiditeti neto = cash - borxh banka
  const netLiquidity = cashOnHand - bankOverdraft;

  // Sa muaj mund te funksionojme me cash-in qe kemi (pa pagesa te reja)
  const monthsOfRunway =
    monthlyExpenseAverage > 0
      ? netLiquidity / monthlyExpenseAverage
      : 0;

  // Paralajmerim: nese cash + borxhet ne pritje < shpenzime te ardhshme
  const expectedCashInflow = cashOnHand + totalOutstanding - bankOverdraft;
  const shortageWarning = expectedCashInflow < monthlyExpenseAverage * 3;

  async function saveField(field: "cashOnHand" | "bankOverdraft", value: string) {
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
      if (field === "cashOnHand") setEditingCash(false);
      else setEditingBank(false);
    } catch (e: any) {
      toast.error(e.message || "Gabim");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Kartelat kryesore - Cash, Bank, Likuiditet, Fitim i pritshem */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cash në dorë */}
        <div className="stat-card border-blue-500/30">
          <div className="flex items-start justify-between mb-2">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-blue-400" />
            </div>
            {canEdit && !editingCash && (
              <button
                onClick={() => setEditingCash(true)}
                className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-1">Cash në Dorë</p>
          {editingCash ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.01"
                value={cashValue}
                onChange={(e) => setCashValue(e.target.value)}
                className="flex-1 bg-secondary border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
              <button
                onClick={() => saveField("cashOnHand", cashValue)}
                disabled={saving}
                className="p-1 rounded bg-green-500/20 hover:bg-green-500/30 text-green-400"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setEditingCash(false);
                  setCashValue(String(cashOnHand));
                }}
                className="p-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <p className="text-xl font-bold text-blue-400">{formatCurrency(cashOnHand)}</p>
          )}
          <p className="text-[10px] text-muted-foreground mt-1">Para që firma ka në dorë tani</p>
        </div>

        {/* Borxh Banka */}
        <div className="stat-card border-red-500/30">
          <div className="flex items-start justify-between mb-2">
            <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-red-400" />
            </div>
            {canEdit && !editingBank && (
              <button
                onClick={() => setEditingBank(true)}
                className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-1">Borxh Banka (draft/kredi)</p>
          {editingBank ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.01"
                value={bankValue}
                onChange={(e) => setBankValue(e.target.value)}
                className="flex-1 bg-secondary border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-red-500"
                autoFocus
              />
              <button
                onClick={() => saveField("bankOverdraft", bankValue)}
                disabled={saving}
                className="p-1 rounded bg-green-500/20 hover:bg-green-500/30 text-green-400"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setEditingBank(false);
                  setBankValue(String(bankOverdraft));
                }}
                className="p-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <p className="text-xl font-bold text-red-400">{formatCurrency(bankOverdraft)}</p>
          )}
          <p className="text-[10px] text-muted-foreground mt-1">Sa pak/kredi keni nga banka</p>
        </div>

        {/* Likuiditeti Neto */}
        <div className={cn(
          "stat-card",
          netLiquidity >= 0 ? "border-green-500/30" : "border-red-500/30"
        )}>
          <div className="w-9 h-9 rounded-lg bg-foreground/10 flex items-center justify-center mb-2">
            <Banknote className={cn(
              "w-4 h-4",
              netLiquidity >= 0 ? "text-green-400" : "text-red-400"
            )} />
          </div>
          <p className="text-xs text-muted-foreground mb-1">Likuiditeti Neto</p>
          <p className={cn(
            "text-xl font-bold",
            netLiquidity >= 0 ? "text-green-400" : "text-red-400"
          )}>
            {formatCurrency(netLiquidity)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">Cash − Borxh Banka</p>
        </div>

        {/* Fitimi i Pritshëm */}
        <div className="stat-card border-orange-500/30">
          <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center mb-2">
            <TrendingUp className="w-4 h-4 text-orange-400" />
          </div>
          <p className="text-xs text-muted-foreground mb-1">Fitimi i Pritshëm në Fund</p>
          <p className={cn(
            "text-xl font-bold",
            expectedFinalProfit >= 0 ? "text-orange-400" : "text-red-400"
          )}>
            {formatCurrency(expectedFinalProfit)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">Pas mbledhjes së borxheve</p>
        </div>
      </div>

      {/* Paralajmërime për cash flow */}
      {shortageWarning && monthlyExpenseAverage > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-yellow-400 mb-1">Kujdes me cash flow-in</p>
            <p className="text-xs text-muted-foreground">
              Cash + borxhet që presim nga klientët ({formatCurrency(expectedCashInflow)}) janë më pak se 3 muaj shpenzime (
              {formatCurrency(monthlyExpenseAverage * 3)}). Mund të kemi probleme për të blerë materiale për projektet e reja.
            </p>
          </div>
        </div>
      )}

      {/* Lista e Borxheve nga Klientët */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              Borxhet që na detyrojnë klientët
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Para që presim nga klientët për projektet aktive
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total Borxh</p>
            <p className="text-xl font-bold text-red-400">{formatCurrency(totalOutstanding)}</p>
          </div>
        </div>

        {debts.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Asnjë borxh aktualisht. Të gjitha projektet janë paguar plotësisht.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-border bg-secondary/20">
                  <th className="table-header px-4 py-3 text-left">Projekti</th>
                  <th className="table-header px-4 py-3 text-left">Klienti</th>
                  <th className="table-header px-4 py-3 text-right">Kontrata</th>
                  <th className="table-header px-4 py-3 text-right">Paguar</th>
                  <th className="table-header px-4 py-3 text-right">Borxhi</th>
                  <th className="table-header px-4 py-3 text-right">% E Paguar</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {debts.map((d) => {
                  const percentPaid = d.contractValue > 0 ? (d.paid / d.contractValue) * 100 : 0;
                  return (
                    <tr key={d.projectId} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3 text-sm text-foreground font-medium">{d.projectName}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{d.client}</td>
                      <td className="px-4 py-3 text-sm text-foreground text-right">{formatCurrency(d.contractValue)}</td>
                      <td className="px-4 py-3 text-sm text-green-400 text-right">{formatCurrency(d.paid)}</td>
                      <td className="px-4 py-3 text-sm font-bold text-red-400 text-right">{formatCurrency(d.outstanding)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                percentPaid >= 75 ? "bg-green-500" : percentPaid >= 50 ? "bg-yellow-500" : "bg-red-500"
                              )}
                              style={{ width: `${Math.min(100, percentPaid)}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{percentPaid.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/projects/${d.projectId}`}
                          className="inline-flex p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sa dite mund te funksionojme me cash-in qe kemi */}
      {monthlyExpenseAverage > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-base font-semibold text-foreground mb-3">Si na ndikojnë borxhet</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-secondary/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Shpenzim mesatar/muaj</p>
              <p className="text-base font-semibold text-foreground">{formatCurrency(monthlyExpenseAverage)}</p>
            </div>
            <div className="bg-secondary/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Cash + Borxhet pritese</p>
              <p className="text-base font-semibold text-foreground">{formatCurrency(expectedCashInflow)}</p>
            </div>
            <div className="bg-secondary/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Sa muaj operim</p>
              <p className={cn(
                "text-base font-semibold",
                monthsOfRunway >= 3 ? "text-green-400" : monthsOfRunway >= 1 ? "text-yellow-400" : "text-red-400"
              )}>
                {monthsOfRunway > 0 ? monthsOfRunway.toFixed(1) + " muaj" : "0 muaj"}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Sa më shumë borxhe të paarkëtuara nga klientët, aq më pak mund të blejmë materiale dhe pajisje për projektet e reja.
            Mblidhi borxhet sa më shpejt!
          </p>
        </div>
      )}
    </div>
  );
}
