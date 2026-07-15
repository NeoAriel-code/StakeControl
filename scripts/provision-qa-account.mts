import "dotenv/config";
import { randomBytes, scryptSync } from "node:crypto";
import { PlanType } from "@prisma/client";
import prisma from "../src/lib/prisma";

const email = "qa@getstakecontrol.com";
const password = process.env.QA_ACCOUNT_PASSWORD;

if (!password || password.length < 8) {
  throw new Error("Set QA_ACCOUNT_PASSWORD to a password of at least 8 characters before running this script.");
}

function hashPassword(value: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(value, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const now = new Date();
const passwordHash = hashPassword(password);

await prisma.user.upsert({
  where: { email },
  create: {
    email,
    name: "StakeControl QA",
    passwordHash,
    country: "CL",
    currency: "USD",
    timezone: "America/Santiago",
    ageConfirmed: true,
    termsAcceptedAt: now,
    responsibleGamingAcceptedAt: now,
    onboardingCompletedAt: now,
    subscriptions: {
      create: { planType: PlanType.FREE, status: "active" },
    },
    limits: { create: {} },
  },
  update: {
    name: "StakeControl QA",
    passwordHash,
    ageConfirmed: true,
    termsAcceptedAt: now,
    responsibleGamingAcceptedAt: now,
    onboardingCompletedAt: now,
  },
});

console.log(`QA account provisioned: ${email}`);
