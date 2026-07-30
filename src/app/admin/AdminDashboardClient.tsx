"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { AppLayout } from "@/components/layout/AppLayout";
import { AdminFeedbackPanels } from "@/components/admin/AdminFeedbackPanels";
import {
  Users,
  Crown,
  Ticket,
  Search,
  RefreshCw,
  Shield,
  CheckCircle2,
  XCircle,
  PauseCircle,
  PlayCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ArrowUpRight,
  X,
  FileText,
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  newUsersThisMonth: number;
  freeUsers: number;
  premiumMonthlyUsers: number;
  premiumAnnualUsers: number;
  totalPremiumUsers: number;
  conversionRate: string;
  totalTicketsUploaded: number;
  ticketsThisMonth: number;
  totalBetsCreated: number;
}

interface AdminUserItem {
  id: string;
  email: string;
  name: string;
  country: string;
  isAdmin: boolean;
  createdAt: string;
  isEmailVerified: boolean;
  planType: "FREE" | "PREMIUM_MONTHLY" | "PREMIUM_ANNUAL";
  subscriptionStatus: string;
  subscriptionEnd: string | null;
  ticketsCount: number;
  betsCount: number;
  isPaused: boolean;
}

interface UserTicketDetail {
  id: string;
  imageUrl: string;
  uploadedAt: string;
  aiExtraction: {
    status: string;
    rawText?: string;
    extractedData?: unknown;
  } | null;
  bet: {
    id: string;
    title: string;
    result: string;
    stake: number;
    profitLoss: number;
  } | null;
}

interface UserBetDetail {
  id: string;
  title: string;
  stake: number;
  odds: number;
  result: string;
  profitLoss: number | null;
  createdAt: string;
  sportsbook: string | null;
}

export default function AdminDashboardClient({
  adminName,
  adminEmail,
}: {
  adminName: string;
  adminEmail: string;
}) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<"ALL" | "FREE" | "PREMIUM">("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // User detail modal state
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const [userTickets, setUserTickets] = useState<UserTicketDetail[]>([]);
  const [userBets, setUserBets] = useState<UserBetDetail[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [updatingPlanUserId, setUpdatingPlanUserId] = useState<string | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Error fetching admin stats:", err);
    }
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        plan: planFilter,
        page: page.toString(),
        limit: "15",
      });
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotalPages(data.totalPages);
        setTotalUsersCount(data.totalUsers);
      }
    } catch (err) {
      console.error("Error fetching admin users:", err);
      showToast("Error al cargar lista de usuarios", "error");
    } finally {
      setLoading(false);
    }
  }, [search, planFilter, page]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchUsers()]);
    setRefreshing(false);
    showToast("Datos actualizados correctamente");
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchStats(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchUsers(); }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchUsers]);

  const handleChangePlan = async (userId: string, newPlan: "FREE" | "PREMIUM_MONTHLY" | "PREMIUM_ANNUAL") => {
    setUpdatingPlanUserId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/plan`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType: newPlan }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Plan actualizado a ${newPlan === "FREE" ? "Gratuito" : newPlan === "PREMIUM_MONTHLY" ? "Premium Mensual" : "Premium Anual"}`);
        fetchUsers();
        fetchStats();
      } else {
        showToast(data.error || "Error al cambiar plan", "error");
      }
    } catch (err) {
      console.error("Error changing plan:", err);
      showToast("Error de conexión al cambiar plan", "error");
    } finally {
      setUpdatingPlanUserId(null);
    }
  };

  const handleTogglePause = async (userItem: AdminUserItem) => {
    try {
      const res = await fetch(`/api/admin/users/${userItem.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_pause" }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message);
        fetchUsers();
      } else {
        showToast(data.error || "Error al cambiar estado", "error");
      }
    } catch (err) {
      console.error("Error toggling pause:", err);
      showToast("Error de conexión", "error");
    }
  };

  const handleOpenUserDetail = async (userItem: AdminUserItem) => {
    setSelectedUser(userItem);
    setLoadingTickets(true);
    setUserTickets([]);
    setUserBets([]);

    try {
      const res = await fetch(`/api/admin/users/${userItem.id}/tickets`);
      if (res.ok) {
        const data = await res.json();
        setUserTickets(data.tickets || []);
        setUserBets(data.bets || []);
      }
    } catch (err) {
      console.error("Error loading user tickets detail:", err);
      showToast("Error al cargar detalles de tickets del usuario", "error");
    } finally {
      setLoadingTickets(false);
    }
  };

  return (
    <AppLayout pageTitle="Panel de Administración" userName={adminName}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl text-sm font-medium transition-all transform animate-in fade-in slide-in-from-bottom-4 ${
            toastMessage.type === "success"
              ? "bg-emerald-950/90 text-emerald-200 border-emerald-500/30"
              : "bg-rose-950/90 text-rose-200 border-rose-500/30"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="text-emerald-400 h-5 w-5 flex-shrink-0" />
          ) : (
            <XCircle className="text-rose-400 h-5 w-5 flex-shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-indigo-950/40 p-6 rounded-2xl border border-white/10 backdrop-blur-md">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Panel de Control Interno
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">
                  Administración de usuarios, suscripciones y volumen de tickets
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Admin: {adminEmail}
            </span>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Users */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3 relative overflow-hidden group hover:border-indigo-500/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Usuarios Totales
                </span>
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-white">
                  {stats.totalUsers.toLocaleString()}
                </span>
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-0.5">
                  <ArrowUpRight className="h-3.5 w-3.5" />+{stats.newUsersThisMonth} este mes
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: "100%" }}></div>
              </div>
            </div>

            {/* Premium vs Free */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3 relative overflow-hidden group hover:border-amber-500/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Usuarios Premium
                </span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <Crown className="h-5 w-5" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-amber-400">
                  {stats.totalPremiumUsers}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {stats.freeUsers} versión Free
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Mensual: {stats.premiumMonthlyUsers}</span>
                <span>Anual: {stats.premiumAnnualUsers}</span>
              </div>
            </div>

            {/* Total Tickets Uploaded */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Tickets Usados / Escaneados
                </span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Ticket className="h-5 w-5" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-white">
                  {stats.totalTicketsUploaded.toLocaleString()}
                </span>
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-0.5">
                  +{stats.ticketsThisMonth} este mes
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Apuestas registradas: <span className="text-slate-200 font-semibold">{stats.totalBetsCreated}</span>
              </div>
            </div>

            {/* Conversion Rate */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3 relative overflow-hidden group hover:border-cyan-500/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Tasa de Conversión
                </span>
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-cyan-400">
                  {stats.conversionRate}%
                </span>
                <span className="text-xs text-slate-400">Premium / Total</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-400 h-full rounded-full"
                  style={{ width: `${Math.min(parseFloat(stats.conversionRate), 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <AdminFeedbackPanels />

        {/* Search, Filter & Users Table Container */}
        <div className="bg-slate-900/70 border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
          {/* Table Header Controls */}
          <div className="p-5 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o correo..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 self-start md:self-auto">
              <button
                onClick={() => {
                  setPlanFilter("ALL");
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  planFilter === "ALL"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Todos ({totalUsersCount})
              </button>
              <button
                onClick={() => {
                  setPlanFilter("FREE");
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  planFilter === "FREE"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Gratis
              </button>
              <button
                onClick={() => {
                  setPlanFilter("PREMIUM");
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  planFilter === "PREMIUM"
                    ? "bg-amber-500 text-slate-950 font-bold shadow-md"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Premium
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-white/[0.02] text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Plan Actual</th>
                  <th className="px-6 py-4 text-center">Tickets Usados</th>
                  <th className="px-6 py-4 text-center">Apuestas</th>
                  <th className="px-6 py-4">Estado Cuenta</th>
                  <th className="px-6 py-4 text-right">Acciones de Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      <div className="flex justify-center items-center gap-2">
                        <RefreshCw className="h-5 w-5 animate-spin text-indigo-400" />
                        <span>Cargando usuarios...</span>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      No se encontraron usuarios con el criterio especificado.
                    </td>
                  </tr>
                ) : (
                  users.map((userItem) => (
                    <tr
                      key={userItem.id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      {/* User Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white flex-shrink-0 shadow-inner">
                            {userItem.name ? userItem.name.charAt(0).toUpperCase() : userItem.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-white flex items-center gap-2">
                              <span>{userItem.name}</span>
                              {userItem.isAdmin && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                                  ADMIN
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 font-mono">
                              {userItem.email}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Registrado: {new Date(userItem.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Subscription Plan */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {userItem.planType === "FREE" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 w-fit">
                              Gratuito (Free)
                            </span>
                          ) : userItem.planType === "PREMIUM_MONTHLY" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 w-fit">
                              <Crown className="h-3.5 w-3.5 text-amber-400" />
                              Premium Mensual
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-amber-300 border border-amber-500/40 w-fit">
                              <Crown className="h-3.5 w-3.5 text-amber-400" />
                              Premium Anual
                            </span>
                          )}

                          {userItem.subscriptionEnd && (
                            <span className="text-[10px] text-slate-400">
                              Vence: {new Date(userItem.subscriptionEnd).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Tickets Count */}
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 text-xs">
                          <Ticket className="h-3.5 w-3.5" />
                          {userItem.ticketsCount} tickets
                        </span>
                      </td>

                      {/* Bets Count */}
                      <td className="px-6 py-4 text-center">
                        <span className="text-slate-300 font-semibold">
                          {userItem.betsCount}
                        </span>
                      </td>

                      {/* Account Status */}
                      <td className="px-6 py-4">
                        {userItem.isPaused ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            <PauseCircle className="h-3.5 w-3.5" />
                            Apuestas Pausadas
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Activo
                          </span>
                        )}
                      </td>

                      {/* Quick Actions */}
                      <td className="px-6 py-4 text-right space-x-2">
                        <div className="flex items-center justify-end gap-2">
                          {/* Plan Switcher Dropdown */}
                          <select
                            disabled={updatingPlanUserId === userItem.id}
                            value={userItem.planType}
                            onChange={(e) =>
                              handleChangePlan(
                                userItem.id,
                                e.target.value as "FREE" | "PREMIUM_MONTHLY" | "PREMIUM_ANNUAL"
                              )
                            }
                            className="bg-slate-800 text-xs text-white border border-white/10 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer hover:bg-slate-700 transition-colors"
                          >
                            <option value="FREE">Hacer Gratis</option>
                            <option value="PREMIUM_MONTHLY">Promover a Premium Mensual</option>
                            <option value="PREMIUM_ANNUAL">Promover a Premium Anual</option>
                          </select>

                          {/* Pause Toggle Button */}
                          <button
                            title={userItem.isPaused ? "Reactivar apuestas" : "Pausar apuestas"}
                            onClick={() => handleTogglePause(userItem)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              userItem.isPaused
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
                            }`}
                          >
                            {userItem.isPaused ? <PlayCircle className="h-4 w-4" /> : <PauseCircle className="h-4 w-4" />}
                          </button>

                          {/* View Detail Button */}
                          <button
                            title="Ver tickets e historial"
                            onClick={() => handleOpenUserDetail(userItem)}
                            className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/20 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <div>
                Página <span className="text-white font-semibold">{page}</span> de{" "}
                <span className="text-white font-semibold">{totalPages}</span> ({totalUsersCount} usuarios)
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Tickets & Activity Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-3xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-lg">
                {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : selectedUser.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{selectedUser.name}</h3>
                <p className="text-xs text-slate-400 font-mono">{selectedUser.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    Plan: {selectedUser.planType}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {selectedUser.ticketsCount} tickets subidos
                  </span>
                </div>
              </div>
            </div>

            {/* Content Tabs / Info */}
            {loadingTickets ? (
              <div className="py-12 text-center text-slate-400 flex justify-center items-center gap-2">
                <RefreshCw className="h-5 w-5 animate-spin text-indigo-400" />
                <span>Cargando detalle de tickets...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Tickets Section */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-indigo-400" />
                    Tickets de Apuesta Escaneados ({userTickets.length})
                  </h4>

                  {userTickets.length === 0 ? (
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-slate-400 text-center">
                      El usuario aún no ha subido imágenes de tickets.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {userTickets.map((ticket) => (
                        <div
                          key={ticket.id}
                          className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3"
                        >
                          <div className="h-16 w-16 bg-slate-800 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 flex items-center justify-center text-slate-500">
                            {ticket.imageUrl ? (
                              <Image
                                src={ticket.imageUrl}
                                alt="Ticket"
                                width={64}
                                height={64}
                                unoptimized
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <FileText className="h-6 w-6" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 text-xs space-y-1">
                            <div className="text-slate-300 font-semibold truncate">
                              {ticket.bet?.title || "Ticket procesado con IA"}
                            </div>
                            <div className="text-slate-400 text-[11px]">
                              Fecha: {new Date(ticket.uploadedAt).toLocaleDateString()}
                            </div>
                            {ticket.bet && (
                              <div className="text-emerald-400 text-[11px] font-mono">
                                Monto: ${ticket.bet.stake}
                              </div>
                            )}
                            {ticket.aiExtraction && (
                              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                OCR Extraído
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bets Section */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-400" />
                    Últimas Apuestas Registradas ({userBets.length})
                  </h4>

                  {userBets.length === 0 ? (
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-slate-400 text-center">
                      No hay apuestas en el historial de este usuario.
                    </div>
                  ) : (
                    <div className="divide-y divide-white/10 rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                      {userBets.slice(0, 10).map((bet) => (
                        <div key={bet.id} className="p-3 flex items-center justify-between text-xs">
                          <div>
                            <div className="text-white font-medium">{bet.title}</div>
                            <div className="text-[11px] text-slate-400">
                              {bet.sportsbook || "Casa no descrita"} • Cuota: {bet.odds}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-slate-200 font-mono">${bet.stake}</div>
                            <span
                              className={`text-[10px] font-bold ${
                                bet.result === "WON"
                                  ? "text-emerald-400"
                                  : bet.result === "LOST"
                                  ? "text-rose-400"
                                  : "text-amber-400"
                              }`}
                            >
                              {bet.result}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
