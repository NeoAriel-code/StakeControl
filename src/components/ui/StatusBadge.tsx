import {
  CheckCircle2,
  Crown,
  PauseCircle,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

export type StatusBadgeKind =
  | "controlled"
  | "near-limit"
  | "limit-exceeded"
  | "pause-active"
  | "review-required"
  | "premium"
  | "reviewed";

type StatusBadgeProps = {
  kind: StatusBadgeKind;
  label?: string;
  className?: string;
};

const STATUS_CONFIG: Record<
  StatusBadgeKind,
  {
    label: string;
    className: string;
    Icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  }
> = {
  controlled: {
    label: "Bajo control",
    className: "status-badge--controlled",
    Icon: ShieldCheck,
  },
  "near-limit": {
    label: "Cerca del límite",
    className: "status-badge--near-limit",
    Icon: ShieldAlert,
  },
  "limit-exceeded": {
    label: "Límite superado",
    className: "status-badge--limit-exceeded",
    Icon: ShieldX,
  },
  "pause-active": {
    label: "Pausa activa",
    className: "status-badge--pause-active",
    Icon: PauseCircle,
  },
  "review-required": {
    label: "Revisión requerida",
    className: "status-badge--review-required",
    Icon: ScanSearch,
  },
  premium: {
    label: "Premium",
    className: "status-badge--premium",
    Icon: Crown,
  },
  reviewed: {
    label: "Revisada",
    className: "status-badge--reviewed",
    Icon: CheckCircle2,
  },
};

export function StatusBadge({ kind, label, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[kind];

  return (
    <span className={cn("status-badge", config.className, className)}>
      <config.Icon size={12} strokeWidth={2.2} aria-hidden="true" />
      {label ?? config.label}
    </span>
  );
}
