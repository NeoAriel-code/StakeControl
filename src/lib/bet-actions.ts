"use server";

import { BetResult, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { betFormSchema, type BetFormValues } from "@/lib/bet-schemas";
import {
  evaluateResponsibleGamingAlerts,
  formatPauseMessage,
  isPauseActive,
} from "@/lib/responsible-gaming";

export type BetActionState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof BetFormValues, string>>;
};

const quickBetResultSchema = z.object({
  betId: z.string().trim().min(1, "Falta el identificador del registro."),
  result: z.nativeEnum(BetResult, {
    error: "Selecciona un resultado válido.",
  }),
});

function mapZodErrors(error: unknown): BetActionState {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) && !(error instanceof Error)) {
    return { error: "No se pudo guardar la apuesta." };
  }

  return { error: error.message };
}

function toDecimal(value: number) {
  return new Prisma.Decimal(value.toString());
}

async function ensureUserOwnsBet(userId: string, betId: string) {
  const bet = await prisma.bet.findFirst({
    where: {
      id: betId,
      userId,
    },
  });

  if (!bet) {
    throw new Error("La apuesta no existe o no pertenece al usuario.");
  }

  return bet;
}

function parseFormData(formData: FormData) {
  const parsed = betFormSchema.safeParse({
    sportsbook: formData.get("sportsbook"),
    placedAt: formData.get("placedAt"),
    event: formData.get("event"),
    sport: formData.get("sport"),
    league: formData.get("league"),
    market: formData.get("market"),
    selection: formData.get("selection"),
    betType: formData.get("betType"),
    stake: formData.get("stake"),
    odds: formData.get("odds"),
    currency: formData.get("currency"),
    potentialPayout: formData.get("potentialPayout"),
    result: formData.get("result"),
    netProfit: formData.get("netProfit"),
    ticketCode: formData.get("ticketCode"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;

    return {
      success: false as const,
      state: {
        error: "Revisa los campos del formulario.",
        fieldErrors: {
          sportsbook: fieldErrors.sportsbook?.[0],
          placedAt: fieldErrors.placedAt?.[0],
          event: fieldErrors.event?.[0],
          sport: fieldErrors.sport?.[0],
          league: fieldErrors.league?.[0],
          market: fieldErrors.market?.[0],
          selection: fieldErrors.selection?.[0],
          betType: fieldErrors.betType?.[0],
          stake: fieldErrors.stake?.[0],
          odds: fieldErrors.odds?.[0],
          currency: fieldErrors.currency?.[0],
          potentialPayout: fieldErrors.potentialPayout?.[0],
          result: fieldErrors.result?.[0],
          netProfit: fieldErrors.netProfit?.[0],
          ticketCode: fieldErrors.ticketCode?.[0],
          notes: fieldErrors.notes?.[0],
        },
      } satisfies BetActionState,
    };
  }

  return {
    success: true as const,
    values: parsed.data,
  };
}

function buildBetPayload(values: BetFormValues) {
  return {
    title: values.event,
    sportsbook: values.sportsbook,
    ticketCode: values.ticketCode,
    sport: values.sport,
    league: values.league,
    market: values.market,
    selection: values.selection,
    betType: values.betType,
    currency: values.currency,
    result: values.result,
    stake: toDecimal(values.stake),
    odds: toDecimal(values.odds),
    potentialPayout:
      values.potentialPayout !== undefined ? toDecimal(values.potentialPayout) : null,
    profitLoss: toDecimal(values.netProfit),
    settledPayout:
      values.potentialPayout !== undefined && values.result === "WON"
        ? toDecimal(values.potentialPayout)
        : values.result === "VOID"
          ? toDecimal(values.stake)
          : null,
    placedAt: new Date(values.placedAt),
    notes: values.notes,
  };
}

function buildCreateBetData(userId: string, values: BetFormValues) {
  return {
    userId,
    ...buildBetPayload(values),
  };
}

function buildUpdateBetData(values: BetFormValues) {
  return buildBetPayload(values);
}

export async function createBetAction(
  _prevState: BetActionState,
  formData: FormData
): Promise<BetActionState> {
  const user = await requireUser();
  const parsed = parseFormData(formData);

  if (!parsed.success) {
    return parsed.state;
  }

  const userLimits = await prisma.userLimits.findUnique({
    where: { userId: user.id },
  });

  if (isPauseActive(userLimits?.pauseUntil)) {
    return {
      error: formatPauseMessage(userLimits!.pauseUntil!),
    };
  }

  if (
    userLimits?.maxStakePerBet &&
    parsed.values.stake > Number(userLimits.maxStakePerBet) &&
    formData.get("confirmLargeStake") !== "on"
  ) {
    return {
      error:
        "El stake supera tu máximo por apuesta. Confirma explícitamente la advertencia antes de guardar.",
    };
  }

  try {
    await prisma.bet.create({
      data: buildCreateBetData(user.id, parsed.values),
    });
    await evaluateResponsibleGamingAlerts(user.id);
  } catch (error) {
    return mapZodErrors(error);
  }

  revalidatePath("/dashboard");
  revalidatePath("/bets");
  redirect("/bets");
}

export async function updateBetAction(
  betId: string,
  _prevState: BetActionState,
  formData: FormData
): Promise<BetActionState> {
  const user = await requireUser();
  const parsed = parseFormData(formData);

  if (!parsed.success) {
    return parsed.state;
  }

  try {
    await ensureUserOwnsBet(user.id, betId);

    const userLimits = await prisma.userLimits.findUnique({
      where: { userId: user.id },
    });

    if (
      userLimits?.maxStakePerBet &&
      parsed.values.stake > Number(userLimits.maxStakePerBet) &&
      formData.get("confirmLargeStake") !== "on"
    ) {
      return {
        error:
          "El stake supera tu máximo por apuesta. Confirma explícitamente la advertencia antes de guardar.",
      };
    }

    await prisma.bet.update({
      where: { id: betId },
      data: buildUpdateBetData(parsed.values),
    });
    await evaluateResponsibleGamingAlerts(user.id);
  } catch (error) {
    return mapZodErrors(error);
  }

  revalidatePath("/dashboard");
  revalidatePath("/bets");
  revalidatePath(`/bets/${betId}/edit`);
  revalidatePath(`/bets/${betId}`);
  redirect("/bets");
}

export async function updateBetResultAction(formData: FormData) {
  const user = await requireUser();
  const parsed = quickBetResultSchema.safeParse({
    betId: formData.get("betId"),
    result: formData.get("result"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "No se pudo actualizar el resultado.");
  }

  const bet = await ensureUserOwnsBet(user.id, parsed.data.betId);
  const settledPayout =
    parsed.data.result === "WON" && bet.potentialPayout
      ? bet.potentialPayout
      : parsed.data.result === "VOID"
        ? bet.stake
        : null;

  await prisma.bet.update({
    where: { id: bet.id },
    data: {
      result: parsed.data.result,
      settledPayout,
    },
  });
  await evaluateResponsibleGamingAlerts(user.id);

  revalidatePath("/dashboard");
  revalidatePath("/bets");
  revalidatePath(`/bets/${bet.id}`);
  revalidatePath(`/bets/${bet.id}/edit`);
}

export async function deleteBetAction(formData: FormData) {
  const user = await requireUser();
  const betId = formData.get("betId");

  if (typeof betId !== "string" || betId.length === 0) {
    throw new Error("Falta el identificador de la apuesta.");
  }

  await ensureUserOwnsBet(user.id, betId);

  await prisma.bet.delete({
    where: { id: betId },
  });

  revalidatePath("/dashboard");
  revalidatePath("/bets");
  revalidatePath(`/bets/${betId}/edit`);
  revalidatePath(`/bets/${betId}`);
}
