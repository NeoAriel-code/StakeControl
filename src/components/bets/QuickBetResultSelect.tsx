"use client";

import { BetResult } from "@prisma/client";
import {
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  MinusCircle,
  TrendingDown,
  WalletCards,
} from "lucide-react";
import type { ComponentType } from "react";
import { useEffect, useRef, useState, useTransition } from "react";
import { updateBetResultAction } from "@/lib/bet-actions";
import { cn } from "@/lib/utils";

type QuickBetResultSelectProps = {
  betId: string;
  result: BetResult;
  compact?: boolean;
};

const RESULT_LABELS: Record<BetResult, string> = {
  PENDING: "Pendiente",
  WON: "Ganada",
  LOST: "Perdida",
  VOID: "Anulada",
  CASHOUT: "Cashout",
  UNKNOWN: "Sin definir",
};

const RESULT_STYLES: Record<BetResult, string> = {
  PENDING: "status-badge--review-required",
  WON: "status-badge--reviewed",
  LOST: "status-badge--limit-exceeded",
  VOID: "status-badge--controlled",
  CASHOUT: "status-badge--controlled",
  UNKNOWN: "status-badge--review-required",
};

const RESULT_ICONS = {
  PENDING: Clock3,
  WON: CheckCircle2,
  LOST: TrendingDown,
  VOID: MinusCircle,
  CASHOUT: WalletCards,
  UNKNOWN: CircleHelp,
} satisfies Record<BetResult, ComponentType<{ size?: number; strokeWidth?: number; className?: string }>>;

const RESULT_ICON_COLORS: Record<BetResult, string> = {
  PENDING: "text-warning",
  WON: "text-success",
  LOST: "text-danger",
  VOID: "text-success",
  CASHOUT: "text-success",
  UNKNOWN: "text-warning",
};

export function QuickBetResultSelect({ betId, result, compact = false }: QuickBetResultSelectProps) {
  const [selectedResult, setSelectedResult] = useState(result);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);
  const Icon = RESULT_ICONS[selectedResult];

  useEffect(() => {
    setSelectedResult(result);
  }, [result]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function updateResult(nextResult: BetResult) {
    setSelectedResult(nextResult);
    setOpen(false);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("betId", betId);
      formData.set("result", nextResult);
      await updateBetResultAction(formData);
    });
  }

  return (
    <div ref={menuRef} className={cn("relative inline-flex", compact && "w-full")}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Cambiar resultado"
        title="Cambiar resultado rápidamente"
        disabled={isPending}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "status-badge h-9 rounded-full pl-3 pr-8 transition hover:brightness-[0.98] focus-visible:ring-2 focus-visible:ring-primary/15 disabled:cursor-wait disabled:opacity-70",
          RESULT_STYLES[selectedResult],
          compact ? "w-full justify-start" : "min-w-40"
        )}
      >
        <Icon size={13} strokeWidth={2.2} className={RESULT_ICON_COLORS[selectedResult]} />
        <span>{RESULT_LABELS[selectedResult]}</span>
      </button>

      <ChevronDown
        size={13}
        strokeWidth={2.2}
        className={cn(
          "pointer-events-none absolute right-3 top-1/2 z-10 -translate-y-1/2 opacity-70",
          RESULT_ICON_COLORS[selectedResult]
        )}
        aria-hidden="true"
      />

      {open && (
        <div
          role="menu"
          aria-label="Opciones de resultado"
          className="absolute left-0 top-11 z-50 w-56 overflow-hidden rounded-2xl border border-border bg-card p-1.5 shadow-xl"
        >
          {Object.values(BetResult).map((option) => {
            const OptionIcon = RESULT_ICONS[option];
            const selected = option === selectedResult;

            return (
              <button
                key={option}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => updateResult(option)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold text-foreground transition hover:bg-background",
                  selected && "bg-background"
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className={cn("status-badge h-6 w-6 justify-center p-0", RESULT_STYLES[option])}>
                    <OptionIcon size={12} strokeWidth={2.2} className={RESULT_ICON_COLORS[option]} />
                  </span>
                  {RESULT_LABELS[option]}
                </span>
                {selected && <CheckCircle2 size={14} className="text-success" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

