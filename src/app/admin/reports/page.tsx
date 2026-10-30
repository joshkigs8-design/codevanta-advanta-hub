"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Download,
  Users,
  CreditCard,
  Gem,
  Zap,
  Loader2,
  TrendingUp,
} from "lucide-react";

export default function AdminReportsPage() {
  const [period, setPeriod] = useState("30");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?period=${period}`);
      const json = await res.json();
      setData(json);
    } catch {
      alert("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [period]);

  const handleExportCSV = () => {
    if (!data) return;
    let csv = "Category,Metric,Value\n";
    if (data.revenueByPlan) {
      data.revenueByPlan.forEach((r: any) => {
        csv += `Revenue,${r.plan_name},${r.total_kes}\n`;
      });
    }
    if (data.membershipDistribution) {
      data.membershipDistribution.forEach((m: any) => {
        csv += `Subscribers,${m.plan_name},${m.count}\n`;
      });
    }
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `codevanta-report-${period}d.csv`;
    a.click();
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-hub-gold/10 border border-hub-gold/20 text-xs font-mono text-hub-gold mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>REAL-TIME PLATFORM INTELLIGENCE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Reports &amp; Analytics</h1>
          <p className="text-sm text-hub-text-secondary mt-1 max-w-2xl">
            Live telemetry tracking active members, subscription revenue, tool interactions, and referral loops.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-[#141923] border border-white/15 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-hub-gold"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">All Time (365d)</option>
          </select>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all active:scale-95 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-hub-gold" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-20 text-center text-hub-gold flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-xs font-mono">Loading telemetry data…</span>
        </div>
      ) : (
        <>
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-hub-text-secondary">TOTAL USERS</span>
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-2xl font-extrabold text-white font-mono">
                {data?.summary?.totalUsers ?? 0}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-hub-text-secondary">ACTIVE SUBSCRIBERS</span>
                <Gem className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-2xl font-extrabold text-purple-300 font-mono">
                {data?.summary?.activeMembers ?? 0}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-hub-text-secondary">REVENUE CAPTURED</span>
                <CreditCard className="w-4 h-4 text-hub-gold" />
              </div>
              <p className="text-2xl font-extrabold text-hub-gold font-mono">
                KES {(data?.summary?.totalRevenue ?? 0).toLocaleString()}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-hub-text-secondary">REFERRAL SIGNUPS</span>
                <Zap className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-extrabold text-emerald-400 font-mono">
                {data?.referralPerformance?.total_attributions ?? 0}
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Revenue By Plan */}
            <div className="bg-white/[0.02] rounded-2xl border border-white/10 p-6 space-y-4">
              <h3 className="text-sm font-semibold text-white">Revenue Breakdown by Tier</h3>
              <div className="space-y-3">
                {data?.revenueByPlan?.length > 0 ? (
                  data.revenueByPlan.map((r: any) => (
                    <div key={r.plan_name} className="flex justify-between items-center text-sm p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-hub-text-secondary">{r.plan_name}</span>
                      <span className="font-mono font-bold text-hub-gold">KES {r.total_kes?.toLocaleString()}</span>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs font-mono text-hub-text-muted">
                    No payment revenue recorded yet.
                  </div>
                )}
              </div>
            </div>

            {/* Membership Distribution */}
            <div className="bg-white/[0.02] rounded-2xl border border-white/10 p-6 space-y-4">
              <h3 className="text-sm font-semibold text-white">Active Member Distribution</h3>
              <div className="space-y-3">
                {data?.membershipDistribution?.length > 0 ? (
                  data.membershipDistribution.map((m: any) => (
                    <div key={m.plan_name} className="flex justify-between items-center text-sm p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-hub-text-secondary">{m.plan_name}</span>
                      <span className="font-mono font-bold text-cyan-400">{m.count} active</span>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs font-mono text-hub-text-muted">
                    No active memberships found.
                  </div>
                )}
              </div>
            </div>

            {/* Top Clicked Resources */}
            <div className="bg-white/[0.02] rounded-2xl border border-white/10 p-6 space-y-4 md:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Most Engaged Developer Tools</h3>
                  <p className="text-xs text-hub-text-muted mt-0.5">Real outbound link clicks initiated by developers exploring the catalog.</p>
                </div>
              </div>

              {data?.topResources && data.topResources.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-white/[0.04] text-xs font-mono uppercase text-hub-text-muted">
                      <tr>
                        <th className="px-4 py-3">Resource</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3 text-right">Total Outbound Clicks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {data.topResources.map((res: any) => (
                        <tr key={res.id} className="hover:bg-white/[0.02]">
                          <td className="px-4 py-3 font-medium text-white">{res.name}</td>
                          <td className="px-4 py-3 text-xs text-hub-text-muted">{res.category_name}</td>
                          <td className="px-4 py-3 font-mono text-right text-hub-gold font-bold">{res.click_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center space-y-2 rounded-xl bg-white/[0.01] border border-dashed border-white/10">
                  <TrendingUp className="w-6 h-6 text-hub-text-muted mx-auto" />
                  <p className="text-xs font-mono text-hub-text-secondary">No outbound clicks recorded yet.</p>
                  <p className="text-[11px] text-hub-text-muted">
                    Outbound click metrics will populate here in real-time as users browse and launch tools from the directory.
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
