"use client";

import { FolderKanban, DollarSign, TrendingUp, Users, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  projects: FolderKanban,
  revenue: DollarSign,
  profit: TrendingUp,
  workers: Users,
};

const colorMap: Record<string, string> = {
  projects: "bg-blue-500/10 text-blue-400",
  revenue: "bg-green-500/10 text-green-400",
  profit: "bg-orange-500/10 text-orange-400",
  workers: "bg-purple-500/10 text-purple-400",
};

interface Stat {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  trend: string;
  trendUp: boolean;
}

export default function StatsCards({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => {
        const Icon = iconMap[stat.icon] || FolderKanban;
        return (
          <div key={i} className="stat-card group hover:scale-[1.01] transition-transform duration-200">
            {/* Background accent */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-orange-500/5 to-transparent rounded-bl-full" />

            <div className="flex items-start justify-between mb-3">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", colorMap[stat.icon])}>
                <Icon className="w-4.5 h-4.5" size={18} />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
                stat.trendUp
                  ? "text-green-400 bg-green-400/10"
                  : "text-red-400 bg-red-400/10"
              )}>
                {stat.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              </div>
            </div>

            <div>
              <p className="text-2xl font-bold text-foreground mb-0.5">{stat.value}</p>
              <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">{stat.subtitle}</p>
            </div>

            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">{stat.trend}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
