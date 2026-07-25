import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdminUser(user)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { userId } = await params;
    const body = await request.json();
    const { action } = body; // "toggle_pause", "toggle_admin"

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
      const newAdminState = !targetUser.isAdmin;
      await prisma.user.update({
        where: { id: userId },
        data: { isAdmin: newAdminState },
      });

      return NextResponse.json({
        success: true,
        isAdmin: newAdminState,
        message: newAdminState ? "Rol de administrador asignado" : "Rol de administrador removido",
      });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error) {
    console.error("Error updating user status:", error);
    return NextResponse.json({ error: "Error al actualizar estado del usuario" }, { status: 500 });
  }
}
