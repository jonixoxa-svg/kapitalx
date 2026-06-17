"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Handshake,
  Phone,
  Mail,
  MapPin,
  X,
  Trash2,
  Edit3,
  Loader2,
  ArrowRight,
  Briefcase,
  Euro,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";

type Project = { id: string; name: string; client?: string };

type Payment = {
  id: string;
  amount: number;
  date: string;
  description: string | null;
  method: string;
};

type Assignment = {
  id: string;
  workDescription: string;
  agreedAmount: number;
  startDate: string;
  endDate: string | null;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  project: { id: string; name: string };
  payments: Payment[];
};

type Subcontractor = {
  id: string;
  name: string;
  specialty: string | null;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  taxId: string | null;
  notes: string | null;
  active: boolean;
  assignments: Assignment[];
};

interface Props {
  subcontractors: Subcontractor[];
  projects: Project[];
  userRole: string;
}

export default function SubcontractorsClient({ subcontractors: initial, projects, userRole }: Props) {
  const router = useRouter();
  const [subs, setSubs] = useState(initial);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [taxId, setTaxId] = useState("");
  const [notes, setNotes] = useState("");

  const canEdit = userRole !== "VIEWER";

  function resetForm() {
    setName(""); setSpecialty(""); setContactName(""); setPhone("");
    setEmail(""); setAddress(""); setTaxId(""); setNotes("");
    setEditingId(null);
  }

  function openEdit(sub: Subcontractor) {
    setEditingId(sub.id);
    setName(sub.name);
    setSpecialty(sub.specialty || "");
    setContactName(sub.contactName || "");
    setPhone(sub.phone || "");
    setEmail(sub.email || "");
    setAddress(sub.address || "");
    setTaxId(sub.taxId || "");
    setNotes(sub.notes || "");
    setShowForm(true);
  }

  async function save() {
    if (!name.trim()) {
      toast.error("Emri është i detyrueshëm");
      return;
    }
    setSaving(true);
    try {
      const payload = { name, specialty, contactName, phone, email, address, taxId, notes };
      const url = editingId ? `/api/subcontractors/${editingId}` : "/api/subcontractors";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gabim");
      }
      toast.success(editingId ? "U përditësua" : "Bashkëpuntori u shtua");
      resetForm();
      setShowForm(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Gabim");
    } finally {
      setSaving(false);
    }
  }

  async function deleteSub(id: string) {
    if (!confirm("Fshi këtë bashkëpuntor? Të gjitha caktimet dhe pagesat do fshihen!")) return;
    try {
      const res = await fetch(`/api/subcontractors/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gabim");
      setSubs((prev) => prev.filter((s) => s.id !== id));
      toast.success("U fshi");
      router.refresh();
    } catch {
      toast.error("Gabim gjatë fshirjes");
    }
  }

  const filtered = useMemo(() => {
    if (!search) return subs;
    const q = search.toLowerCase();
    return subs.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.specialty || "").toLowerCase().includes(q) ||
        (s.contactName || "").toLowerCase().includes(q)
    );
  }, [subs, search]);

  // Permbledhje totale
  const stats = useMemo(() => {
    let totalAgreed = 0;
    let totalPaid = 0;
    let activeAssignments = 0;
    for (const s of subs) {
      for (const a of s.assignments) {
        totalAgreed += a.agreedAmount;
        totalPaid += a.payments.reduce((sum, p) => sum + p.amount, 0);
        if (a.status === "ACTIVE") activeAssignments++;
      }
    }
    return { totalAgreed, totalPaid, totalOutstanding: totalAgreed - totalPaid, activeAssignments };
  }, [subs]);

  return (
    <div className="space-y-6">
      {/* Statistika */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card border-blue-500/30">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center mb-2">
            <Handshake className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-xs text-muted-foreground mb-1">Bashkëpunëtorë Total</p>
          <p className="text-xl font-bold text-foreground">{subs.length}</p>
        </div>
        <div className="stat-card border-purple-500/30">
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center mb-2">
            <Briefcase className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-xs text-muted-foreground mb-1">Caktime Aktive</p>
          <p className="text-xl font-bold text-purple-400">{stats.activeAssignments}</p>
        </div>
        <div className="stat-card border-green-500/30">
          <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center mb-2">
            <Euro className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-xs text-muted-foreground mb-1">Total Paguar</p>
          <p className="text-xl font-bold text-green-400">{formatCurrency(stats.totalPaid)}</p>
        </div>
        <div className="stat-card border-red-500/30">
          <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center mb-2">
            <Euro className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-xs text-muted-foreground mb-1">Borxh ndaj tyre</p>
          <p className="text-xl font-bold text-red-400">{formatCurrency(stats.totalOutstanding)}</p>
        </div>
      </div>

      {/* Search + Add */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Kërko bashkëpuntor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        {canEdit && (
          <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary">
            <Plus className="w-4 h-4" />
            Bashkëpuntor i Ri
          </button>
        )}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center">
          <Handshake className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {search ? "Nuk u gjet asnjë bashkëpuntor" : "Asnjë bashkëpuntor akoma"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => {
            const totalAgreed = s.assignments.reduce((sum, a) => sum + a.agreedAmount, 0);
            const totalPaid = s.assignments.reduce(
              (sum, a) => sum + a.payments.reduce((ps, p) => ps + p.amount, 0),
              0
            );
            const outstanding = totalAgreed - totalPaid;
            const activeCount = s.assignments.filter((a) => a.status === "ACTIVE").length;

            return (
              <div key={s.id} className="bg-card border border-border rounded-xl p-5 hover:border-orange-500/30 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-bold text-foreground truncate">{s.name}</h3>
                      {!s.active && <span className="badge border-red-500/30 text-red-400">Joaktiv</span>}
                    </div>
                    {s.specialty && (
                      <p className="text-xs text-orange-400 mb-1">{s.specialty}</p>
                    )}
                    {s.contactName && (
                      <p className="text-xs text-muted-foreground">Kontakti: {s.contactName}</p>
                    )}
                  </div>
                  {canEdit && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteSub(s.id)} className="p-1.5 rounded hover:bg-red-400/10 text-muted-foreground hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Kontaktet */}
                <div className="space-y-1 text-xs text-muted-foreground mb-3">
                  {s.phone && <div className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{s.phone}</div>}
                  {s.email && <div className="flex items-center gap-1.5"><Mail className="w-3 h-3" />{s.email}</div>}
                  {s.address && <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{s.address}</div>}
                </div>

                {/* Statistikat */}
                <div className="grid grid-cols-3 gap-2 mb-3 pt-3 border-t border-border">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">Caktime</p>
                    <p className="text-sm font-bold text-purple-400">{activeCount}/{s.assignments.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">Paguar</p>
                    <p className="text-sm font-bold text-green-400">{formatCurrency(totalPaid)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">Borxh</p>
                    <p className={cn("text-sm font-bold", outstanding > 0 ? "text-red-400" : "text-muted-foreground")}>
                      {formatCurrency(outstanding)}
                    </p>
                  </div>
                </div>

                <Link href={`/subcontractors/${s.id}`} className="btn-secondary w-full justify-center">
                  <ArrowRight className="w-4 h-4" />
                  Shiko Detajet
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal për shtim/editim */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg p-5 space-y-4 my-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">
                {editingId ? "Edito Bashkëpuntor" : "Bashkëpuntor i Ri"}
              </h3>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="p-1 rounded hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="label-field">Emri *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="P.sh. Lapaj Elektrik SHPK" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-field">Specialiteti</label>
                <input value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="input-field" placeholder="P.sh. Elektriker" />
              </div>
              <div>
                <label className="label-field">Personi i kontaktit</label>
                <input value={contactName} onChange={(e) => setContactName(e.target.value)} className="input-field" placeholder="P.sh. Agim Lapaj" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-field">Telefoni</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" placeholder="+38344..." />
              </div>
              <div>
                <label className="label-field">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="email@..." />
              </div>
            </div>

            <div>
              <label className="label-field">Adresa</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} className="input-field" placeholder="Qyteti, rruga" />
            </div>

            <div>
              <label className="label-field">NIPT / Numri fiskal</label>
              <input value={taxId} onChange={(e) => setTaxId(e.target.value)} className="input-field" />
            </div>

            <div>
              <label className="label-field">Shënime</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="input-field" />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => { setShowForm(false); resetForm(); }} className="btn-secondary">Anulo</button>
              <button onClick={save} disabled={saving} className="btn-primary">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {editingId ? "Ruaj" : "Shto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
