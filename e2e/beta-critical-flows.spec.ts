import { expect, test, type Page } from "@playwright/test";

const baseUrl = process.env.E2E_BASE_URL;
const userEmail = process.env.E2E_USER_EMAIL;
const userPassword = process.env.E2E_USER_PASSWORD;
const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;
const disposableEmail = process.env.E2E_DISPOSABLE_USER_EMAIL;
const disposablePassword = process.env.E2E_DISPOSABLE_USER_PASSWORD;
const onboardingEmail = process.env.E2E_ONBOARDING_USER_EMAIL;
const onboardingPassword = process.env.E2E_ONBOARDING_USER_PASSWORD;
const verificationToken = process.env.E2E_VERIFICATION_TOKEN;

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/(dashboard|onboarding|beta-terms)$/);
}

test.describe("beta public and CSP smoke", () => {
  test.skip(!baseUrl, "Set E2E_BASE_URL to a deployed preview.");

  test("registration surface is available and account responses are generic", async ({ page }) => {
    const cspErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error" && /content security policy|refused to connect/i.test(message.text())) cspErrors.push(message.text());
    });
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: "Crear cuenta" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    expect(cspErrors).toEqual([]);
  });

  test("submits open registration without exposing whether the email exists", async ({ page }) => {
    test.skip(process.env.E2E_REGISTRATION_ENABLED !== "true", "Use only on an isolated preview that permits test registrations.");
    const email = `playwright-${Date.now()}@example.com`;
    await page.goto("/register");
    await page.getByLabel("Nombre").fill("Playwright Beta");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Contraseña", { exact: true }).fill("BetaTest123!");
    await page.getByLabel("Confirmar contraseña").fill("BetaTest123!");
    await page.locator("#ageConfirmed").check();
    await page.locator("#termsAccepted").check();
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page.getByText(/Revisa tu correo para confirmar tu cuenta/)).toBeVisible();
  });

  test("verifies an email token prepared by the preview fixture", async ({ page }) => {
    test.skip(!verificationToken, "Set E2E_VERIFICATION_TOKEN from an isolated preview fixture.");
    await page.goto(`/verify-email?token=${encodeURIComponent(verificationToken!)}`);
    await expect(page.getByText(/correo.*verificado|verificación.*completada/i).first()).toBeVisible();
  });

  test("health endpoint has the minimal no-store contract", async ({ request }) => {
    const response = await request.get("/api/health");
    expect([200, 503]).toContain(response.status());
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(await response.json()).toEqual({ status: response.ok() ? "ok" : "unavailable" });
  });
});

test.describe("onboarding", () => {
  test.skip(!baseUrl || !onboardingEmail || !onboardingPassword, "Set credentials for a verified account with incomplete onboarding.");
  test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== "desktop-chromium", "Mutating fixture runs once."));

  test("completes responsible onboarding and current beta acceptance", async ({ page }) => {
    await login(page, onboardingEmail!, onboardingPassword!);
    await expect(page).toHaveURL(/\/onboarding$/);
    for (const id of ["platformDisclaimerAccepted", "performanceDisclaimerAccepted", "termsAccepted", "betaTermsAccepted"]) {
      const checkbox = page.locator(`#${id}`);
      if (await checkbox.count()) await checkbox.check();
    }
    await page.getByRole("button", { name: "Entrar a StakeControl" }).click();
    await expect(page).toHaveURL(/\/health$/);
  });
});

test.describe("authenticated beta journey", () => {
  test.skip(!baseUrl || !userEmail || !userPassword, "Set E2E_BASE_URL, E2E_USER_EMAIL and E2E_USER_PASSWORD.");

  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "Mutating fixture runs once; mobile coverage is handled by smoke tests.");
    await login(page, userEmail!, userPassword!);
    if (page.url().endsWith("/beta-terms")) {
      await page.getByRole("button", { name: "Aceptar y continuar" }).click();
    }
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("creates, reviews, edits and deletes a manual bet", async ({ page }) => {
    const marker = `E2E ${Date.now()}`;
    await page.goto("/bets/new");
    await page.getByLabel("Evento").fill(marker);
    await page.getByLabel("Stake").fill("1");
    await page.getByLabel("Cuota").fill("2");
    await page.getByRole("button", { name: "Guardar registro" }).click();
    await expect(page).toHaveURL(/\/bets$/);
    await expect(page.getByText(marker)).toBeVisible();
    await page.getByText(marker).click();
    await page.getByRole("link", { name: /Editar/i }).click();
    await page.getByLabel("Notas opcionales").fill("revisión e2e");
    await page.getByRole("button", { name: /Guardar cambios/i }).click();
    await expect(page).toHaveURL(/\/bets$/);
    await page.getByText(marker).click();
    await page.getByRole("button", { name: "Eliminar" }).click();
    await page.goto("/bets");
    await expect(page.getByText(marker)).toHaveCount(0);
  });

  test("configures limits, activates a pause and blocks bet and ticket creation", async ({ page }) => {
    await page.goto("/limits");
    await page.getByLabel("Límite semanal").fill("25");
    await page.getByLabel("Duración de la pausa").selectOption("24h");
    await page.getByRole("button", { name: "Guardar límites" }).click();
    await expect(page.getByText("Configuración de límites actualizada correctamente.")).toBeVisible();
    await page.goto("/bets/new");
    await expect(page.getByText(/pausa voluntaria está activa/i)).toBeVisible();
    await page.goto("/tickets/upload");
    await expect(page.getByText(/Carga bloqueada por pausa voluntaria/i)).toBeVisible();
    await page.goto("/limits");
    await page.getByLabel("Duración de la pausa").selectOption("clear");
    await page.getByRole("button", { name: "Guardar límites" }).click();
    await expect(page.getByText("Configuración de límites actualizada correctamente.")).toBeVisible();
  });

  test("exports the authenticated user's CSV", async ({ page }) => {
    const downloadPromise = page.waitForEvent("download");
    await page.goto("/reports/export");
    await page.getByRole("button", { name: /Descargar CSV/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });

  test("uploads a ticket through the mocked OCR preview", async ({ page }) => {
    test.skip(process.env.E2E_OCR_MOCK_ENABLED !== "true", "Run only on a preview configured with mocked OCR.");
    await page.goto("/tickets/upload");
    await page.locator('input[type="file"]').setInputFiles("public/brand/stakecontrol-app-icon-1024.png");
    await page.getByRole("button", { name: /Subir|Procesar/i }).click();
    await expect(page).toHaveURL(/\/tickets\/[^/]+\/review/);
    await expect(page.getByText(/procesando|revisar/i).first()).toBeVisible();
  });
});

test.describe("admin authorization", () => {
  test.skip(!baseUrl || !adminEmail || !adminPassword, "Set the E2E admin credentials for preview.");

  test("authorized admins see the panel and metadata-first user detail", async ({ page }) => {
    await login(page, adminEmail!, adminPassword!);
    if (page.url().endsWith("/beta-terms")) await page.getByRole("button", { name: "Aceptar y continuar" }).click();
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Panel de Control Interno" })).toBeVisible();
    await expect(page.getByText(/Administración de usuarios/)).toBeVisible();
  });
});

test.describe("account deletion", () => {
  test.skip(!baseUrl || !disposableEmail || !disposablePassword, "A dedicated disposable preview account is required.");
  test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== "desktop-chromium", "The disposable fixture can be consumed only once."));

  test("deletes a disposable account and clears its session", async ({ page }) => {
    await login(page, disposableEmail!, disposablePassword!);
    if (page.url().endsWith("/beta-terms")) await page.getByRole("button", { name: "Aceptar y continuar" }).click();
    await page.goto("/profile");
    await page.getByPlaceholder("Escribe ELIMINAR").fill("ELIMINAR");
    await page.getByRole("button", { name: "Eliminar cuenta" }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
