"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Upload, File, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentUploadProps {
  projectId: string;
  onSuccess: (doc: any) => void;
}

export default function DocumentUpload({ projectId, onSuccess }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setPendingFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 20 * 1024 * 1024, // 20MB
  });

  async function uploadAll() {
    if (pendingFiles.length === 0) return;
    setUploading(true);

    for (const file of pendingFiles) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", projectId);

      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const doc = await res.json();
        if (res.ok) {
          onSuccess(doc);
        } else {
          toast.error(`Gabim gjatë ngarkimit: ${file.name}`);
        }
      } catch {
        toast.error(`Gabim gjatë ngarkimit: ${file.name}`);
      }
    }

    toast.success(`${pendingFiles.length} dokument(e) u ngarkuan`);
    setPendingFiles([]);
    setUploading(false);
  }

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-orange-500 bg-orange-500/5"
            : "border-border hover:border-orange-500/50 hover:bg-secondary/30"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm font-medium text-foreground">
          {isDragActive ? "Lëshoni skedarët këtu" : "Tërhiqni skedarë ose klikoni"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">PDF, Word, Excel, Foto — maks 20MB</p>
      </div>

      {pendingFiles.length > 0 && (
        <div className="space-y-2">
          {pendingFiles.map((file, i) => (
            <div key={i} className="flex items-center gap-3 bg-secondary/50 rounded-lg px-3 py-2">
              <File className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-foreground flex-1 truncate">{file.name}</span>
              <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</span>
              <button
                onClick={() => setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))}
                className="p-1 rounded-md hover:bg-red-400/10 text-muted-foreground hover:text-red-400 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <button
            onClick={uploadAll}
            disabled={uploading}
            className="btn-primary disabled:opacity-50 w-full justify-center"
          >
            {uploading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {uploading ? "Duke ngarkuar..." : `Ngarko ${pendingFiles.length} skedar(ë)`}
          </button>
        </div>
      )}
    </div>
  );
}
