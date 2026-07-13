import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface PageHeaderProps {
  /** Main page title */
  title: string;
  /** Optional subtitle/description below the title */
  description?: string;
  /** Lucide icon next to the title */
  icon?: LucideIcon;
  /** Optional content to render on the right side (buttons, badges, etc.) */
  actions?: ReactNode;
  /** Optional breadcrumb text */
  breadcrumb?: string;
  /** Extra class names */
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
  breadcrumb,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("page-header", className)} role="banner">
      <div className="flex flex-col gap-1">
        {breadcrumb && (
          <p className="mb-0.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {breadcrumb}
          </p>
        )}
        <div className="flex items-center gap-3">
          {Icon && (
            <span
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground"
              aria-hidden="true"
            >
              <Icon size={20} strokeWidth={2} />
            </span>
          )}
          <h1 className="text-2xl font-bold leading-tight text-foreground">
            {title}
          </h1>
        </div>
        {description && (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
      )}
    </header>
  );
}
