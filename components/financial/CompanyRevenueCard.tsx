"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DollarSign, Edit, Save, X, Info } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Props {
  initialTotalRevenue: number;
  initialNote: string | null;
  calculatedTotalRevenue: number; // shuma e contractValue-ve te projekteve
  userRole: string;
}

export default function CompanyRevenueCard({
  initialTotalRevenue,
  initialNote,
  calculatedTotalRevenue,
  userRole,
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(initialTotalRevenue));
  const [note, setNote] = useState(initialNote || "");
  const [saving, setSaving] = useState(false);
  const [savedRevenue, setSavedRevenue] = useState(initialTotalRevenue);
  const [savedNote, setSavedNote] = useState(initialNote || "");

  const canEdit = userRole !== "VIEWER";

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalRevenue: parseFloat(value) || 0,
          totalRevenueNote: note,
        }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setSavedRevenue(updated.totalRevenue);
      setSavedNote(updated.totalRevenueNote || "");
      setEditing(false);
      toast.success("Te ardhurat u perditesuan");
      router.refresh();
    } catch {
      toast.error("Gabim gjate ruajtjes");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setValue(String(savedRevenue));
    setNote(savedNote);
    setEditing(false);
  }

  return (
    <div className="bg-card border border-orange-500/30 rounded-xl p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              T&euml; ardhurat totale t&euml; kompanis&euml;
            </p>
            {!editing ? (
              <>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {formatCurrency(savedRevenue)}
                </p>
                {savedNote && (
                  <p className="text-xs text-muted-foreground mt-1 italic">{savedNote}</p>
                )}
              </>
            ) : (
              <div className="mt-2 space-y-2">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    Shuma (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="0.00"
                    className="input-field"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    Sh&euml;nim (opsional)
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="P.sh. P&euml;r vitin 2026"
                    className="input-field"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2">
            {!editing ? (
              <button onClick={() => setEditing(true)} className="btn-secondary text-xs">
                <Edit className="w-3.5 h-3.5" />
                Edito
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary text-xs disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? "Po ruaj..." : "Ruaj"}
                </button>
                <button onClick={handleCancel} className="btn-secondary text-xs">
                  <X className="w-3.5 h-3.5" />
                  Anulo
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-border/50 flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          Shuma e vlerave t&euml; kontratave t&euml; t&euml; gjitha projekteve &euml;sht&euml;{" "}
          <span className="font-semibold text-foreground">
            {formatCurrency(calculatedTotalRevenue)}
          </span>
          . Vlera m&euml; sip&euml;r &euml;sht&euml; ajo q&euml; e ve vet&euml; ti — mund t&euml; jet&euml; e ndryshme nga
          shuma e llogaritur automatikisht.
        </p>
      </div>
    </div>
  );
}
