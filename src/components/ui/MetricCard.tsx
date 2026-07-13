import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type MetricTrend = "up" | "down" | "neutral";
export type MetricVariant = "default" | "success" | "warning" | "risk" | "premium";

interface MetricCardProps {
  /** Card title / label */
  title: string;
  /** Primary displayed value */
  value: string | number;
  /** Optional small text below the value */
  subtitle?: string;
  /** Optional trend indicator */
  trend?: MetricTrend;
  /** Trend text shown next to the icon */
  trendLabel?: string;
  /** Lucide icon to display */
  icon?: LucideIcon;
  /** Visual variant affecting the accent colour */
  variant?: MetricVariant;
  /** Extra class names for the card wrapper */
  className?: string;
  /** Whether to show a loading skeleton */
  loading?: boolean;
}

const variantAccent: Record<MetricVariant, string> = {
  default: "var(--primary)",
  success: "var(--success)",
  warning: "var(--warning)",
  risk: "var(--danger)",
  premium: "var(--premium)",
};

const variantIconBg: Record<MetricVariant, string> = {
  default: "bg-accent text-accent-foreground",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  risk: "bg-danger-soft text-danger",
  premium: "bg-premium-soft text-premium",
};

const trendColors: Record<MetricTrend, string> = {
  up: "text-success",
  down: "text-danger",
  neutral: "text-muted-foreground",
};

const TrendIcon: Record<MetricTrend, LucideIcon> = {
  up:      TrendingUp,
  down:    TrendingDown,
  neutral: Minus,
};

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  icon: Icon,
  variant = "default",
  className,
  loading = false,
}: MetricCardProps) {
  const accent = variantAccent[variant];
  const TIcon = trend ? TrendIcon[trend] : null;

  if (loading) {
    return (
      <div
        className={cn("metric-card", className)}
        aria-busy="true"
        aria-label={`Cargando ${title}`}
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="h-3 w-24 rounded bg-muted animate-pulse" />
          <div className="h-9 w-9 rounded-xl bg-muted animate-pulse" />
        </div>
        <div className="mb-1 h-7 w-32 rounded bg-muted animate-pulse" />
        <div className="h-3 w-20 rounded bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div
      className={cn("metric-card", className)}
      style={{ "--card-accent": accent } as React.CSSProperties}
      role="region"
      aria-label={title}
    >
      <div className="relative z-10 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        {Icon && (
          <span
            className={cn("flex h-10 w-10 items-center justify-center rounded-2xl", variantIconBg[variant])}
            aria-hidden="true"
          >
            <Icon size={16} strokeWidth={2} />
          </span>
        )}
      </div>

      <p className="relative z-10 mt-2 text-3xl font-black leading-none tracking-tight text-foreground">
        {value}
      </p>

      <div className="relative z-10 mt-1 flex min-h-[1.25rem] items-center gap-2">
        {subtitle && (
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        )}
        {trend && TIcon && trendLabel && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-semibold",
              trendColors[trend]
            )}
          >
            <TIcon size={12} />
            {trendLabel}
          </span>
        )}
      </div>
    </div>
  );
}
