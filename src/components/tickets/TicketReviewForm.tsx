"use client";

import { useActionState, useState } from "react";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { BET_RESULT_LABELS, BET_RESULT_OPTIONS, BET_TYPE_LABELS, BET_TYPES } from "@/lib/bet-enums";
import {
  finalizeTicketReviewAction,
  type TicketReviewActionState,
} from "@/lib/ticket-actions";
import { CURRENCY_OPTIONS, isSupportedCurrency } from "@/lib/currencies";
import type { ExtractedBetTicket, TicketLeg } from "@/lib/ticket-extraction";

const initialState: TicketReviewActionState = {};

type TicketReviewFormProps = {
  ticketId: string;
  extractedBet: ExtractedBetTicket;
  requiresReview: boolean;
};

function toDateTimeLocal(value?: string) {
  if (!value) return "";
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

type EditableLeg = {
  event: string;
  sport: string;
  league: string;
  market: string;
  selection: string;
  odds: string;
  result: (typeof BET_RESULT_OPTIONS)[number];
};

function toEditableLeg(leg: TicketLeg): EditableLeg {
  return {
    event: leg.event,
    sport: leg.sport ?? "",
    league: leg.league ?? "",
    market: leg.market ?? "",
    selection: leg.selection ?? "",
    odds: leg.odds === undefined ? "" : String(leg.odds),
    result: leg.result,
  };
}

function getInitialLegs(extractedBet: ExtractedBetTicket): EditableLeg[] {
  if (extractedBet.legs.length > 0) {
    return extractedBet.legs.map(toEditableLeg);
  }

  return [
    {
      event: extractedBet.event,
      sport: extractedBet.sport ?? "",
      league: extractedBet.league ?? "",
      market: extractedBet.market ?? "",
      selection: extractedBet.selection ?? "",
      odds: String(extractedBet.odds),
      result: extractedBet.result,
    },
  ];
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
  const [legs, setLegs] = useState(() => getInitialLegs(extractedBet));

  function isDoubtful(fieldName: string) {
    return extractedBet.doubtfulFields.includes(fieldName);
  }

  const fieldHelp = "Campo detectado automáticamente. Revísalo antes de confirmar.";
  const selectedCurrency = isSupportedCurrency(extractedBet.currency) ? extractedBet.currency : "USD";

  function updateLeg(index: number, field: keyof EditableLeg, value: string) {
    setLegs((currentLegs) =>
      currentLegs.map((leg, legIndex) => (legIndex === index ? { ...leg, [field]: value } : leg))
    );
  }

  function addLeg() {
    setLegs((currentLegs) => [
      ...currentLegs,
      { event: "", sport: "", league: "", market: "", selection: "", odds: "", result: "PENDING" },
    ]);
  }

  function removeLeg(index: number) {
    setLegs((currentLegs) => currentLegs.filter((_, legIndex) => legIndex !== index));
  }

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
        <div className="space-y-2">
          <label htmlFor="sportsbook" className="text-sm font-medium text-foreground">Sportsbook</label>
          <input id="sportsbook" name="sportsbook" defaultValue={extractedBet.sportsbook ?? ""} className={inputClassName(isDoubtful("sportsbook"))} />
          {isDoubtful("sportsbook") && <p className="text-xs text-warning">{fieldHelp}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="placedAt" className="text-sm font-medium text-foreground">Fecha y hora de la apuesta</label>
          <input id="placedAt" name="placedAt" type="datetime-local" defaultValue={toDateTimeLocal(extractedBet.placedAt)} className={inputClassName(isDoubtful("placedAt"))} />
          {isDoubtful("placedAt") && <p className="text-xs text-warning">{fieldHelp}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="eventStartAt" className="text-sm font-medium text-foreground">Inicio del evento</label>
          <input id="eventStartAt" name="eventStartAt" type="datetime-local" defaultValue={toDateTimeLocal(extractedBet.eventStartAt)} className={inputClassName(isDoubtful("eventStartAt"))} />
          {isDoubtful("eventStartAt") && <p className="text-xs text-warning">{fieldHelp}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="betType" className="text-sm font-medium text-foreground">Tipo de apuesta</label>
          <select id="betType" name="betType" defaultValue={extractedBet.betType} className={inputClassName(isDoubtful("betType"))}>
            {BET_TYPES.map((betType) => (
              <option key={betType} value={betType}>{BET_TYPE_LABELS[betType]}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="result" className="text-sm font-medium text-foreground">Resultado</label>
          <select id="result" name="result" defaultValue={extractedBet.result} className={inputClassName(isDoubtful("result"))}>
            {BET_RESULT_OPTIONS.map((result) => (
              <option key={result} value={result}>{BET_RESULT_LABELS[result]}</option>
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
          <select id="currency" name="currency" defaultValue={selectedCurrency} className={inputClassName(isDoubtful("currency"))}>
            {CURRENCY_OPTIONS.map((currency) => (
              <option key={currency.value} value={currency.value}>
                {currency.label}
              </option>
            ))}
          </select>
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

      <section className="border-t border-border pt-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">Selecciones del ticket</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Revisa cada selección. Una simple tiene una; una múltiple o Bet Builder puede tener varias.
            </p>
          </div>
          <button
            type="button"
            onClick={addLeg}
            className="inline-flex items-center gap-2 rounded-xl border border-border-strong px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-card"
          >
            <Plus size={16} aria-hidden="true" />
            Agregar selección
          </button>
        </div>

        <div className="mt-5 divide-y divide-border">
          {legs.map((leg, index) => (
            <fieldset key={index} className="py-5 first:pt-0 last:pb-0">
              <div className="mb-4 flex items-center justify-between gap-3">
                <legend className="text-sm font-semibold text-foreground">Selección {index + 1}</legend>
                {legs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLeg(index)}
                    className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-danger transition hover:bg-danger-soft"
                    aria-label={`Quitar selección ${index + 1}`}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                    Quitar
                  </button>
                )}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-foreground">
                    Evento
                    <input
                      name="legEvent"
                      value={leg.event}
                      onChange={(event) => updateLeg(index, "event", event.target.value)}
                      required
                      className="mt-2 w-full rounded-xl border border-border-strong bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </label>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Deporte
                    <input name="legSport" value={leg.sport} onChange={(event) => updateLeg(index, "sport", event.target.value)} className="mt-2 w-full rounded-xl border border-border-strong bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" />
                  </label>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Liga
                    <input name="legLeague" value={leg.league} onChange={(event) => updateLeg(index, "league", event.target.value)} className="mt-2 w-full rounded-xl border border-border-strong bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" />
                  </label>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Mercado
                    <input name="legMarket" value={leg.market} onChange={(event) => updateLeg(index, "market", event.target.value)} className="mt-2 w-full rounded-xl border border-border-strong bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" />
                  </label>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Selección
                    <input name="legSelection" value={leg.selection} onChange={(event) => updateLeg(index, "selection", event.target.value)} className="mt-2 w-full rounded-xl border border-border-strong bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" />
                  </label>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Cuota de selección
                    <input name="legOdds" type="number" min="1.01" step="0.01" value={leg.odds} onChange={(event) => updateLeg(index, "odds", event.target.value)} className="mt-2 w-full rounded-xl border border-border-strong bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" />
                  </label>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Resultado de selección
                    <select name="legResult" value={leg.result} onChange={(event) => updateLeg(index, "result", event.target.value)} className="mt-2 w-full rounded-xl border border-border-strong bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10">
                      {BET_RESULT_OPTIONS.map((result) => (
                        <option key={result} value={result}>{BET_RESULT_LABELS[result]}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            </fieldset>
          ))}
        </div>
      </section>

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
