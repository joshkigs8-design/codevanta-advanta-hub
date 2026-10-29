"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Gem,
  Plus,
  RefreshCw,
  ShieldCheck,
  Users,
  WalletCards,
  Zap,
} from "lucide-react";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  pendingPayments: number;
}
interface RecentUser { id: string; full_name: string; email: string; role: string; created_at: string; }
interface AuditLogEntry { id: string; admin_name: string; action: string; target_entity: string; target_id: string; created_at: string; }
interface DashboardData {
  recentUsers: RecentUser[];
  recentAuditLogs: AuditLogEntry[];
  referralStats: { totalCodes: number; totalAttributions: number; totalRewards: number; pendingRewards: number };
  totalReferrals: number;
}

const currency = (amount: number) => new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(amount);
const date = (value: string) => new Date(value).toLocaleDateString("en-KE", { month: "short", day: "numeric" });
const time = (value: string) => new Date(value).toLocaleString("en-KE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsResponse, dashboardResponse] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/dashboard"),
      ]);
      const statsJson = await statsResponse.json();
      const dashboardJson = await dashboardResponse.json();
      if (!statsResponse.ok) throw new Error(statsJson.error || "Failed to load metrics");
      if (!dashboardResponse.ok) throw new Error(dashboardJson.error || "Failed to load activity");
      setStats(statsJson);
      setData(dashboardJson);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return <div className="admin-loading"><RefreshCw className="animate-spin text-hub-gold" size={22} /><span>Loading command center…</span></div>;
  }
  if (error) {
    return (
      <div className="admin-empty-state">
        <ShieldCheck className="mb-3 text-red-400" size={28} />
        <h2 className="font-semibold text-white">Couldn’t load your workspace</h2>
        <p className="mt-1 text-sm text-hub-text-muted">{error}</p>
        <button onClick={load} className="mt-5 rounded-xl bg-hub-gold px-4 py-2 text-sm font-semibold text-white">Try again</button>
      </div>
    );
  }

  const metrics = [
    { label: "Total users", value: stats?.totalUsers ?? 0, change: "All registered accounts", icon: Users, tone: "blue" },
    { label: "Active subscriptions", value: stats?.activeSubscriptions ?? 0, change: "Currently paying", icon: Gem, tone: "purple" },
    { label: "Revenue captured", value: `KES ${currency(stats?.totalRevenue ?? 0)}`, change: "Across all plans", icon: CircleDollarSign, tone: "gold" },
    { label: "Pending payments", value: stats?.pendingPayments ?? 0, change: "Needs attention", icon: Clock3, tone: "amber" },
  ];

  const actions = [
    { label: "Add resource", href: "/admin/resources", icon: Plus },
    { label: "Review payments", href: "/admin/payments", icon: CreditCard },
    { label: "Manage users", href: "/admin/users", icon: Users },
    { label: "Open reports", href: "/admin/reports", icon: BarChart3 },
  ];

  return (
    <div className="mx-auto max-w-[1500px] space-y-7">
      <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-hub-gold">
            <span className="h-1.5 w-1.5 rounded-full bg-hub-gold" /> Operations overview
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Good morning, admin.</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-hub-text-secondary">The latest signal from your CodeVanta community, revenue, and growth loops.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-hub-text-muted sm:inline">Updated just now</span>
          <button onClick={load} className="flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-3.5 py-2.5 text-xs font-semibold text-hub-text-secondary hover:border-hub-gold/40 hover:text-white">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className={`metric-card metric-${metric.tone}`}>
              <div className="flex items-start justify-between">
                <span className="text-xs font-medium text-hub-text-secondary">{metric.label}</span>
                <span className="metric-icon"><Icon size={17} /></span>
              </div>
              <p className="mt-5 text-2xl font-bold tracking-tight text-white">{metric.value}</p>
              <p className="mt-1 text-[11px] text-hub-text-muted">{metric.change}</p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.45fr_0.85fr]">
        <div className="admin-panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
            <div><h2 className="text-sm font-semibold text-white">New members</h2><p className="mt-1 text-xs text-hub-text-muted">Latest registrations across the platform</p></div>
            <Link href="/admin/users" className="flex items-center gap-1 text-xs font-semibold text-hub-gold hover:text-white">View all <ArrowUpRight size={13} /></Link>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {data?.recentUsers?.length ? data.recentUsers.map((member) => (
              <div key={member.id} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-white/[0.025]">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-hub-gold/25 to-slate-800 text-xs font-bold uppercase text-hub-gold">{member.full_name?.charAt(0) || "U"}</div>
                  <div className="min-w-0"><p className="truncate text-sm font-medium text-white">{member.full_name}</p><p className="truncate text-xs text-hub-text-muted">{member.email}</p></div>
                </div>
                <div className="shrink-0 text-right"><span className="status-pill">{member.role}</span><p className="mt-1 text-[10px] text-hub-text-muted">{date(member.created_at)}</p></div>
              </div>
            )) : <div className="admin-empty-state py-12">No new members yet.</div>}
          </div>
        </div>

        <div className="admin-panel p-5">
          <div className="mb-5 flex items-start justify-between"><div><h2 className="text-sm font-semibold text-white">Quick actions</h2><p className="mt-1 text-xs text-hub-text-muted">Jump into your most-used tools</p></div><Zap className="text-hub-gold" size={18} /></div>
          <div className="grid grid-cols-2 gap-3">
            {actions.map((action) => { const Icon = action.icon; return <Link key={action.href} href={action.href} className="action-card"><Icon size={18} /><span>{action.label}</span><ArrowUpRight className="ml-auto opacity-40" size={14} /></Link>; })}
          </div>
          <div className="mt-5 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.05] p-3.5"><div className="flex items-center gap-2 text-xs font-semibold text-emerald-300"><CheckCircle2 size={15} /> Platform health is good</div><p className="mt-1 pl-5 text-[11px] text-hub-text-muted">All core services are responding normally.</p></div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <div className="admin-panel p-5">
          <div className="mb-5 flex items-center justify-between"><div><h2 className="text-sm font-semibold text-white">Referral engine</h2><p className="mt-1 text-xs text-hub-text-muted">Your community-led growth signal</p></div><Link href="/admin/referrals" className="text-hub-gold"><ArrowUpRight size={16} /></Link></div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[["Codes", data?.referralStats.totalCodes ?? 0], ["Attributions", data?.referralStats.totalAttributions ?? 0], ["Rewards", data?.referralStats.totalRewards ?? 0], ["Pending", data?.referralStats.pendingRewards ?? 0]].map(([label, value]) => <div key={label} className="rounded-xl bg-white/[0.03] p-3"><p className="text-xl font-bold text-white">{value}</p><p className="mt-1 text-[11px] text-hub-text-muted">{label}</p></div>)}
          </div>
        </div>
        <div className="admin-panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4"><div><h2 className="text-sm font-semibold text-white">Recent activity</h2><p className="mt-1 text-xs text-hub-text-muted">A transparent trail of admin actions</p></div><Link href="/admin/audit-log" className="text-hub-gold"><ArrowUpRight size={16} /></Link></div>
          <div className="divide-y divide-white/[0.06]">
            {data?.recentAuditLogs?.slice(0, 4).map((log) => <div key={log.id} className="flex items-center gap-3 px-5 py-3"><div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-hub-gold/10 text-hub-gold"><WalletCards size={14} /></div><div className="min-w-0 flex-1"><p className="truncate text-xs text-white"><span className="font-semibold">{log.admin_name}</span> {log.action.toLowerCase()}</p><p className="text-[10px] text-hub-text-muted">{log.target_entity} · {time(log.created_at)}</p></div></div>)}
            {!data?.recentAuditLogs?.length && <div className="admin-empty-state py-10">No activity recorded yet.</div>}
          </div>
        </div>
      </section>
    </div>
  );
}
