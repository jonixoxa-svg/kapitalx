import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center">
        <p className="text-6xl font-bold text-orange-500">404</p>
        <h2 className="text-lg font-semibold text-foreground mt-3">Faqja nuk u gjet</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Faqja që po kërkoni nuk ekziston.
        </p>
        <Link href="/dashboard" className="btn-primary mt-4 inline-flex">
          <Home className="w-4 h-4" />
          Kthehu te Dashboard
        </Link>
      </div>
    </div>
  );
}
