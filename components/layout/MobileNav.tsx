"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, Zap } from "lucide-react";
import Sidebar from "./Sidebar";

interface MobileNavProps {
  userName?: string;
  userRole?: string;
}

export default function MobileNav({ userName, userRole }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Auto-close drawer kur ndrron faqja
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Bllokon scroll-in e bodit kur drawer-i eshte i hapur (vetem mobile)
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Top bar - vetem ne mobile (< md) */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-md border-b border-border h-14 flex items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-foreground text-base">KapitalX</span>
        </Link>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg hover:bg-secondary text-foreground transition-colors"
          aria-label="Hap menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Backdrop - vetem ne mobile kur drawer-i eshte i hapur */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - i kontrolluar */}
      <Sidebar
        userName={userName}
        userRole={userRole}
        isOpen={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
