"use client";

import Link from "next/link";
import { Menu, Bell, Search, ChevronDown, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

interface NavbarProps {
  onMenuToggle: () => void;
  /** Page title to display in narrow viewports */
  pageTitle?: string;
  userName?: string;
  planLabel?: string;
}

export function Navbar({ onMenuToggle, pageTitle, userName, planLabel }: NavbarProps) {
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
            "transition-colors flex-shrink-0"
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
        <Link
          href="/alerts"
          id="notifications-btn"
          aria-label="Ver alertas de juego responsable"
          className={cn(
            "relative flex items-center justify-center w-9 h-9 rounded-xl",
            "text-muted-foreground hover:text-primary hover:bg-accent",
            "transition-colors"
          )}
        >
          <Bell size={18} />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border-2 border-card"
            aria-hidden="true"
          />
        </Link>

        {/* Divider */}
        <div className="w-px h-5 bg-border mx-1" aria-hidden="true" />

        {/* User profile */}
        <button
          type="button"
          id="user-profile-btn"
          aria-label="Menú de usuario"
          aria-haspopup="menu"
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-xl",
            "text-muted-foreground hover:text-primary hover:bg-accent",
            "transition-colors"
          )}
        >
          {/* Avatar placeholder */}
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
      </div>
    </div>
  );
}
