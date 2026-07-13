"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  PlusCircle,
  History,
  Ticket,
  Gauge,
  Bell,
  BrainCircuit,
  BarChart3,
  User,
  Sliders,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

/* ─────────────────────────────────────────────────────
   Navigation items definition
───────────────────────────────────────────────────── */
interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  badge?: string;
  group?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    group: "principal",
  },
  {
    id: "register",
    label: "Nuevo registro",
    href: "/bets/new",
    icon: PlusCircle,
    group: "principal",
  },
  {
    id: "history",
    label: "Historial",
    href: "/bets",
    icon: History,
    group: "principal",
  },
  {
    id: "tickets",
    label: "Cargar ticket",
    href: "/tickets",
    icon: Ticket,
    group: "principal",
  },
  {
    id: "limits",
    label: "Límites",
    href: "/limits",
    icon: Gauge,
    group: "control",
  },
  {
    id: "alerts",
    label: "Alertas",
    href: "/alerts",
    icon: Bell,
    group: "control",
  },
  {
    id: "analysis",
    label: "Análisis IA",
    href: "/analysis",
    icon: BrainCircuit,
    badge: "PRO",
    group: "control",
  },
  {
    id: "reports",
    label: "Reportes",
    href: "/reportes",
    icon: BarChart3,
    badge: "PRO",
    group: "control",
  },
  {
    id: "profile",
    label: "Perfil",
    href: "/profile",
    icon: User,
    group: "cuenta",
  },
];

const NAV_GROUPS: { id: string; label: string }[] = [
  { id: "principal", label: "Principal" },
  { id: "control", label: "Control y Alertas" },
  { id: "cuenta", label: "Mi Cuenta" },
];

/* ─────────────────────────────────────────────────────
   Sidebar component
───────────────────────────────────────────────────── */
interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function isNavItemActive(pathname: string, item: NavItem) {
  if (item.href === "/bets/new") {
    return pathname === "/bets/new";
  }

  if (item.href === "/bets") {
    return (
      pathname === "/bets" ||
      (/^\/bets\/[^/]+(?:\/edit)?$/.test(pathname) && !pathname.startsWith("/bets/new"))
    );
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Overlay — mobile only */}
      <div
        className={cn(
          "sidebar-overlay",
          isOpen && "sidebar-overlay--visible"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <aside
        id="app-sidebar"
        className={cn("sidebar", isOpen && "sidebar--open")}
        aria-label="Navegación principal"
      >
        {/* ── Logo / Brand ── */}
        <Link
          href="/dashboard"
          onClick={onClose}
          className="flex cursor-pointer items-center gap-3 px-5 py-5 border-b border-sidebar-border flex-shrink-0 transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-primary/60"
          aria-label="Ir al dashboard"
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-cyan-500/25 flex-shrink-0">
            <Sliders size={18} strokeWidth={2.5} />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-white leading-none">
              Stake<span className="text-sidebar-primary">Control</span>
            </span>
            <p className="text-[10px] text-white/50 font-medium uppercase tracking-widest leading-none mt-0.5">
              Autocontrol
            </p>
          </div>
        </Link>

        {/* ── Navigation groups ── */}
        <nav className="flex-1 py-4 overflow-y-auto" aria-label="Menú de navegación">
          {NAV_GROUPS.map((group) => {
            const items = NAV_ITEMS.filter((item) => item.group === group.id);
            if (items.length === 0) return null;

            return (
              <div key={group.id} className="mb-5">
                <p className="px-4 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-white/35 select-none">
                  {group.label}
                </p>
                <ul role="list">
                  {items.map((item) => {
                    const isActive = isNavItemActive(pathname, item);

                    return (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          className={cn("nav-item group", isActive && "active")}
                          aria-current={isActive ? "page" : undefined}
                          onClick={onClose}
                        >
                          <item.icon
                            size={17}
                            strokeWidth={isActive ? 2.5 : 2}
                            className="nav-item-icon flex-shrink-0"
                          />
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.badge && (
                            <span
                              className={cn(
                                "text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none flex-shrink-0",
                                item.badge === "PRO"
                                  ? "bg-premium/20 text-premium border border-premium/30"
                                  : "bg-danger/20 text-danger border border-danger/30"
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                          {isActive && (
                            <ChevronRight
                              size={13}
                              className="text-white/40 flex-shrink-0"
                              aria-hidden="true"
                            />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* ── Bottom disclaimer ── */}
        <div className="px-4 py-4 border-t border-sidebar-border flex-shrink-0">
          <div className="flex items-start gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
            <ShieldCheck size={14} className="text-sidebar-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
            <p className="text-[10px] text-white/50 leading-relaxed">
              Herramienta de autocontrol. No predice resultados ni recomienda apuestas.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
