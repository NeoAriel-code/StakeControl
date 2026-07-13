"use client";

import Link from "next/link";
import { Bell, ChevronDown, Crown, LogOut, Menu, Search, Settings, User, UserCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { logoutAction } from "@/lib/auth-actions";

type UnreadAlert = {
  id: string;
  title: string;
  message: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  createdAt: string;
};

interface NavbarProps {
  onMenuToggle: () => void;
  /** Page title to display in narrow viewports */
  pageTitle?: string;
  userName?: string;
  planLabel?: string;
  plan?: "FREE" | "PREMIUM";
}

export function Navbar({ onMenuToggle, pageTitle, userName, planLabel, plan }: NavbarProps) {
  const [pendingAlertCount, setPendingAlertCount] = useState(0);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadAlerts, setUnreadAlerts] = useState<UnreadAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const alertsMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  async function loadUnreadAlerts() {
    setAlertsLoading(true);

    try {
      const response = await fetch("/api/alerts/unread", {
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as {
        alerts?: UnreadAlert[];
        count?: number;
      };

      setUnreadAlerts(data.alerts ?? []);
      setPendingAlertCount(data.count ?? 0);
    } finally {
      setAlertsLoading(false);
    }
  }

  async function markUnreadAlertsAsRead() {
    const response = await fetch("/api/alerts/unread", {
      method: "PATCH",
      cache: "no-store",
    });

    if (!response.ok) {
      return;
    }

    setUnreadAlerts([]);
    setPendingAlertCount(0);
  }

  useEffect(() => {
    let isMounted = true;

    async function loadPendingAlertCount() {
      try {
        const response = await fetch("/api/alerts/unread-count", {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { count?: number };

        if (isMounted) {
          setPendingAlertCount(data.count ?? 0);
        }
      } catch {
        if (isMounted) {
          setPendingAlertCount(0);
        }
      }
    }

    loadPendingAlertCount();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!alertsOpen) {
      return;
    }

    loadUnreadAlerts();
  }, [alertsOpen]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!alertsMenuRef.current?.contains(event.target as Node)) {
        setAlertsOpen(false);
      }

      if (!userMenuRef.current?.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAlertsOpen(false);
        setUserMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const notificationLabel =
    pendingAlertCount > 0
      ? `Ver alertas de juego responsable, ${pendingAlertCount} pendiente${pendingAlertCount === 1 ? "" : "s"}`
      : "Ver alertas de juego responsable";

  return (
    <div className="app-navbar-bar" role="banner">
      {/* Left: hamburger (mobile) + optional page title */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          type="button"
          id="sidebar-toggle"
          onClick={onMenuToggle}
          aria-label="Abrir menú de navegación"
          aria-controls="app-sidebar"
          aria-expanded="false"
          className={cn(
            "lg:hidden flex items-center justify-center w-9 h-9 rounded-xl",
            "text-muted-foreground hover:text-primary hover:bg-accent",
            "cursor-pointer transition-colors flex-shrink-0"
          )}
        >
          <Menu size={20} />
        </button>

        {/* Divider */}
        <div className="hidden lg:block w-px h-5 bg-border" aria-hidden="true" />

        {/* Search bar */}
        <div className="relative flex-1 max-w-sm hidden md:flex items-center">
          <Search
            size={15}
            className="absolute left-3 text-soft pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="navbar-search"
            type="search"
            placeholder="Buscar apuestas, eventos…"
            aria-label="Buscar en StakeControl"
            className={cn(
              "w-full pl-9 pr-4 py-2 text-sm rounded-xl",
              "bg-muted border border-transparent text-foreground placeholder:text-soft",
              "focus:outline-none focus:bg-card focus:border-primary/30 focus:ring-2 focus:ring-primary/10",
              "transition-all duration-200"
            )}
          />
        </div>

        {/* Mobile page title */}
        {pageTitle && (
          <span className="md:hidden text-sm font-semibold text-foreground truncate">
            {pageTitle}
          </span>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <ThemeToggle />

        {/* Notifications */}
        <div ref={alertsMenuRef} className="relative">
          <button
            type="button"
            id="notifications-btn"
            aria-label={notificationLabel}
            aria-expanded={alertsOpen}
            aria-haspopup="dialog"
            onClick={() => setAlertsOpen((open) => !open)}
            className={cn(
              "relative flex items-center justify-center w-9 h-9 rounded-xl",
              "text-muted-foreground hover:text-primary hover:bg-accent",
              "cursor-pointer transition-colors"
            )}
          >
            <Bell size={18} />
            {pendingAlertCount > 0 && (
              <span
                className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-card bg-destructive px-1 text-[10px] font-bold leading-none text-white"
                aria-hidden="true"
              >
                {pendingAlertCount > 99 ? "99+" : pendingAlertCount}
              </span>
            )}
          </button>

          {alertsOpen && (
            <div
              role="dialog"
              aria-label="Alertas no leídas"
              className="absolute right-0 top-11 z-50 w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border border-border bg-card p-3 shadow-xl"
            >
              <div className="flex items-start justify-between gap-3 px-1 pb-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Alertas no leídas</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {pendingAlertCount} pendiente{pendingAlertCount === 1 ? "" : "s"}
                  </p>
                </div>
                {pendingAlertCount > 0 && (
                  <button
                    type="button"
                    onClick={markUnreadAlertsAsRead}
                    className="cursor-pointer rounded-lg border border-border-strong px-2.5 py-1.5 text-xs font-semibold text-foreground transition hover:bg-background"
                  >
                    Marcar leídas
                  </button>
                )}
              </div>

              <div className="max-h-80 space-y-2 overflow-y-auto">
                {alertsLoading ? (
                  <div className="rounded-xl bg-background p-3 text-sm text-muted-foreground">
                    Cargando alertas...
                  </div>
                ) : unreadAlerts.length === 0 ? (
                  <div className="rounded-xl bg-background p-3 text-sm text-muted-foreground">
                    No tienes alertas no leídas.
                  </div>
                ) : (
                  unreadAlerts.map((alert) => (
                    <article key={alert.id} className="rounded-xl border border-border bg-background p-3">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-sm font-semibold text-foreground">{alert.title}</h3>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-bold",
                            alert.severity === "HIGH" && "bg-danger-soft text-danger",
                            alert.severity === "MEDIUM" && "bg-warning-soft text-warning",
                            alert.severity === "LOW" && "bg-muted text-muted-foreground"
                          )}
                        >
                          {alert.severity}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                        {alert.message}
                      </p>
                    </article>
                  ))
                )}
              </div>

              <Link
                href="/alerts"
                onClick={() => setAlertsOpen(false)}
                className="mt-3 flex cursor-pointer items-center justify-center rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
              >
                Ver historial completo
              </Link>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-border mx-1" aria-hidden="true" />

        {/* User profile */}
        <div ref={userMenuRef} className="relative">
          <button
            type="button"
            id="user-profile-btn"
            aria-label="Menú de usuario"
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
            onClick={() => setUserMenuOpen((open) => !open)}
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded-xl",
              "text-muted-foreground hover:text-primary hover:bg-accent",
              "cursor-pointer transition-colors"
            )}
          >
            <div
              className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0"
              aria-hidden="true"
            >
              <User size={14} strokeWidth={2} />
            </div>
            <div className="hidden sm:flex flex-col items-start leading-none">
              <span className="text-xs font-semibold text-foreground">{userName ?? "StakeControl"}</span>
              <span className="text-[10px] text-soft">{planLabel ?? "Plan Free"}</span>
            </div>
            <ChevronDown size={13} className="hidden sm:block text-soft" aria-hidden="true" />
          </button>

          {userMenuOpen && (
            <div
              role="menu"
              aria-label="Menú de usuario"
              className="absolute right-0 top-11 z-50 w-64 rounded-2xl border border-border bg-card p-2 shadow-xl"
            >
              <div className="border-b border-border px-3 py-3">
                <p className="truncate text-sm font-semibold text-foreground">{userName ?? "StakeControl"}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{planLabel ?? "Plan Free"}</p>
              </div>

              <div className="py-2">
                <Link
                  href="/profile"
                  role="menuitem"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-foreground transition hover:bg-background"
                >
                  <UserCircle size={16} />
                  Perfil
                </Link>
                <Link
                  href={plan === "PREMIUM" ? "/upgrade" : "/upgrade"}
                  role="menuitem"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-foreground transition hover:bg-background"
                >
                  <Crown size={16} />
                  {plan === "PREMIUM" ? "Plan" : "Upgrade"}
                </Link>
                <Link
                  href="/settings"
                  role="menuitem"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-foreground transition hover:bg-background"
                >
                  <Settings size={16} />
                  Configuración
                </Link>
              </div>

              <form action={logoutAction} className="border-t border-border pt-2">
                <button
                  type="submit"
                  role="menuitem"
                  className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-danger transition hover:bg-danger-soft"
                >
                  <LogOut size={16} />
                  Cerrar sesión
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
