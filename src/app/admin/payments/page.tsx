"use client";

import { useEffect, useState } from "react";

interface PaymentItem {
  id: string;
  user_name: string;
  user_email: string;
  plan_name: string;
  amount_kes: number;
  currency: string;
  provider: string;
  provider_reference: string;
  status: string;
  created_at: string;
}

interface WithdrawalItem {
  id: string;
  user_name: string;
  user_email: string;
  amount_kes: number;
  fee_kes: number;
  net_amount_kes: number;
  phone_number: string;
  account_name: string;
  payment_method: string;
  status: string;
  created_at: string;
}

export default function AdminPaymentsPage() {
  const [tab, setTab] = useState<"payments" | "withdrawals">("payments");
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ search, status: statusFilter });
      const res = await fetch(`/api/admin/payments?${q.toString()}`);
      const data = await res.json();
      setPayments(data.payments || []);
      setWithdrawals(data.withdrawals || []);
      setStats(data.stats || null);
    } catch {
      alert("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, statusFilter]);

  const handleWithdrawalAction = async (id: string, action: "approve" | "reject") => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: action === "reject" ? "Declined by admin" : undefined }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Action failed");
      } else {
        await fetchData();
      }
    } catch {
      alert("Network error");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-hub-text-primary">Payments & Payouts</h1>
        <p className="text-sm text-hub-text-muted mt-1">
          Review incoming membership subscriptions, reconciliations, and member cash withdrawal requests.
        </p>
      </div>

      {/* Summary Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-hub-surface border border-hub-border-subtle p-4 rounded-lg">
            <span className="text-xs text-hub-text-muted">Total Processed Volume</span>
            <p className="text-xl font-bold font-mono text-hub-gold mt-1">
              KES {stats.completed_volume?.toLocaleString()}
            </p>
          </div>
          <div className="bg-hub-surface border border-hub-border-subtle p-4 rounded-lg">
            <span className="text-xs text-hub-text-muted">Total Transactions</span>
            <p className="text-xl font-bold font-mono text-white mt-1">{stats.total_count}</p>
          </div>
          <div className="bg-hub-surface border border-hub-border-subtle p-4 rounded-lg">
            <span className="text-xs text-hub-text-muted">Pending Inflows</span>
            <p className="text-xl font-bold font-mono text-yellow-400 mt-1">{stats.pending_count}</p>
          </div>
          <div className="bg-hub-surface border border-hub-border-subtle p-4 rounded-lg">
            <span className="text-xs text-hub-text-muted">Failed Attempts</span>
            <p className="text-xl font-bold font-mono text-red-400 mt-1">{stats.failed_count}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-hub-border gap-4 text-sm font-medium">
        <button
          onClick={() => setTab("payments")}
          className={`pb-2 border-b-2 transition-colors ${
            tab === "payments"
              ? "border-hub-gold text-hub-gold"
              : "border-transparent text-hub-text-muted hover:text-white"
          }`}
        >
          Membership Inflows ({payments.length})
        </button>
        <button
          onClick={() => setTab("withdrawals")}
          className={`pb-2 border-b-2 transition-colors ${
            tab === "withdrawals"
              ? "border-hub-gold text-hub-gold"
              : "border-transparent text-hub-text-muted hover:text-white"
          }`}
        >
          Withdrawal Payouts ({withdrawals.length})
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by user email, name, or reference…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-hub-surface border border-hub-border rounded px-3 py-2 text-sm text-hub-text-primary focus:outline-none focus:ring-2 focus:ring-hub-gold sm:w-80"
        />
        {tab === "payments" && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-hub-surface border border-hub-border rounded px-3 py-2 text-sm text-hub-text-primary focus:outline-none focus:ring-2 focus:ring-hub-gold sm:w-44"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        )}
      </div>

      {/* Tables */}
      <div className="bg-hub-surface rounded-lg border border-hub-border-subtle overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-hub-text-muted">Loading transactions…</div>
        ) : tab === "payments" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-hub-surface-elevated text-xs uppercase text-hub-text-muted">
                <tr>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Plan</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Provider</th>
                  <th className="px-5 py-3">Reference</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hub-border-subtle">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-hub-surface-elevated/50">
                    <td className="px-5 py-3">
                      <div className="font-medium text-hub-text-primary">{p.user_name}</div>
                      <div className="text-xs text-hub-text-muted font-mono">{p.user_email}</div>
                    </td>
                    <td className="px-5 py-3 text-xs">{p.plan_name || "Membership"}</td>
                    <td className="px-5 py-3 font-mono font-bold text-hub-gold">KES {p.amount_kes}</td>
                    <td className="px-5 py-3 uppercase text-xs font-mono">{p.provider}</td>
                    <td className="px-5 py-3 font-mono text-xs text-hub-text-muted">{p.provider_reference}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-[11px] font-mono px-2 py-0.5 rounded uppercase ${
                          p.status === "completed"
                            ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                            : p.status === "failed"
                            ? "bg-red-950/60 text-red-400 border border-red-800/40"
                            : "bg-yellow-950/60 text-yellow-400 border border-yellow-800/40"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-hub-text-muted">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-hub-surface-elevated text-xs uppercase text-hub-text-muted">
                <tr>
                  <th className="px-5 py-3">Member</th>
                  <th className="px-5 py-3">Requested</th>
                  <th className="px-5 py-3">Net Payout</th>
                  <th className="px-5 py-3">Recipient Details</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hub-border-subtle">
                {withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-hub-surface-elevated/50">
                    <td className="px-5 py-3">
                      <div className="font-medium text-hub-text-primary">{w.user_name}</div>
                      <div className="text-xs text-hub-text-muted font-mono">{w.user_email}</div>
                    </td>
                    <td className="px-5 py-3 font-mono">KES {w.amount_kes}</td>
                    <td className="px-5 py-3 font-mono font-bold text-hub-gold">KES {w.net_amount_kes}</td>
                    <td className="px-5 py-3 text-xs">
                      <div>{w.account_name}</div>
                      <div className="font-mono text-hub-text-muted">{w.phone_number} ({w.payment_method})</div>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-[11px] font-mono px-2 py-0.5 rounded uppercase ${
                          w.status === "paid" || w.status === "approved"
                            ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                            : w.status === "rejected" || w.status === "cancelled"
                            ? "bg-red-950/60 text-red-400 border border-red-800/40"
                            : "bg-yellow-950/60 text-yellow-400 border border-yellow-800/40"
                        }`}
                      >
                        {w.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-hub-text-muted">
                      {new Date(w.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {(w.status === "submitted" || w.status === "under_review") && (
                        <div className="flex gap-1.5 justify-end">
                          <button
                            disabled={actionLoading === w.id}
                            onClick={() => handleWithdrawalAction(w.id, "approve")}
                            className="px-2.5 py-1 text-xs rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400 hover:bg-emerald-900/60 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            disabled={actionLoading === w.id}
                            onClick={() => handleWithdrawalAction(w.id, "reject")}
                            className="px-2.5 py-1 text-xs rounded bg-red-950/60 border border-red-800 text-red-400 hover:bg-red-900/60 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

