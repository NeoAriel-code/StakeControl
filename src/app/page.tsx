import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BarChart3,
  BellRing,
  CheckCircle2,
  Crown,
  FileDown,
  Gauge,
  LockKeyhole,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getCurrentUser, getPostAuthRedirect } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { redirect } from "next/navigation";

const productPillars = [
  {
    title: "Bitácora de apuestas",
    description: "Registra deporte, liga, mercado, selección, cuota, stake y resultado en una vista pensada para bettors.",
    icon: BarChart3,
  },
  {
    title: "Control de stake",
    description: "Revisa cómo se mueve tu stake promedio y detecta cambios de ritmo antes de que se vuelvan hábito.",
    icon: Gauge,
  },
  {
    title: "Reportes para revisar",
    description: "Exporta CSV por fechas y revisa tu historial fuera de la app sin perder trazabilidad.",
    icon: FileDown,
  },
  {
    title: "Tickets y OCR",
    description: "Sube tickets para completar registros más rápido, manteniendo cada archivo asociado solo a tu usuario.",
    icon: ScanLine,
  },
];

const safetyItems = [
  "No recomienda mercados ni selecciones.",
  "No promete rentabilidad ni recuperación de pérdidas.",
  "Muestra datos históricos con contexto preventivo.",
  "Permite pausar registros y revisar límites.",
];

const pricingPlans = [
  {
    name: "Gratis",
    price: "$0",
    period: "para empezar",
    description: "Para ordenar tu historial básico de apuestas y mantener visibles tus límites personales.",
    cta: "Crear cuenta gratis",
    href: "/register",
    highlighted: false,
    features: [
      "Registro manual de apuestas deportivas",
      "Dashboard con métricas principales",
      "Alertas preventivas básicas",
      "Exportación CSV básica",
      "Límites personales y pausa activa",
    ],
  },
  {
    name: "Premium",
    price: "$4.990",
    period: "CLP / mes",
    description: "Para apostadores que quieren revisar exposición, rachas y patrones con más contexto histórico.",
    cta: "Probar Premium",
    href: "/register?plan=premium",
    highlighted: true,
    features: [
      "Análisis IA responsable del mes",
      "Categorías con mayor exposición",
      "Mejor y peor desempeño histórico, sin recomendaciones",
      "Exportación CSV avanzada",
      "OCR de tickets y campos premium",
    ],
  },
];

const privacyFeatures: Array<{ icon: LucideIcon; title: string; description: string }> = [
  {
    icon: LockKeyhole,
    title: "Datos aislados por usuario",
    description: "Tus apuestas, tickets, reportes y alertas se consultan solo con tu usuario autenticado.",
  },
  {
    icon: BellRing,
    title: "Alertas preventivas",
    description: "Señales sobre límites, frecuencia y rachas sin decirte dónde apostar.",
  },
  {
    icon: WalletCards,
    title: "Cuotas y monedas flexibles",
    description: "Usa cuotas decimales o americanas y ajusta moneda por registro si alternas casas o cripto.",
  },
  {
    icon: Sparkles,
    title: "IA responsable",
    description: "Análisis premium con filtros para bloquear recomendaciones de apuesta o aumento de stake.",
  },
];

export default async function RootPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect(getPostAuthRedirect(user));
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#07111f] dark:text-white">
      <header className="fixed inset-x-4 top-4 z-50 mx-auto flex max-w-7xl items-center justify-between rounded-3xl border border-slate-900/10 bg-white/85 px-4 py-3 shadow-lg shadow-slate-950/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/75 dark:shadow-slate-950/40">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/brand/stakecontrol-logo-horizontal.svg"
            alt="StakeControl"
            width={200}
            height={48}
            priority
            className="h-auto w-[170px] dark:hidden"
          />
          <Image
            src="/brand/stakecontrol-logo-white.svg"
            alt="StakeControl"
            width={200}
            height={48}
            priority
            className="hidden h-auto w-[170px] dark:block"
          />
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex dark:text-white/70">
          <a href="#producto" className="transition hover:text-slate-950 dark:hover:text-white">
            Producto
          </a>
          <a href="#precios" className="transition hover:text-slate-950 dark:hover:text-white">
            Precios
          </a>
          <a href="#seguridad" className="transition hover:text-slate-950 dark:hover:text-white">
            Seguridad
          </a>
          <a href="#responsable" className="transition hover:text-slate-950 dark:hover:text-white">
            Juego responsable
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-transparent dark:bg-transparent dark:text-white/75 dark:hover:bg-white/10 dark:hover:text-white" />
          <Link
            href="/login"
            className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 sm:inline-flex dark:text-white/75 dark:hover:bg-white/10 dark:hover:text-white"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white transition hover:bg-slate-800 dark:bg-cyan-300 dark:text-slate-950 dark:hover:bg-cyan-200"
          >
            Crear cuenta
            <ArrowRight size={15} />
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden pt-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(8,145,178,0.18),transparent_32%),radial-gradient(circle_at_82%_16%,rgba(30,58,138,0.10),transparent_30%),linear-gradient(135deg,#f8fafc_0%,#eef7fb_48%,#e7eef7_100%)] dark:bg-[radial-gradient(circle_at_18%_18%,rgba(34,211,238,0.24),transparent_32%),radial-gradient(circle_at_82%_16%,rgba(125,176,255,0.18),transparent_30%),linear-gradient(135deg,#061827_0%,#07111f_48%,#0c1728_100%)]" />
        <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(90deg,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(180deg,rgba(15,23,42,0.06)_1px,transparent_1px)] bg-[size:44px_44px] opacity-40 dark:bg-[linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.06)_1px,transparent_1px)] dark:opacity-30" />

        <div className="relative mx-auto flex max-w-7xl flex-col gap-16 px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 pb-20 pt-8 lg:grid-cols-[minmax(0,1fr)_520px] lg:pb-28 lg:pt-16">
            <section className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-700/20 bg-cyan-700/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-cyan-800 dark:border-cyan-200/25 dark:bg-cyan-200/10 dark:text-cyan-100">
                <ShieldCheck size={13} />
                Bitácora privada para apostadores deportivos
              </div>
              <h1 className="mt-6 text-5xl font-black tracking-tight text-slate-950 sm:text-6xl lg:text-7xl dark:text-white">
                Tus apuestas, stakes y rachas en una sola pantalla.
              </h1>
              <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-slate-700 dark:text-slate-200">
                StakeControl es una bitácora para quienes apuestan en deportes y quieren mirar sus números con cabeza
                fría: tickets, cuotas, mercados, stake, resultados, límites y alertas preventivas. Sin picks, sin humo,
                sin empujarte a subir el stake.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white shadow-2xl shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-cyan-300 dark:text-slate-950 dark:shadow-cyan-500/20 dark:hover:bg-cyan-200"
                >
                  Ordenar mi historial
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white/80 px-5 py-4 text-sm font-bold text-slate-900 shadow-lg shadow-slate-950/5 transition hover:bg-white dark:border-white/25 dark:bg-white/10 dark:text-white dark:shadow-slate-950/10 dark:hover:bg-white/15"
                >
                  Ya tengo cuenta
                </Link>
              </div>

              <p className="mt-5 max-w-2xl text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
                Pensado para registrar y revisar comportamiento histórico. El rendimiento pasado puede estar influido
                por muestra pequeña o varianza.
              </p>
            </section>

            <aside className="relative">
              <div className="absolute -inset-4 rounded-[2rem] bg-cyan-300/10 blur-2xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-slate-950/80 p-4 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-100/60">Dashboard</p>
                      <h2 className="mt-2 text-xl font-black">Estado bajo control</h2>
                    </div>
                    <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-200">
                      Bajo control
                    </span>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    {[
                      ["Stake mes", "$240.000"],
                      ["Frecuencia", "8/sem"],
                      ["Racha", "2 pérdidas"],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                        <p className="mt-2 text-lg font-black text-white">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-bold text-white">Exposición por categoría</p>
                      <p className="text-xs text-slate-400">Histórico</p>
                    </div>
                    {[
                      ["Fútbol", "42%", "w-[42%]"],
                      ["Tenis", "27%", "w-[27%]"],
                      ["Basket", "18%", "w-[18%]"],
                    ].map(([label, value, width]) => (
                      <div key={label} className="mb-3 last:mb-0">
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="text-slate-300">{label}</span>
                          <span className="font-semibold text-slate-400">{value}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                          <div className={`h-full rounded-full bg-cyan-300 ${width}`} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-amber-100">
                        <ShieldAlert size={15} />
                        Alerta preventiva
                      </div>
                      <p className="mt-2 text-xs leading-5 text-amber-50/75">
                        Considera revisar tus límites si aumenta la frecuencia.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-cyan-100">
                        <LockKeyhole size={15} />
                        Datos privados
                      </div>
                      <p className="mt-2 text-xs leading-5 text-cyan-50/75">
                        Cada registro pertenece solo a tu usuario.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section id="producto" className="bg-slate-50 px-4 py-20 text-slate-950 dark:bg-slate-950 dark:text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-200">Producto</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              Hecho para revisar apuestas, no para venderte picks.
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
              Una experiencia pensada para revisar stakes, cuotas, mercados, rachas, exposición por categoría y límites
              personales sin mensajes tipo casino.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {productPillars.map((pillar) => (
              <article
                key={pillar.title}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:shadow-none"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-cyan-200 dark:bg-cyan-300 dark:text-slate-950">
                  <pillar.icon size={21} />
                </div>
                <h3 className="mt-5 text-lg font-black">{pillar.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{pillar.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="precios"
        className="bg-white px-4 py-20 text-slate-950 dark:bg-[#081421] dark:text-white sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-200">
                Precios
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                Parte gratis. Sube a Premium si necesitas más lectura histórica.
              </h2>
            </div>
            <p className="max-w-md text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
              Ningún plan incluye predicciones, picks ni promesas de rendimiento. Premium agrega contexto y análisis,
              no recomendaciones para apostar más.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {pricingPlans.map((plan) => (
              <article
                key={plan.name}
                className={`relative overflow-hidden rounded-[2rem] border p-7 ${
                  plan.highlighted
                    ? "border-cyan-300/50 bg-slate-950 text-white shadow-2xl shadow-cyan-500/10 dark:bg-white/[0.07]"
                    : "border-slate-200 bg-slate-50 text-slate-950 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                }`}
              >
                {plan.highlighted ? (
                  <div className="absolute right-5 top-5 inline-flex items-center gap-2 rounded-full border border-cyan-200/25 bg-cyan-200/10 px-3 py-1 text-xs font-black text-cyan-100">
                    <Crown size={13} />
                    Premium
                  </div>
                ) : null}
                <div>
                  <h3 className="text-2xl font-black">{plan.name}</h3>
                  <p
                    className={`mt-3 max-w-xl text-sm leading-6 ${
                      plan.highlighted ? "text-slate-300" : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {plan.description}
                  </p>
                </div>
                <div className="mt-7 flex items-end gap-2">
                  <span className="text-5xl font-black tracking-tight">{plan.price}</span>
                  <span
                    className={`pb-2 text-sm font-bold ${
                      plan.highlighted ? "text-cyan-100/80" : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {plan.period}
                  </span>
                </div>
                <div className="mt-7 space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <CheckCircle2
                        size={18}
                        className={`mt-0.5 shrink-0 ${plan.highlighted ? "text-cyan-200" : "text-cyan-700 dark:text-cyan-200"}`}
                      />
                      <p
                        className={`text-sm leading-6 ${
                          plan.highlighted ? "text-slate-200" : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {feature}
                      </p>
                    </div>
                  ))}
                </div>
                <Link
                  href={plan.href}
                  className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-black transition ${
                    plan.highlighted
                      ? "bg-cyan-300 text-slate-950 hover:bg-cyan-200"
                      : "bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                  }`}
                >
                  {plan.cta}
                  <ArrowRight size={16} />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="seguridad" className="bg-white px-4 py-20 text-slate-950 dark:bg-[#07111f] dark:text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-200">Privacidad</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight">Construido para datos sensibles de apuestas.</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
              StakeControl trata tickets, historial, stakes, cuotas y reportes como información privada del usuario.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {privacyFeatures.map((feature) => (
              <article
                key={feature.title}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-white/10 dark:bg-white/[0.05]"
              >
                <feature.icon size={22} className="text-cyan-700 dark:text-cyan-200" />
                <h3 className="mt-4 text-lg font-black">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="responsable" className="bg-[#07111f] px-4 py-20 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">Responsable por diseño</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              El producto está del lado del autocontrol.
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
              La app evita lenguaje que incentive apostar. Su objetivo es ayudarte a ver límites, patrones y exposición histórica.
            </p>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
            <div className="space-y-3">
              {safetyItems.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <CheckCircle2 size={18} className="mt-0.5 text-cyan-200" />
                  <p className="text-sm leading-6 text-slate-200">{item}</p>
                </div>
              ))}
            </div>
            <Link
              href="/register"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-4 text-sm font-black text-slate-950 transition hover:bg-cyan-200"
            >
              Empezar con registro preventivo
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-50 px-4 py-8 text-slate-600 dark:border-white/10 dark:bg-[#07111f] dark:text-slate-300 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm md:flex-row md:items-center md:justify-between">
          <p className="font-semibold text-slate-800 dark:text-slate-100">StakeControl · MVP de autocontrol</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-slate-950 dark:hover:text-white">
              Términos
            </Link>
            <Link href="/privacy" className="hover:text-slate-950 dark:hover:text-white">
              Privacidad
            </Link>
            <Link href="/login" className="hover:text-slate-950 dark:hover:text-white">
              Iniciar sesión
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
