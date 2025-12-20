import type { LucideIcon } from "lucide-react";
import { cn } from "../lib/utils";

interface SummaryCardProps {
  title: string;
  value: string | number;
  color: "green" | "red" | "blue" | "yellow" | "purple";
  icon: LucideIcon;
  suffix?: string;
  subtitle?: string;
}

export default function SummaryCard({
  title,
  value,
  color,
  icon: Icon,
  suffix = "",
  subtitle,
}: SummaryCardProps) {
  const colorMap = {
    green: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/5",
    red: "text-rose-400 bg-rose-500/10 border-rose-500/20 shadow-rose-500/5",
    blue: "text-sky-400 bg-sky-500/10 border-sky-500/20 shadow-sky-500/5",
    yellow: "text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-amber-500/5",
    purple: "text-violet-400 bg-violet-500/10 border-violet-500/20 shadow-violet-500/5",
  };

  return (
    <div className="premium-glass p-6 group hover:border-white/20">
      <div className="flex items-center justify-between mb-6">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110",
          colorMap[color]
        )}>
          <Icon className="w-6 h-6" />
        </div>
        {subtitle && (
          <div className={cn(
            "px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border",
            colorMap[color]
          )}>
            {subtitle}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">{title}</h3>
        <div className="flex items-baseline space-x-1">
          <span className="text-4xl font-extrabold text-white tracking-tighter">
            {value}
          </span>
          {suffix && (
            <span className="text-xl font-bold text-slate-500">{suffix}</span>
          )}
        </div>
      </div>

      {/* Decorative background element */}
      <div className={cn(
        "absolute -bottom-6 -right-6 w-24 h-24 blur-3xl rounded-full opacity-20 transition-opacity duration-500 group-hover:opacity-40",
        color === 'green' && 'bg-emerald-500',
        color === 'red' && 'bg-rose-500',
        color === 'blue' && 'bg-sky-500',
        color === 'yellow' && 'bg-amber-500',
        color === 'purple' && 'bg-violet-500',
      )} />
    </div>
  );
}

