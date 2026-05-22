"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Receipt, X, Loader2, Trash2, Image as ImageIcon, ExternalLink, Calendar } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

type Payment = {
  id: string;
  amount: number;
  date: string | Date;
  description: string | null;
  receiptUrl: string | null;
  receiptName: string | null;
};

export default function PaymentsSection({
  projectId,
  payments,
  contractValue,
  userRole,
}: {
  projectId: string;
  payments: Payment[];
  contractValue: number;
  userRole: string;
}) {
  const router = useRouter();
  const canEdit = userRole !== "VIEWER";

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<Payment | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.max(0, contractValue - totalPaid);
  const percentPaid = contractValue > 0 ? Math.min(100, (totalPaid / contractValue) * 100) : 0;

  function onPickFile(f: File | null) {
    setFile(f);
    if (f && f.type.startsWith("image/")) {
      const url = URL.createObjectURL(f);
      setFilePreview(url);
    } else {
      setFilePreview(null);
    }
  }

  async function submit() {
    if (!amount) return toast.error("Shuma mungon");
    if (!date) return toast.error("Data mungon");

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("projectId", projectId);
      fd.append("amount", amount);
      fd.append("date", date);
      if (description) fd.append("description", description);
      if (file) fd.append("file", file);

      const res = await fetch("/api/payments", { method: "POST", body: fd });
      if (!res.ok) throw new Error();

      toast.success("Pagesa u shtua");
      setShowForm(false);
      setAmount(""); setDate(new Date().toISOString().slice(0, 10)); setDescription(""); setFile(null); setFilePreview(null);
      router.refresh();
    } catch {
      toast.error("Gabim gjatë ruajtjes");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Fshij këtë pagesë?")) return;
    try {
      const res = await fetch(`/api/payments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("U fshi");
      router.refresh();
    } catch {
      toast.error("Gabim");
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-orange-400" />
          <h2 className="text-lg font-bold text-foreground">Pagesat e marra</h2>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-orange-500 hover:bg-orange-400 text-white rounded-lg text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" /> Shto pagesë
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-secondary/40 rounded-lg p-3">
          <p className="text-[10px] uppercase text-muted-foreground font-medium">Vlera e kontratës</p>
          <p className="text-base font-bold text-foreground mt-1">{formatCurrency(contractValue)}</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
          <p className="text-[10px] uppercase text-green-400 font-medium">Paguar</p>
          <p className="text-base font-bold text-green-400 mt-1">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p className="text-[10px] uppercase text-red-400 font-medium">Pa paguar</p>
          <p className="text-base font-bold text-red-400 mt-1">{formatCurrency(remaining)}</p>
        </div>
      </div>

      {contractValue > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Progresi i pagesës</span>
            <span className="font-semibold text-foreground">{percentPaid.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-500 to-green-400 h-full rounded-full transition-all"
              style={{ width: `${percentPaid}%` }}
            />
          </div>
        </div>
      )}

      {/* List */}
      {payments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Asnjë pagesë e regjistruar.
        </div>
      ) : (
        <div className="space-y-2">
          {payments.map((p) => (
            <div key={p.id} className="bg-secondary/40 rounded-lg p-3 flex items-center gap-3">
              {p.receiptUrl ? (
                <button
                  onClick={() => setViewingReceipt(p)}
                  className="w-12 h-12 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center flex-shrink-0 overflow-hidden hover:border-orange-500"
                  title="Shiko faturën"
                >
                  {p.receiptUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <img src={p.receiptUrl} alt="Fatura" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-orange-400" />
                  )}
                </button>
              ) : (
                <div className="w-12 h-12 rounded-lg bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                  <Receipt className="w-5 h-5 text-muted-foreground" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-green-400">{formatCurrency(p.amount)}</p>
                  <span className="text-muted-foreground">·</span>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(p.date)}
                  </p>
                </div>
                {p.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.description}</p>}
                {p.receiptName && (
                  <button
                    onClick={() => setViewingReceipt(p)}
                    className="text-[10px] text-orange-400 hover:text-orange-300 mt-0.5 flex items-center gap-1"
                  >
                    <ExternalLink className="w-2.5 h-2.5" /> {p.receiptName}
                  </button>
                )}
              </div>

              {canEdit && (
                <button
                  onClick={() => remove(p.id)}
                  className="p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
                  title="Fshij"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add payment modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">Shto pagesë</h3>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-md hover:bg-secondary">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Shuma (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Data</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Përshkrim (opsional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="P.sh. kësti i parë, parapagim, etj."
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Foto e faturës (opsionale)</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => onPickFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className={cn(
                    "w-full border-2 border-dashed border-border rounded-lg p-4 text-xs text-muted-foreground hover:border-orange-500 hover:text-foreground transition-colors flex flex-col items-center gap-2",
                    file && "border-orange-500/40 bg-orange-500/5"
                  )}
                >
                  {filePreview ? (
                    <img src={filePreview} alt="Preview" className="max-h-32 rounded-md" />
                  ) : (
                    <ImageIcon className="w-6 h-6" />
                  )}
                  <span>{file ? file.name : "Kliko për të ngarkuar foto/PDF"}</span>
                </button>
                {file && (
                  <button
                    type="button"
                    onClick={() => { setFile(null); setFilePreview(null); if (fileRef.current) fileRef.current.value = ""; }}
                    className="text-[10px] text-red-400 hover:text-red-300 mt-1"
                  >
                    Hiq foton
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground">Anulo</button>
              <button
                onClick={submit}
                disabled={saving}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Ruaj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt viewer */}
      {viewingReceipt && viewingReceipt.receiptUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setViewingReceipt(null)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-bold text-foreground">{viewingReceipt.receiptName}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(viewingReceipt.amount)} · {formatDate(viewingReceipt.date)}</p>
              </div>
              <div className="flex items-center gap-2">
                <a href={viewingReceipt.receiptUrl} target="_blank" rel="noreferrer" className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground" title="Hap në tab të ri">
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button onClick={() => setViewingReceipt(null)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            {viewingReceipt.receiptUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
              <img src={viewingReceipt.receiptUrl} alt={viewingReceipt.receiptName || "fatura"} className="w-full rounded-lg" />
            ) : (
              <iframe src={viewingReceipt.receiptUrl} className="w-full h-[70vh] rounded-lg bg-white" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
