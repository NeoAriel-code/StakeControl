import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { THEME_STORAGE_KEY } from "@/lib/theme";

export const metadata: Metadata = {
  title: "StakeControl | Control de Apuestas Deportivas y Juego Responsable",
  description:
    "Registra tu actividad, controla tu presupuesto, analiza tu historial y detecta conductas de riesgo. Tu herramienta personal de autocontrol en apuestas.",
  keywords: ["apuestas", "juego responsable", "control", "presupuesto", "autocontrol"],
  openGraph: {
    title: "StakeControl | Control de Apuestas",
    description:
      "Herramienta ética de autocontrol para apuestas deportivas. Sin predicciones, sin recomendaciones.",
    type: "website",
    locale: "es_AR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeScript = `
    (() => {
      try {
        const root = document.documentElement;
        const storedTheme = window.localStorage.getItem("${THEME_STORAGE_KEY}");
        const theme =
          storedTheme === "light" || storedTheme === "dark"
            ? storedTheme
            : window.matchMedia("(prefers-color-scheme: dark)").matches
              ? "dark"
              : "light";

        root.dataset.theme = theme;
        root.style.colorScheme = theme;
        root.classList.toggle("dark", theme === "dark");
      } catch {}
    })();
  `;

  return (
    <html lang="es" className="h-full antialiased" data-theme="light" suppressHydrationWarning>
      <head>
        <Script
          id="theme-bootstrap"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: themeScript,
          }}
        />
      </head>
      <body className="min-h-full bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
