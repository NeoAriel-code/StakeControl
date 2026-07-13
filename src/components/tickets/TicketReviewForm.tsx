"use client";

import { useActionState } from "react";
import { AlertTriangle } from "lucide-react";
import { BetResult, BetType } from "@prisma/client";
import {
  finalizeTicketReviewAction,
  type TicketReviewActionState,
} from "@/lib/ticket-actions";
import type { ExtractedBetTicket } from "@/lib/ticket-extraction";

const initialState: TicketReviewActionState = {};

type TicketReviewFormProps = {
  ticketId: string;
  extractedBet: ExtractedBetTicket;
  requiresReview: boolean;
};

function toDateTimeLocal(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

function inputClassName(isDoubtful: boolean) {
  return `w-full rounded-xl border bg-card px-4 py-3 text-sm text-foreground outline-none transition ${
    isDoubtful ? "border-warning/50 ring-2 ring-warning/20" : "border-border-strong"
  }`;
}

export function TicketReviewForm({
  ticketId,
  extractedBet,
  requiresReview,
}: TicketReviewFormProps) {
  const [state, action] = useActionState(
    finalizeTicketReviewAction.bind(null, ticketId),
    initialState
  );

  function isDoubtful(fieldName: string) {
    return extractedBet.doubtfulFields.includes(fieldName);
  }

  const fieldHelp = "Campo detectado automáticamente. Revísalo antes de confirmar.";

  return (
    <form action={action} className="space-y-6">
      {(requiresReview || extractedBet.doubtfulFields.length > 0) && (
        <div className="rounded-2xl border border-warning/30 bg-warning-soft px-4 py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="mt-0.5 text-warning" />
            <div>
              <p className="text-sm font-semibold text-warning-foreground">
                Revisión humana obligatoria
              </p>
              <p className="mt-2 text-sm text-warning-foreground">
                La apuesta no se guardará automáticamente. Revisa y corrige los campos antes de confirmar.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="event" className="text-sm font-medium text-foreground">Evento</label>
          <input id="event" name="event" defaultValue={extractedBet.event} className={inputClassName(isDoubtful("event"))} />
          {isDoubtful("event") && <p className="text-xs text-warning">{fieldHelp}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="sportsbook" className="text-sm font-medium text-foreground">Sportsbook</label>
          <input id="sportsbook" name="sportsbook" defaultValue={extractedBet.sportsbook ?? ""} className={inputClassName(isDoubtful("sportsbook"))} />
          {isDoubtful("sportsbook") && <p className="text-xs text-warning">{fieldHelp}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="placedAt" className="text-sm font-medium text-foreground">Fecha y hora</label>
          <input id="placedAt" name="placedAt" type="datetime-local" defaultValue={toDateTimeLocal(extractedBet.placedAt)} className={inputClassName(isDoubtful("placedAt"))} />
          {isDoubtful("placedAt") && <p className="text-xs text-warning">{fieldHelp}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="sport" className="text-sm font-medium text-foreground">Deporte</label>
          <input id="sport" name="sport" defaultValue={extractedBet.sport ?? ""} className={inputClassName(isDoubtful("sport"))} />
        </div>

        <div className="space-y-2">
          <label htmlFor="league" className="text-sm font-medium text-foreground">Liga</label>
          <input id="league" name="league" defaultValue={extractedBet.league ?? ""} className={inputClassName(isDoubtful("league"))} />
          {isDoubtful("league") && <p className="text-xs text-warning">{fieldHelp}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="market" className="text-sm font-medium text-foreground">Mercado</label>
          <input id="market" name="market" defaultValue={extractedBet.market ?? ""} className={inputClassName(isDoubtful("market"))} />
          {isDoubtful("market") && <p className="text-xs text-warning">{fieldHelp}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="selection" className="text-sm font-medium text-foreground">Selección</label>
          <input id="selection" name="selection" defaultValue={extractedBet.selection ?? ""} className={inputClassName(isDoubtful("selection"))} />
          {isDoubtful("selection") && <p className="text-xs text-warning">{fieldHelp}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="betType" className="text-sm font-medium text-foreground">Tipo de apuesta</label>
          <select id="betType" name="betType" defaultValue={extractedBet.betType} className={inputClassName(isDoubtful("betType"))}>
            {Object.values(BetType).map((betType) => (
              <option key={betType} value={betType}>{betType}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="result" className="text-sm font-medium text-foreground">Resultado</label>
          <select id="result" name="result" defaultValue={extractedBet.result} className={inputClassName(isDoubtful("result"))}>
            {Object.values(BetResult).map((result) => (
              <option key={result} value={result}>{result}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="stake" className="text-sm font-medium text-foreground">Stake</label>
          <input id="stake" name="stake" type="number" min="0" step="0.01" defaultValue={String(extractedBet.stake)} className={inputClassName(isDoubtful("stake"))} />
        </div>

        <div className="space-y-2">
          <label htmlFor="odds" className="text-sm font-medium text-foreground">Cuota</label>
          <input id="odds" name="odds" type="number" min="1.01" step="0.01" defaultValue={String(extractedBet.odds)} className={inputClassName(isDoubtful("odds"))} />
        </div>

        <div className="space-y-2">
          <label htmlFor="currency" className="text-sm font-medium text-foreground">Moneda</label>
          <input id="currency" name="currency" defaultValue={extractedBet.currency} className={inputClassName(isDoubtful("currency"))} />
        </div>

        <div className="space-y-2">
          <label htmlFor="potentialPayout" className="text-sm font-medium text-foreground">Posible retorno</label>
          <input id="potentialPayout" name="potentialPayout" type="number" min="0" step="0.01" defaultValue={extractedBet.potentialPayout ? String(extractedBet.potentialPayout) : ""} className={inputClassName(isDoubtful("potentialPayout"))} />
        </div>

        <div className="space-y-2">
          <label htmlFor="ticketCode" className="text-sm font-medium text-foreground">Código de ticket</label>
          <input id="ticketCode" name="ticketCode" defaultValue={extractedBet.ticketCode ?? ""} className={inputClassName(isDoubtful("ticketCode"))} />
        </div>

        <div className="space-y-2">
          <label htmlFor="netProfit" className="text-sm font-medium text-foreground">Ganancia/pérdida neta</label>
          <input id="netProfit" name="netProfit" type="number" step="0.01" defaultValue={String(extractedBet.netProfit)} className={inputClassName(isDoubtful("netProfit"))} />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="notes" className="text-sm font-medium text-foreground">Notas</label>
          <textarea id="notes" name="notes" rows={4} defaultValue={extractedBet.notes ?? ""} className={inputClassName(isDoubtful("notes"))} />
        </div>
      </div>

      <input type="hidden" name="confidenceScore" value={String(extractedBet.confidenceScore)} />
      {extractedBet.doubtfulFields.map((field) => (
        <input key={field} type="hidden" name="doubtfulFields" value={field} />
      ))}

      <div className="rounded-2xl border border-border bg-background p-4">
        <p className="text-sm font-semibold text-foreground">
          Confianza de extracción: {(extractedBet.confidenceScore * 100).toFixed(0)}%
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Los campos resaltados necesitan mayor atención. La apuesta se guardará solo después de esta revisión humana.
        </p>
      </div>

      {state.error && (
        <p className="rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
      >
        Guardar como apuesta final
      </button>
    </form>
  );
}
