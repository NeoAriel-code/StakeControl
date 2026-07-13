"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  idleLabel: string;
  pendingLabel: string;
};

export function SubmitButton({ idleLabel, pendingLabel }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
