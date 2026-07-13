import { deleteBetAction } from "@/lib/bet-actions";

export function DeleteBetButton({ betId }: { betId: string }) {
  return (
    <form action={deleteBetAction}>
      <input type="hidden" name="betId" value={betId} />
      <button
        type="submit"
        className="rounded-xl border border-danger-border px-3 py-2 text-sm font-semibold text-danger transition hover:bg-danger-soft"
      >
        Eliminar
      </button>
    </form>
  );
}
