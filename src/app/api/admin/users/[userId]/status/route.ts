import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { canRemoveAdministrator } from "@/lib/admin-rules";

const statusActionSchema = z.object({
  action: z.enum(["toggle_pause", "toggle_admin"]),
}).strict();
const userIdSchema = z.string().trim().min(1).max(128);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdminUser(user)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const parsedUserId = userIdSchema.safeParse((await params).userId);
    const parsedBody = statusActionSchema.safeParse(await request.json());
    if (!parsedUserId.success || !parsedBody.success) {
      return NextResponse.json({ error: "Solicitud no válida" }, { status: 400 });
    }
    const userId = parsedUserId.data;
    const { action } = parsedBody.data;

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { limits: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    if (action === "toggle_pause") {
      const currentPause = targetUser.limits?.pauseAllBetting || false;
      const newPauseState = !currentPause;

      await prisma.userLimits.upsert({
        where: { userId },
        create: {
          userId,
          pauseAllBetting: newPauseState,
        },
        update: {
          pauseAllBetting: newPauseState,
        },
      });

      return NextResponse.json({
        success: true,
        isPaused: newPauseState,
        message: newPauseState ? "Cuenta pausada correctamente" : "Pausa removida correctamente",
      });
    }

    if (action === "toggle_admin") {
      const result = await prisma.$transaction(async (tx) => {
        const current = await tx.user.findUnique({ where: { id: userId }, select: { isAdmin: true } });
        if (!current) return "missing" as const;
        if (!canRemoveAdministrator(current.isAdmin, await tx.user.count({ where: { isAdmin: true } }))) {
          return "last-admin" as const;
        }
        const newAdminState = !current.isAdmin;
        await tx.user.update({ where: { id: userId }, data: { isAdmin: newAdminState } });
        return newAdminState;
      });

      if (result === "last-admin") {
        return NextResponse.json({ error: "No se puede quitar el rol al último administrador" }, { status: 409 });
      }
      if (result === "missing") {
        return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        isAdmin: result,
        message: result ? "Rol de administrador asignado" : "Rol de administrador removido",
      });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error) {
    console.error("Error updating user status:", error);
    return NextResponse.json({ error: "Error al actualizar estado del usuario" }, { status: 500 });
  }
}
