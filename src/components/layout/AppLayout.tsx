"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface AppLayoutProps {
  children: ReactNode;
  /** Optional page title shown in mobile navbar */
  pageTitle?: string;
  userName?: string;
  planLabel?: string;
  plan?: "FREE" | "PREMIUM";
  /** Extra class names for the main content area */
  contentClassName?: string;
}

/**
 * AppLayout — the shell wrapper used by all authenticated pages.
 * Renders the fixed sidebar, sticky navbar, and the scrollable content area.
 */
export function AppLayout({
  children,
  pageTitle,
  userName,
  planLabel,
  plan,
  contentClassName,
}: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell min-h-screen bg-background text-foreground">
      {/* Sidebar (fixed, full height) */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Top navbar (fixed, offset by sidebar on desktop) */}
      <Navbar
        onMenuToggle={() => setSidebarOpen((v) => !v)}
        pageTitle={pageTitle}
        userName={userName}
        planLabel={planLabel}
        plan={plan}
      />

      {/* Main content area — offset below navbar and beside sidebar */}
      <main
        id="main-content"
        tabIndex={-1}
        className={cn(
          "app-main",
          contentClassName
        )}
        aria-label="Contenido principal"
      >
        {children}
      </main>
    </div>
  );
}
