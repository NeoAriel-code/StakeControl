"use client";

import { cn } from "@/lib/utils";
import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";


interface ResponsibleDisclaimerProps {
  /** Override the default disclaimer message */
  message?: string;
  /** Whether the user can dismiss the banner */
  dismissible?: boolean;
  /** Compact single-line mode */
  compact?: boolean;
  /** Extra class names */
  className?: string;
}

const DEFAULT_MESSAGE =
  "StakeControl muestra datos históricos para autocontrol. No predice resultados ni recomienda realizar apuestas.";

export function ResponsibleDisclaimer({
  message = DEFAULT_MESSAGE,
  dismissible = false,
  compact = false,
  className,
}: ResponsibleDisclaimerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  if (compact) {
    return (
      <div
        role="note"
        aria-label="Aviso de juego responsable"
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
          "text-xs font-medium text-warning bg-warning-soft border border-warning/30",
          className
        )}
      >
        <AlertTriangle size={12} aria-hidden="true" />
        <span>{message}</span>
      </div>
    );
  }

  return (
    <div
      role="note"
      aria-label="Aviso de juego responsable"
      className={cn(
        "flex items-start gap-3 rounded-2xl border px-4 py-3",
        "border-warning/30 bg-warning-soft text-warning-foreground",
        className
      )}
    >
      <AlertTriangle
        size={16}
        className="mt-0.5 flex-shrink-0 text-warning"
        aria-hidden="true"
      />
      <p className="flex-1 text-xs leading-relaxed text-warning-foreground">
        <strong className="font-semibold">Aviso importante:</strong>{" "}
        {message}
      </p>
      {dismissible && (
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Cerrar aviso"
          className="flex-shrink-0 rounded p-0.5 text-warning transition-colors hover:text-warning-foreground"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
