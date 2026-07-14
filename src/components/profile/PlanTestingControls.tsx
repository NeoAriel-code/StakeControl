"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { setPlanForTestingAction, type PlanTestActionState } from "@/lib/plan-test-actions";

const initialState: PlanTestActionState = {};

export function PlanTestingControls({ plan }: { plan: "FREE" | "PREMIUM" }) {
  const router = useRouter();
  const [state, action] = useActionState(setPlanForTestingAction, initialState);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <section className="rounded-3xl border border-warning/30 bg-card p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-warning">Control privado</p>
      <h2 className="mt-2 text-xl font-semibold text-foreground">Plan de pruebas</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Cambia tu vista entre Free y Premium. No crea cobros ni modifica cuentas ajenas.
      </p>
      <form action={action} className="mt-5 flex flex-wrap gap-3">
        <button
          type="submit"
          name="plan"
          value="FREE"
          disabled={plan === "FREE"}
          className="rounded-xl border border-border-strong px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
        >
          Usar Free
        </button>
        <button
          type="submit"
          name="plan"
          value="PREMIUM"
          disabled={plan === "PREMIUM"}
          className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          Usar Premium
        </button>
      </form>
      {state.error && <p className="mt-4 text-sm text-danger">{state.error}</p>}
    </section>
  );
}
