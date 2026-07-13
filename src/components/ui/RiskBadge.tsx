import { cn } from "@/lib/utils";
import { ShieldCheck, ShieldAlert, ShieldX, Shield } from "lucide-react";

export type RiskLevel = "low" | "medium" | "high" | "unknown";

interface RiskBadgeProps {
  /** Risk level to display */
  level: RiskLevel;
  /** Override the default label text */
  label?: string;
  /** Show the icon */
  showIcon?: boolean;
  /** Large variant for prominent display */
  large?: boolean;
  /** Extra class names */
  className?: string;
}

const RISK_CONFIG: Record<
  RiskLevel,
  { label: string; className: string; Icon: React.ComponentType<{ size?: number; strokeWidth?: number }> }
> = {
  low: {
    label: "Riesgo Bajo",
    className: "risk-badge--low",
    Icon: ShieldCheck,
  },
  medium: {
    label: "Riesgo Moderado",
    className: "risk-badge--medium",
    Icon: ShieldAlert,
  },
  high: {
    label: "Riesgo Alto",
    className: "risk-badge--high",
    Icon: ShieldX,
  },
  unknown: {
    label: "Sin datos",
    className: "bg-muted text-muted-foreground border border-border",
    Icon: Shield,
  },
};

export function RiskBadge({
  level,
  label,
  showIcon = true,
  large = false,
  className,
}: RiskBadgeProps) {
  const config = RISK_CONFIG[level];
  const displayLabel = label ?? config.label;

  return (
    <span
      role="status"
      aria-label={`Nivel de riesgo: ${displayLabel}`}
      className={cn(
        "risk-badge",
        config.className,
        large && "text-sm px-3 py-1",
        className
      )}
    >
      {showIcon && (
        <config.Icon
          size={large ? 14 : 11}
          strokeWidth={2}
          aria-hidden="true"
        />
      )}
      {displayLabel}
    </span>
  );
}
