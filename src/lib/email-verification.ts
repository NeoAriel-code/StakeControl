import { createHash, randomBytes } from "node:crypto";

const EMAIL_VERIFICATION_TOKEN_DURATION_MS = 24 * 60 * 60 * 1000;

type EmailVerificationTokenState = {
  expiresAt: Date;
  usedAt: Date | null;
};

export function hashEmailVerificationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function isEmailVerificationTokenUsable(token: EmailVerificationTokenState, now = new Date()) {
  return token.usedAt === null && token.expiresAt > now;
}

export async function createEmailVerificationToken(userId: string) {
  const { default: prisma } = await import("@/lib/prisma");
  const token = randomBytes(32).toString("base64url");
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.emailVerificationToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: now },
    });

    await tx.emailVerificationToken.create({
      data: {
        userId,
        tokenHash: hashEmailVerificationToken(token),
        expiresAt: new Date(now.getTime() + EMAIL_VERIFICATION_TOKEN_DURATION_MS),
      },
    });
  });

  return token;
}

export async function verifyEmailToken(token: string) {
  const { default: prisma } = await import("@/lib/prisma");
  const tokenHash = hashEmailVerificationToken(token);
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const record = await tx.emailVerificationToken.findUnique({ where: { tokenHash } });

    if (!record || !isEmailVerificationTokenUsable(record, now)) {
      return null;
    }

    const consumed = await tx.emailVerificationToken.updateMany({
      where: { id: record.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });

    if (consumed.count !== 1) {
      return null;
    }

    await tx.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: now },
    });

    return record.userId;
  });
}
