import { FlaskConical } from "lucide-react";

export function BetaBadge() {
  return (
    <div className="pointer-events-none fixed bottom-3 right-3 z-[60] inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-background/90 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-primary shadow-sm backdrop-blur" aria-label="StakeControl Beta">
      <FlaskConical size={12} aria-hidden="true" />
      StakeControl Beta
    </div>
  );
}
