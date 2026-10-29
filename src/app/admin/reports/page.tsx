"use client";

import { useEffect, useState } from "react";

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-hub-text-primary">Reports & Analytics</h1>
          <p className="text-sm text-hub-text-muted mt-1">
            Track user registrations, revenue by tier, popular resources, and referral funnels.
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-hub-surface border border-hub-border rounded px-3 py-1.5 text-xs text-hub-text-primary"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">All Time (365d)</option>
          </select>
          <button
            onClick={handleExportCSV}
            className="bg-hub-surface-elevated border border-hub-border px-3 py-1.5 rounded text-xs text-hub-text-secondary hover:text-white"
          >
            Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-hub-text-muted">Loading analytics…</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Revenue By Plan */}
          <div className="bg-hub-surface rounded-lg border border-hub-border-subtle p-5">
            <h3 className="text-sm font-semibold text-hub-text-primary mb-4">Revenue Breakdown by Tier</h3>
            <div className="space-y-3">
              {data?.revenueByPlan?.length > 0 ? (
                data.revenueByPlan.map((r: any) => (
                  <div key={r.plan_name} className="flex justify-between items-center text-sm">
                    <span className="text-hub-text-secondary">{r.plan_name}</span>
                    <span className="font-mono font-bold text-hub-gold">KES {r.total_kes?.toLocaleString()}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-hub-text-muted">No revenue recorded yet.</p>
              )}
            </div>
          </div>

          {/* Membership Distribution */}
          <div className="bg-hub-surface rounded-lg border border-hub-border-subtle p-5">
            <h3 className="text-sm font-semibold text-hub-text-primary mb-4">Active Member Distribution</h3>
            <div className="space-y-3">
              {data?.membershipDistribution?.length > 0 ? (
                data.membershipDistribution.map((m: any) => (
                  <div key={m.plan_name} className="flex justify-between items-center text-sm">
                    <span className="text-hub-text-secondary">{m.plan_name}</span>
                    <span className="font-mono font-bold text-cyan-400">{m.count} members</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-hub-text-muted">No active memberships found.</p>
              )}
            </div>
          </div>

          {/* Top Clicked Resources */}
          <div className="bg-hub-surface rounded-lg border border-hub-border-subtle p-5 md:col-span-2">
            <h3 className="text-sm font-semibold text-hub-text-primary mb-4">Most Engaged Developer Tools</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-hub-surface-elevated text-xs uppercase text-hub-text-muted">
                  <tr>
                    <th className="px-4 py-2">Resource</th>
                    <th className="px-4 py-2">Category</th>
                    <th className="px-4 py-2 text-right">Total Outbound Clicks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hub-border-subtle">
                  {data?.topResources?.map((res: any) => (
                    <tr key={res.id}>
                      <td className="px-4 py-2.5 font-medium text-hub-text-primary">{res.name}</td>
                      <td className="px-4 py-2.5 text-xs text-hub-text-muted">{res.category_name}</td>
                      <td className="px-4 py-2.5 font-mono text-right text-hub-gold font-bold">{res.click_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

