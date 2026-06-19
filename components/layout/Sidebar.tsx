"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FolderKanban,
  Wallet,
  Users,
  BarChart3,
  Calendar,
  LogOut,
  Zap,
  ChevronRight,
  Building2,
  CalendarCheck,
  Truck,
  Hammer,
  Package,
  FileBarChart,
  Handshake,
  AlertTriangle,
  Zap as Lightning,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Projektet",
    href: "/projects",
    icon: FolderKanban,
  },
  {
    label: "Shpenzimet",
    href: "/expenses",
    icon: Wallet,
  },
  {
    label: "Hyrje e shpejtë",
    href: "/quick-expense",
    icon: Lightning,
  },
  {
    label: "Punëtorët",
    href: "/workers",
    icon: Users,
  },
  {
    label: "Evidenca",
    href: "/attendance",
    icon: CalendarCheck,
  },
  {
    label: "Pajisjet",
    href: "/equipment",
    icon: Truck,
  },
  {
    label: "Bashkëpunëtorët",
    href: "/subcontractors",
    icon: Handshake,
  },
  {
    label: "Prodhimi",
    href: "/production",
    icon: Hammer,
  },
  {
    label: "Stoku",
    href: "/stock",
    icon: Package,
  },
  {
    label: "Financiare",
    href: "/financial",
    icon: BarChart3,
  },
  {
    label: "Kalendari",
    href: "/calendar",
    icon: Calendar,
  },
  {
    label: "Raporte",
    href: "/reports",
    icon: FileBarChart,
  },
  {
    label: "Të Dyshimtat",
    href: "/pending",
    icon: AlertTriangle,
  },
];

interface SidebarProps {
  userName?: string;
  userRole?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ userName, userRole, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full w-60 bg-card border-r border-border flex flex-col z-50",
        "transition-transform duration-300 ease-out",
        "md:translate-x-0 md:z-40",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Logo */}
      <div className="p-5 border-b border-border flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5 group" onClick={onClose}>
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-orange-400 transition-colors">
            <Zap className="w-4.5 h-4.5 text-white" size={18} />
          </div>
          <div>
            <span className="font-bold text-foreground text-base">KapitalX</span>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Menaxhim Projektesh</p>
          </div>
        </Link>
        {/* Close button - only on mobile */}
        <button
          onClick={onClose}
          className="md:hidden p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Mbyll menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
                isActive
                  ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 flex-shrink-0",
                  isActive ? "text-orange-400" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <span>{item.label}</span>
              {isActive && (
                <ChevronRight className="w-3 h-3 text-orange-400 ml-auto" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Company Badge */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2 px-3 py-2.5 mb-1 rounded-lg bg-secondary/50">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground truncate">KapitalX SHPK</p>
            <p className="text-[10px] text-muted-foreground">Konstruksione & Solar</p>
          </div>
        </div>

        {/* User */}
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="w-7 h-7 bg-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-orange-400">
              {userName?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{userName || "Përdoruesi"}</p>
            <p className="text-[10px] text-muted-foreground capitalize">
              {userRole === "ADMIN" ? "Administrator" : userRole === "MANAGER" ? "Menaxher" : "Shikues"}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
            title="Dilni"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
