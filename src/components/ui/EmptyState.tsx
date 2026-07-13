import { cn } from "@/lib/utils";
import { InboxIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  /** Short headline */
  title: string;
  /** Longer explanatory text */
  description?: string;
  /** Custom icon (defaults to InboxIcon) */
  icon?: LucideIcon;
  /** Optional call-to-action element */
  action?: ReactNode;
  /** Extra class names */
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon = InboxIcon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("empty-state", className)} role="status" aria-live="polite">
      <div className="empty-state-icon" aria-hidden="true">
        <Icon size={28} strokeWidth={1.5} />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
