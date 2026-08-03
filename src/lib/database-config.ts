type DatabaseEnvironment = {
  DATABASE_URL?: string;
  TURSO_AUTH_TOKEN?: string;
  VERCEL_ENV?: string;
};

export function assertProductionDatabaseConfiguration(
  environment: DatabaseEnvironment = {
    DATABASE_URL: process.env.DATABASE_URL,
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
    VERCEL_ENV: process.env.VERCEL_ENV,
  },
) {
  if (environment.VERCEL_ENV !== "production") {
    return;
  }

  if (!environment.DATABASE_URL?.startsWith("libsql://")) {
    throw new Error(
      "Production DATABASE_URL must use the libsql:// protocol for Turso.",
    );
  }

  if (!environment.TURSO_AUTH_TOKEN) {
    throw new Error("TURSO_AUTH_TOKEN is required for the production Turso database.");
  }
}
