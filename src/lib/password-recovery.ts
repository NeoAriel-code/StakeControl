import { createHash, randomBytes } from "node:crypto";

const PASSWORD_RESET_TOKEN_DURATION_MS = 60 * 60 * 1000;

type PasswordResetTokenState = {
  expiresAt: Date;
  usedAt: Date | null;
};

export function hashPasswordResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function isPasswordResetTokenUsable(token: PasswordResetTokenState, now = new Date()) {
  return token.usedAt === null && token.expiresAt > now;
}

export async function createPasswordResetToken(userId: string) {
  const { default: prisma } = await import("@/lib/prisma");
  const token = randomBytes(32).toString("base64url");
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: now },
    });

    await tx.passwordResetToken.create({
      data: {
        userId,
        tokenHash: hashPasswordResetToken(token),
        expiresAt: new Date(now.getTime() + PASSWORD_RESET_TOKEN_DURATION_MS),
      },
    });
  });

  return token;
}

export async function consumePasswordResetToken(token: string) {
  const { default: prisma } = await import("@/lib/prisma");
  const tokenHash = hashPasswordResetToken(token);
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const record = await tx.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!record || !isPasswordResetTokenUsable(record, now)) {
      return null;
    }

    const consumed = await tx.passwordResetToken.updateMany({
      where: { id: record.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });

    return consumed.count === 1 ? record.userId : null;
  });
}

export async function resetPasswordWithToken(token: string, passwordHash: string) {
  const { default: prisma } = await import("@/lib/prisma");
  const tokenHash = hashPasswordResetToken(token);
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const record = await tx.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!record || !isPasswordResetTokenUsable(record, now)) {
      return null;
    }

    const consumed = await tx.passwordResetToken.updateMany({
      where: {
        id: record.id,
        usedAt: null,
        expiresAt: { gt: now },
      },
      data: { usedAt: now },
    });

    if (consumed.count !== 1) {
      return null;
    }

    await tx.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    });

    return record.userId;
  });
}
