import Link from "next/link";
import { FolderX, ArrowLeft } from "lucide-react";

export default function ProjectNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FolderX className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Projekti nuk u gjet</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Projekti që po kërkoni nuk ekziston ose është fshirë.
        </p>
        <Link href="/projects" className="btn-primary mt-4 inline-flex">
          <ArrowLeft className="w-4 h-4" />
          Kthehu te Projektet
        </Link>
      </div>
    </div>
  );
}
