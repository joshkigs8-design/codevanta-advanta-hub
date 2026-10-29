"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/* ── Stat types ── */
interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  pendingPayments: number;
}

interface RecentUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

interface AuditLogEntry {
  id: string;
  admin_user_id: string;
  admin_name: string;
  action: string;
  target_entity: string;
  target_id: string;
  details: string;
  created_at: string;
}

interface ReferralStats {
  totalCodes: number;
  totalAttributions: number;
  totalRewards: number;
  pendingRewards: number;
}

interface DashboardData {
  recentUsers: RecentUser[];
  recentAuditLogs: AuditLogEntry[];
  referralStats: ReferralStats;
  totalReferrals: number;
}

/* ── Stat card config ── */
interface StatCardConfig {
  title: string;
  value: string;
  icon: string;
  color: string;
  bgColor: string;
}

/* ── Quick action ── */
interface QuickAction {
  label: string;
  href: string;
  icon: string;
}

/* ── Helpers ── */
function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-KE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-KE", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function roleBadge(role: string) {
  switch (role) {
    case "admin":
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-red-950/60 text-red-400 border border-red-800/40 uppercase">
          Admin
        </span>
      );
    case "member":
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-hub-gold/15 text-hub-gold border border-hub-gold/30 uppercase">
          Member
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-hub-surface-elevated text-hub-text-muted border border-hub-border uppercase">
          User
        </span>
      );
  }
}

/* ──────────── Main Component ──────────── */
export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, dashRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/dashboard"),
        ]);
        const statsJson = await statsRes.json();
        const dashJson = await dashRes.json();

        if (!statsRes.ok)
          throw new Error(statsJson.error || "Failed to load stats");
        if (!dashRes.ok)
          throw new Error(dashJson.error || "Failed to load dashboard");

        setStats(statsJson);
        setDashData(dashJson);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Network error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-hub-gold border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-hub-text-muted">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-hub-surface border border-red-800/40 rounded-lg p-6 max-w-sm text-center">
          <p className="text-red-400 font-medium mb-2">Error loading data</p>
          <p className="text-sm text-hub-text-muted mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-hub-gold text-white hover:bg-hub-gold-hover rounded px-4 py-2 font-medium text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  /* ── Stat cards config ── */
  const statCards: StatCardConfig[] = [
    {
      title: "Total Users",
      value: (stats?.totalUsers ?? 0).toString(),
      icon: "👥",
      color: "text-hub-status-info",
      bgColor: "bg-blue-950/30",
    },
    {
      title: "Active Users (30d)",
      value: (stats?.activeUsers ?? 0).toString(),
      icon: "🟢",
      color: "text-hub-status-verified",
      bgColor: "bg-emerald-950/30",
    },
    {
      title: "Active Subscriptions",
      value: (stats?.activeSubscriptions ?? 0).toString(),
      icon: "💎",
      color: "text-purple-400",
      bgColor: "bg-purple-950/30",
    },
    {
      title: "Total Revenue (KES)",
      value: formatCurrency(stats?.totalRevenue ?? 0),
      icon: "💰",
      color: "text-hub-gold",
      bgColor: "bg-hub-gold/10",
    },
    {
      title: "Pending Payments",
      value: (stats?.pendingPayments ?? 0).toString(),
      icon: "⏳",
      color: "text-hub-status-pending",
      bgColor: "bg-yellow-950/30",
    },
    {
      title: "Total Referrals",
      value: (dashData?.totalReferrals ?? 0).toString(),
      icon: "🔗",
      color: "text-cyan-400",
      bgColor: "bg-cyan-950/30",
    },
  ];

  /* ── Quick actions ── */
  const quickActions: QuickAction[] = [
    { label: "Add Resource", href: "/admin/resources", icon: "➕" },
    { label: "View Payments", href: "/admin/payments", icon: "💳" },
    { label: "Manage Users", href: "/admin/users", icon: "👥" },
    { label: "View Reports", href: "/admin/reports", icon: "📈" },
    { label: "Audit Log", href: "/admin/audit-log", icon: "📋" },
    { label: "Settings", href: "/admin/settings", icon: "⚙️" },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-hub-text-primary">Dashboard</h1>
        <p className="text-sm text-hub-text-muted mt-1">
          Overview of CodeVanta Hub activity and metrics
        </p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((card) => (
          <div
            key={card.title}
            className={`rounded-lg border border-hub-border-subtle p-4 ${card.bgColor} backdrop-blur-sm`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-hub-text-muted font-medium uppercase tracking-wide">
                {card.title}
              </span>
              <span className="text-lg">{card.icon}</span>
            </div>
            <p className={`text-2xl font-bold font-mono ${card.color}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Two-column section ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Users */}
        <div className="bg-hub-surface rounded-lg border border-hub-border-subtle overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-hub-border">
            <h2 className="text-sm font-semibold text-hub-text-primary">
              Recent Registrations
            </h2>
            <Link
              href="/admin/users"
              className="text-xs text-hub-gold hover:text-hub-gold-hover font-medium"
            >
              View all →
            </Link>
          </div>
          {dashData?.recentUsers && dashData.recentUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-hub-surface-elevated text-hub-text-muted text-xs uppercase tracking-wide">
                    <th className="text-left px-5 py-2.5 font-medium">Name</th>
                    <th className="text-left px-5 py-2.5 font-medium">Email</th>
                    <th className="text-left px-5 py-2.5 font-medium">Role</th>
                    <th className="text-left px-5 py-2.5 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hub-border-subtle">
                  {dashData.recentUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-hub-surface-elevated/50 transition-colors"
                    >
                      <td className="px-5 py-3 text-hub-text-primary font-medium whitespace-nowrap">
                        {u.full_name}
                      </td>
                      <td className="px-5 py-3 text-hub-text-secondary font-mono text-xs whitespace-nowrap">
                        {u.email}
                      </td>
                      <td className="px-5 py-3">{roleBadge(u.role)}</td>
                      <td className="px-5 py-3 text-hub-text-muted text-xs whitespace-nowrap">
                        {formatDate(u.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center py-10 text-hub-text-muted text-sm">
              No users registered yet
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-hub-surface rounded-lg border border-hub-border-subtle overflow-hidden">
          <div className="px-5 py-4 border-b border-hub-border">
            <h2 className="text-sm font-semibold text-hub-text-primary">
              Quick Actions
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-5">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex flex-col items-center gap-2 p-4 rounded-lg bg-hub-surface-elevated border border-hub-border-subtle hover:border-hub-gold/30 hover:bg-hub-gold/5 transition-colors group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">
                  {action.icon}
                </span>
                <span className="text-xs font-medium text-hub-text-secondary group-hover:text-hub-text-primary text-center">
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Audit Logs ── */}
      <div className="bg-hub-surface rounded-lg border border-hub-border-subtle overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-hub-border">
          <h2 className="text-sm font-semibold text-hub-text-primary">
            Recent Audit Logs
          </h2>
          <Link
            href="/admin/audit-log"
            className="text-xs text-hub-gold hover:text-hub-gold-hover font-medium"
          >
            View all →
          </Link>
        </div>
        {dashData?.recentAuditLogs && dashData.recentAuditLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-hub-surface-elevated text-hub-text-muted text-xs uppercase tracking-wide">
                  <th className="text-left px-5 py-2.5 font-medium">Admin</th>
                  <th className="text-left px-5 py-2.5 font-medium">Action</th>
                  <th className="text-left px-5 py-2.5 font-medium">Target</th>
                  <th className="text-left px-5 py-2.5 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hub-border-subtle">
                {dashData.recentAuditLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-hub-surface-elevated/50 transition-colors"
                  >
                    <td className="px-5 py-3 text-hub-text-primary font-medium whitespace-nowrap">
                      {log.admin_name}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-mono font-medium rounded bg-hub-surface-elevated text-hub-text-secondary border border-hub-border-subtle">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-hub-text-secondary text-xs font-mono whitespace-nowrap">
                      {log.target_entity}
                      {log.target_id ? ` / ${log.target_id.slice(0, 8)}…` : ""}
                    </td>
                    <td className="px-5 py-3 text-hub-text-muted text-xs whitespace-nowrap">
                      {formatDateTime(log.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center py-10 text-hub-text-muted text-sm">
            No audit logs recorded yet
          </div>
        )}
      </div>

      {/* ── Referral Stats Bar ── */}
      {dashData?.referralStats && (
        <div className="bg-hub-surface rounded-lg border border-hub-border-subtle p-5">
          <h2 className="text-sm font-semibold text-hub-text-primary mb-4">
            Referral Program Overview
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold font-mono text-hub-status-info">
                {dashData.referralStats.totalCodes}
              </p>
              <p className="text-xs text-hub-text-muted mt-1">
                Referral Codes
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold font-mono text-hub-status-verified">
                {dashData.referralStats.totalAttributions}
              </p>
              <p className="text-xs text-hub-text-muted mt-1">Attributions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold font-mono text-hub-gold">
                {dashData.referralStats.totalRewards}
              </p>
              <p className="text-xs text-hub-text-muted mt-1">Total Rewards</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold font-mono text-hub-status-pending">
                {dashData.referralStats.pendingRewards}
              </p>
              <p className="text-xs text-hub-text-muted mt-1">
                Pending Rewards
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
