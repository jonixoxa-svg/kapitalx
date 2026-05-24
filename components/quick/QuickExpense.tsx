"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera, Euro, FolderKanban, Save, User, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const SUBMITTERS = ["Valdet", "Tahir"];
const CATEGORIES = [
  { value: "MATERIALS", label: "Materiale" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "SALARIES", label: "Paga" },
  { value: "OTHER", label: "Tjeter" },
];

interface Project { id: string; name: string }
interface Props { projects: Project[] }

export default function QuickExpense({ projects }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [submitter, setSubmitter] = useState(SUBMITTERS[0]);
  const [type, setType] = useState<"general" | "project">("general");
  const [projectId, setProjectId] = useState("");
  const [category, setCategory] = useState("MATERIALS");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function onPickFile(f: File | null) {
    setFile(f);
    if (f && f.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount && !file) { toast.error("Vendos shumen ose ngarko foton"); return; }
    if (!description.trim()) { toast.error("Pershkrimi mungon"); return; }
    if (type === "project" && !projectId) { toast.error("Zgjidh projektin"); return; }

    setSaving(true);
    try {
      const now = new Date();
      const fd = new FormData();
      fd.append("category", category);
      fd.append("description", description);
      fd.append("amount", amount || "0");
      fd.append("month", String(now.getMonth() + 1));
      fd.append("year", String(now.getFullYear()));
      fd.append("recurring", "false");
      fd.append("submittedBy", submitter);
      fd.append("date", now.toISOString().slice(0, 10));
      if (type === "project" && projectId) fd.append("projectId", projectId);
      if (file) fd.append("file", file);

      const res = await fetch("/api/general-expenses", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gabim");
      }
      toast.success(`Shpenzimi u shtua nga ${submitter}`);
      // Reset
      setAmount("");
      setDescription("");
      setFile(null);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Gabim");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Submitter switcher */}
      <div className="bg-card border border-border rounded-xl p-4">
        <label className="text-xs text-muted-foreground block mb-2">Kush po e shton?</label>
        <div className="grid grid-cols-2 gap-2">
          {SUBMITTERS.map((s) => (
            <button
              key={s}
              onClick={() => setSubmitter(s)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors",
                submitter === s
                  ? "bg-orange-500/10 border-orange-500/40 text-orange-400"
                  : "bg-secondary border-border text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                submitter === s ? "bg-orange-500 text-white" : "bg-secondary-foreground/10 text-foreground"
              )}>
                {s.charAt(0)}
              </div>
              <span className="font-medium">{s}</span>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <User className="w-5 h-5 text-orange-400" />
            Shpenzim i ri nga {submitter}
          </h2>
        </div>

        {/* Type selector */}
        <div>
          <label className="text-xs text-muted-foreground block mb-2">Tipi i shpenzimit</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType("general")}
              className={cn(
                "px-4 py-2.5 rounded-lg border text-sm font-medium",
                type === "general"
                  ? "bg-orange-500/10 border-orange-500/40 text-orange-400"
                  : "bg-secondary border-border text-muted-foreground"
              )}
            >
              Pergjithshem (kompani)
            </button>
            <button
              type="button"
              onClick={() => setType("project")}
              className={cn(
                "px-4 py-2.5 rounded-lg border text-sm font-medium",
                type === "project"
                  ? "bg-orange-500/10 border-orange-500/40 text-orange-400"
                  : "bg-secondary border-border text-muted-foreground"
              )}
            >
              Per projekt specifik
            </button>
          </div>
        </div>

        {type === "project" && (
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Cili projekt? *</label>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="input-field" required>
              <option value="">— Zgjidh projektin —</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}

        {/* Category */}
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Kategoria</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field">
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        {/* Amount */}
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Shuma (€)</label>
          <div className="relative">
            <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="input-field pl-9 text-lg font-semibold"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Pershkrim *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="P.sh. Bleva çimento per projekt..."
            className="input-field"
            required
          />
        </div>

        {/* Photo */}
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Foto fature (opsional)</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => onPickFile(e.target.files?.[0] || null)}
            className="hidden"
          />
          {!file ? (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-lg p-6 hover:border-orange-500/50 flex flex-col items-center gap-2 text-muted-foreground hover:text-orange-400 transition-colors"
            >
              <Camera className="w-8 h-8" />
              <span className="text-sm">Kliko per te ngarkuar foto</span>
            </button>
          ) : (
            <div className="relative">
              {preview ? (
                <img src={preview} alt="" className="w-full max-h-48 object-contain rounded-lg border border-border" />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg border border-border">
                  <FileText className="w-5 h-5 text-orange-400" />
                  <span className="text-sm text-foreground truncate">{file.name}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => { setFile(null); setPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
                className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-black/80"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {saving ? "Po ruhet..." : `Ruaj si ${submitter}`}
        </button>
      </form>
    </div>
  );
}
