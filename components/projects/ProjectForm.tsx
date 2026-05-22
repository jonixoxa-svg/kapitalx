"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Project } from "@prisma/client";

interface ProjectFormProps {
  project?: Project;
  onSuccess?: () => void;
}

const STATUS_OPTIONS = [
  { value: "PLANNED", label: "Planifikuar" },
  { value: "ACTIVE", label: "Aktiv" },
  { value: "COMPLETED", label: "Kompletuar" },
  { value: "ON_HOLD", label: "Pezulluar" },
];

export default function ProjectForm({ project, onSuccess }: ProjectFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: project?.name || "",
    client: project?.client || "",
    location: project?.location || "",
    description: project?.description || "",
    startDate: project?.startDate
      ? new Date(project.startDate).toISOString().split("T")[0]
      : "",
    endDate: project?.endDate
      ? new Date(project.endDate).toISOString().split("T")[0]
      : "",
    status: project?.status || "PLANNED",
    contractValue: project?.contractValue?.toString() || "",
    progress: project?.progress?.toString() || "0",
    notes: project?.notes || "",
  });

  const isEdit = !!project;

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.client || !form.location || !form.startDate) {
      toast.error("Plotësoni të gjitha fushat e detyrueshme");
      return;
    }

    setLoading(true);
    try {
      const url = isEdit ? `/api/projects/${project.id}` : "/api/projects";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(isEdit ? "Projekti u përditësua" : "Projekti u krijua me sukses");

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/projects/${data.id}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Ndodhi një gabim");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!isEdit && (
        <div className="flex items-center gap-3">
          <Link href="/projects" className="btn-ghost">
            <ArrowLeft className="w-4 h-4" />
            Kthehu
          </Link>
        </div>
      )}

      {/* Basic Info */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Informacioni Bazë</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label-field">Emri i Projektit *</label>
            <input
              type="text"
              className="input-field"
              placeholder="p.sh. Struktura Metalike - Tiranë"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label-field">Klienti *</label>
            <input
              type="text"
              className="input-field"
              placeholder="Emri i klientit"
              value={form.client}
              onChange={(e) => update("client", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label-field">Lokacioni *</label>
            <input
              type="text"
              className="input-field"
              placeholder="Qyteti, Shteti"
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label-field">Data e Fillimit *</label>
            <input
              type="date"
              className="input-field"
              value={form.startDate}
              onChange={(e) => update("startDate", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label-field">Data e Përfundimit</label>
            <input
              type="date"
              className="input-field"
              value={form.endDate}
              onChange={(e) => update("endDate", e.target.value)}
            />
          </div>

          <div>
            <label className="label-field">Statusi</label>
            <select
              className="input-field"
              value={form.status}
              onChange={(e) => update("status", e.target.value)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-field">Vlera e Kontratës (ALL)</label>
            <input
              type="number"
              className="input-field"
              placeholder="0"
              value={form.contractValue}
              onChange={(e) => update("contractValue", e.target.value)}
              min="0"
            />
          </div>

          {isEdit && (
            <div>
              <label className="label-field">Progres (%)</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={form.progress}
                  onChange={(e) => update("progress", e.target.value)}
                  className="flex-1 accent-orange-500"
                />
                <span className="text-sm font-semibold text-foreground w-10 text-right">
                  {form.progress}%
                </span>
              </div>
            </div>
          )}

          <div className="sm:col-span-2">
            <label className="label-field">Përshkrimi</label>
            <textarea
              className="input-field h-20 resize-none"
              placeholder="Përshkrim i shkurtër i projektit..."
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="label-field">Shënime</label>
            <textarea
              className="input-field h-16 resize-none"
              placeholder="Shënime shtesë..."
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        {!isEdit && (
          <Link href="/projects" className="btn-secondary">
            Anulo
          </Link>
        )}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {loading ? "Duke ruajtur..." : isEdit ? "Përditëso" : "Krijo Projektin"}
        </button>
      </div>
    </form>
  );
}
