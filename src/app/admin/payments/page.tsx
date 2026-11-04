"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import {
  Copy,
  Check,
  Send,
  X,
  AlertCircle,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from "lucide-react";

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
  external_transaction_id?: string;
  admin_notes?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at?: string;
}

export default function AdminPaymentsPage() {
  const [tab, setTab] = useState<"payments" | "withdrawals">("withdrawals");
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [stats, setStats] = useState<any>(null);

  // Modal states
  const [payoutModalItem, setPayoutModalItem] = useState<WithdrawalItem | null>(null);
  const [rejectModalItem, setRejectModalItem] = useState<WithdrawalItem | null>(null);

  // Payout form state
  const [payoutChannel, setPayoutChannel] = useState("paystack_transfer");
  const [externalRef, setExternalRef] = useState("");
  const [payoutNotes, setPayoutNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  // Reject form state
  const [rejectReason, setRejectReason] = useState("");

  // Copy feedback state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = auth?.currentUser ? await auth.currentUser.getIdToken() : null;
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const q = new URLSearchParams({ search, status: statusFilter });
      const res = await fetch(`/api/admin/payments?${q.toString()}`, { headers });
      const data = await res.json();
      setPayments(data.payments || []);
      setWithdrawals(data.withdrawals || []);
      setStats(data.stats || null);
    } catch {
      alert("Failed to load payments and withdrawals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, statusFilter]);

  const openPayoutModal = (w: WithdrawalItem) => {
    setPayoutModalItem(w);
    setPayoutChannel(
      w.payment_method?.includes("paystack")
        ? w.payment_method
        : "paystack_transfer"
    );
    setExternalRef("");
    setPayoutNotes(`Disbursed KES ${w.net_amount_kes} to ${w.phone_number} via Paystack`);
    setActionError("");
  };

  const openRejectModal = (w: WithdrawalItem) => {
    setRejectModalItem(w);
    setRejectReason("");
    setActionError("");
  };

  const handleConfirmPayout = async () => {
    if (!payoutModalItem) return;
    if (!externalRef.trim()) {
      setActionError("Please enter the Paystack or M-Pesa transaction reference.");
      return;
    }

    setActionLoading(true);
    setActionError("");

    try {
      const res = await fetch(`/api/admin/withdrawals/${payoutModalItem.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          externalTransactionId: externalRef.trim(),
          notes: payoutNotes.trim(),
          paymentMethod: payoutChannel,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Failed to disburse payout");
      } else {
        setPayoutModalItem(null);
        await fetchData();
      }
    } catch {
      setActionError("Network error while recording payout.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModalItem) return;
    if (!rejectReason.trim()) {
      setActionError("Please provide a reason for rejecting this withdrawal request.");
      return;
    }

    setActionLoading(true);
    setActionError("");

    try {
      const res = await fetch(`/api/admin/withdrawals/${rejectModalItem.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          notes: rejectReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Failed to reject withdrawal");
      } else {
        setRejectModalItem(null);
        await fetchData();
      }
    } catch {
      setActionError("Network error while rejecting withdrawal.");
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered withdrawals
  const filteredWithdrawals = withdrawals.filter((w) => {
    if (statusFilter && w.status !== statusFilter) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      w.user_name?.toLowerCase().includes(s) ||
      w.user_email?.toLowerCase().includes(s) ||
      w.phone_number?.includes(s) ||
      w.account_name?.toLowerCase().includes(s) ||
      w.external_transaction_id?.toLowerCase().includes(s)
    );
  });

  // Calculate withdrawal stats
  const pendingWithdrawals = withdrawals.filter(
    (w) => w.status === "submitted" || w.status === "under_review"
  );
  const paidWithdrawals = withdrawals.filter((w) => w.status === "paid");
  const totalPaidVolume = paidWithdrawals.reduce((sum, w) => sum + w.net_amount_kes, 0);
  const totalPendingVolume = pendingWithdrawals.reduce((sum, w) => sum + w.net_amount_kes, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-hub-text-primary">Payments & Payouts</h1>
          <p className="text-sm text-hub-text-muted mt-1">
            Reconcile Paystack membership collections and manually disburse affiliate referral payouts with audit references.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-hub-surface border border-hub-gold/30 text-xs font-mono text-hub-gold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Payout Mode: Manual (Paystack)
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-hub-surface border border-hub-border-subtle p-4 rounded-lg">
          <span className="text-xs text-hub-text-muted flex items-center gap-1.5">
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
            Membership Inflow Volume
          </span>
          <p className="text-xl font-bold font-mono text-emerald-400 mt-1">
            KES {(stats?.completed_volume || 0).toLocaleString()}
          </p>
          <span className="text-[11px] text-hub-text-muted mt-0.5 block">
            {stats?.total_count || 0} subscriptions processed
          </span>
        </div>

        <div className="bg-hub-surface border border-hub-border-subtle p-4 rounded-lg">
          <span className="text-xs text-hub-text-muted flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Pending Referral Payouts
          </span>
          <p className="text-xl font-bold font-mono text-amber-400 mt-1">
            KES {totalPendingVolume.toLocaleString()}
          </p>
          <span className="text-[11px] text-hub-text-muted mt-0.5 block">
            {pendingWithdrawals.length} awaiting manual payout
          </span>
        </div>

        <div className="bg-hub-surface border border-hub-border-subtle p-4 rounded-lg">
          <span className="text-xs text-hub-text-muted flex items-center gap-1.5">
            <ArrowUpRight className="w-3.5 h-3.5 text-hub-gold" />
            Total Disbursed Payouts
          </span>
          <p className="text-xl font-bold font-mono text-hub-gold mt-1">
            KES {totalPaidVolume.toLocaleString()}
          </p>
          <span className="text-[11px] text-hub-text-muted mt-0.5 block">
            {paidWithdrawals.length} completed referral payouts
          </span>
        </div>

        <div className="bg-hub-surface border border-hub-border-subtle p-4 rounded-lg">
          <span className="text-xs text-hub-text-muted flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
            Payment Gateway
          </span>
          <p className="text-lg font-bold font-mono text-white mt-1">Paystack + M-Pesa</p>
          <span className="text-[11px] text-hub-text-muted mt-0.5 block">
            Manual transfer verification
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-hub-border gap-6 text-sm font-medium">
        <button
          onClick={() => {
            setTab("withdrawals");
            setStatusFilter("");
          }}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            tab === "withdrawals"
              ? "border-hub-gold text-hub-gold"
              : "border-transparent text-hub-text-muted hover:text-white"
          }`}
        >
          <span>Referral Withdrawal Payouts</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-mono ${
              pendingWithdrawals.length > 0
                ? "bg-amber-950 text-amber-400 border border-amber-800"
                : "bg-hub-surface text-hub-text-muted"
            }`}
          >
            {pendingWithdrawals.length} pending
          </span>
        </button>

        <button
          onClick={() => {
            setTab("payments");
            setStatusFilter("");
          }}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            tab === "payments"
              ? "border-hub-gold text-hub-gold"
              : "border-transparent text-hub-text-muted hover:text-white"
          }`}
        >
          <span>Membership Inflows ({payments.length})</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 sm:max-w-md">
          <input
            type="text"
            placeholder={
              tab === "withdrawals"
                ? "Search member, phone, account name, reference…"
                : "Search by email, member name, reference…"
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-hub-surface border border-hub-border rounded-lg px-3 py-2 text-sm text-hub-text-primary focus:outline-none focus:ring-2 focus:ring-hub-gold placeholder:text-hub-text-muted"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-hub-surface border border-hub-border rounded-lg px-3 py-2 text-sm text-hub-text-primary focus:outline-none focus:ring-2 focus:ring-hub-gold sm:w-48"
        >
          <option value="">All Statuses</option>
          {tab === "withdrawals" ? (
            <>
              <option value="submitted">Pending Review</option>
              <option value="paid">Paid / Disbursed</option>
              <option value="rejected">Rejected</option>
            </>
          ) : (
            <>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </>
          )}
        </select>
      </div>

      {/* Content Tables */}
      <div className="bg-hub-surface rounded-xl border border-hub-border-subtle overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-sm text-hub-text-muted flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-hub-gold" />
            <span>Loading records…</span>
          </div>
        ) : tab === "withdrawals" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-hub-surface-elevated text-xs uppercase text-hub-text-muted font-mono">
                <tr>
                  <th className="px-5 py-3">Member</th>
                  <th className="px-5 py-3">Net Payout</th>
                  <th className="px-5 py-3">Recipient Details</th>
                  <th className="px-5 py-3">Channel & Ref</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hub-border-subtle">
                {filteredWithdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-sm text-hub-text-muted">
                      No withdrawal payout requests matching the criteria.
                    </td>
                  </tr>
                ) : (
                  filteredWithdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-hub-surface-elevated/40 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-medium text-hub-text-primary">{w.user_name}</div>
                        <div className="text-xs text-hub-text-muted font-mono">{w.user_email}</div>
                      </td>

                      <td className="px-5 py-3">
                        <div className="font-mono font-bold text-hub-gold text-base">
                          KES {w.net_amount_kes.toLocaleString()}
                        </div>
                        {w.fee_kes > 0 && (
                          <div className="text-[11px] text-hub-text-muted font-mono">
                            Gross: KES {w.amount_kes} (Fee: {w.fee_kes})
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-3 text-xs">
                        <div className="font-semibold text-white">{w.account_name}</div>
                        <div className="font-mono text-hub-text-secondary flex items-center gap-1.5 mt-0.5">
                          <span>{w.phone_number}</span>
                          <button
                            onClick={() => copyToClipboard(w.phone_number, `phone-${w.id}`)}
                            title="Copy phone number for Paystack/M-Pesa"
                            className="p-1 rounded hover:bg-hub-surface text-hub-text-muted hover:text-white"
                          >
                            {copiedKey === `phone-${w.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="px-5 py-3 text-xs">
                        {w.external_transaction_id ? (
                          <div className="space-y-0.5">
                            <span className="font-mono text-emerald-400 font-bold block">
                              {w.external_transaction_id}
                            </span>
                            <span className="text-[11px] text-hub-text-muted font-mono uppercase">
                              {w.payment_method?.replace(/_/g, " ")}
                            </span>
                          </div>
                        ) : (
                          <span className="text-hub-text-muted font-mono text-xs italic">
                            Awaiting Disbursal
                          </span>
                        )}
                        {w.admin_notes && (
                          <div className="text-[11px] text-hub-text-muted italic max-w-xs truncate">
                            {w.admin_notes}
                          </div>
                        )}
                        {w.rejection_reason && (
                          <div className="text-[11px] text-red-400 italic max-w-xs">
                            Reason: {w.rejection_reason}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-full uppercase ${
                            w.status === "paid" || w.status === "approved"
                              ? "bg-emerald-950/70 text-emerald-400 border border-emerald-800/50"
                              : w.status === "rejected" || w.status === "cancelled"
                              ? "bg-red-950/70 text-red-400 border border-red-800/50"
                              : "bg-amber-950/70 text-amber-400 border border-amber-800/50"
                          }`}
                        >
                          {w.status === "paid" ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : w.status === "rejected" ? (
                            <XCircle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          <span>{w.status}</span>
                        </span>
                      </td>

                      <td className="px-5 py-3 text-xs text-hub-text-muted font-mono">
                        {new Date(w.created_at).toLocaleDateString()}
                      </td>

                      <td className="px-5 py-3 text-right">
                        {w.status === "submitted" || w.status === "under_review" ? (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => openPayoutModal(w)}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-950 border border-emerald-700/80 text-emerald-300 hover:bg-emerald-900 transition-colors flex items-center gap-1.5 shadow-sm"
                            >
                              <Send className="w-3 h-3" />
                              <span>Disburse (Paystack)</span>
                            </button>
                            <button
                              onClick={() => openRejectModal(w)}
                              className="px-2.5 py-1.5 text-xs rounded-lg bg-red-950/70 border border-red-800 text-red-400 hover:bg-red-900 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-hub-text-muted font-mono">Settled</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-hub-surface-elevated text-xs uppercase text-hub-text-muted font-mono">
                <tr>
                  <th className="px-5 py-3">Member</th>
                  <th className="px-5 py-3">Tier</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Provider</th>
                  <th className="px-5 py-3">Reference</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hub-border-subtle">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-sm text-hub-text-muted">
                      No membership inflow payments found.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-hub-surface-elevated/40 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-medium text-hub-text-primary">{p.user_name}</div>
                        <div className="text-xs text-hub-text-muted font-mono">{p.user_email}</div>
                      </td>
                      <td className="px-5 py-3 text-xs font-semibold text-white">
                        {p.plan_name || "Membership"}
                      </td>
                      <td className="px-5 py-3 font-mono font-bold text-hub-gold">
                        KES {p.amount_kes}
                      </td>
                      <td className="px-5 py-3 uppercase text-xs font-mono">{p.provider}</td>
                      <td className="px-5 py-3 font-mono text-xs text-hub-text-secondary">
                        {p.provider_reference}
                      </td>
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
                      <td className="px-5 py-3 text-xs text-hub-text-muted font-mono">
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Paystack Payout Modal */}
      {payoutModalItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setPayoutModalItem(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg rounded-2xl bg-hub-surface-elevated border border-hub-border p-6 sm:p-8 shadow-2xl text-hub-text-primary space-y-5"
          >
            <button
              onClick={() => setPayoutModalItem(null)}
              className="absolute top-5 right-5 p-2 rounded-lg bg-hub-surface text-hub-text-muted hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono uppercase tracking-wider text-hub-gold font-bold">
                  Manual Referral Disbursement
                </span>
              </div>
              <h3 className="text-xl font-bold text-white">Process Paystack Payout</h3>
            </div>

            {/* Recipient Card */}
            <div className="p-4 rounded-xl bg-hub-surface border border-hub-border space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-hub-text-muted">Net Payout Amount:</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold font-mono text-hub-gold">
                    KES {payoutModalItem.net_amount_kes.toLocaleString()}
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        String(payoutModalItem.net_amount_kes),
                        "modal-amount"
                      )
                    }
                    className="p-1 rounded hover:bg-hub-surface-elevated text-hub-text-muted hover:text-white"
                    title="Copy amount"
                  >
                    {copiedKey === "modal-amount" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-hub-border">
                <div>
                  <span className="text-hub-text-muted block">Recipient Name:</span>
                  <span className="font-semibold text-white">
                    {payoutModalItem.account_name}
                  </span>
                </div>
                <div>
                  <span className="text-hub-text-muted block">M-Pesa Number:</span>
                  <div className="flex items-center gap-1.5 font-mono text-hub-text-primary">
                    <span>{payoutModalItem.phone_number}</span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          payoutModalItem.phone_number,
                          "modal-phone"
                        )
                      }
                      className="p-1 rounded hover:bg-hub-surface-elevated text-hub-text-muted hover:text-white"
                      title="Copy phone"
                    >
                      {copiedKey === "modal-phone" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Instruction banner */}
            <div className="p-3.5 rounded-lg bg-hub-bg border border-hub-border text-xs text-hub-text-secondary space-y-1.5">
              <p className="font-semibold text-white flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-hub-gold" />
                How to Complete:
              </p>
              <ol className="list-decimal pl-4 space-y-1 text-hub-text-muted">
                <li>
                  Open your <strong>Paystack Dashboard</strong> (Transfers & Payouts) or M-Pesa business terminal.
                </li>
                <li>
                  Send <strong>KES {payoutModalItem.net_amount_kes}</strong> to{" "}
                  <strong>{payoutModalItem.phone_number}</strong> ({payoutModalItem.account_name}).
                </li>
                <li>Copy the generated <strong>Transfer Reference (TRF_xxx)</strong> or M-Pesa receipt code into the field below.</li>
              </ol>
            </div>

            {actionError && (
              <div className="p-3 rounded-lg bg-red-950/80 border border-red-500/50 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-hub-text-secondary mb-1">
                  Disbursement Channel
                </label>
                <select
                  value={payoutChannel}
                  onChange={(e) => setPayoutChannel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-hub-surface border border-hub-border text-sm text-white focus:outline-none focus:border-hub-gold"
                >
                  <option value="paystack_transfer">Paystack Transfer (Manual)</option>
                  <option value="paystack_mpesa">Paystack M-Pesa Disbursal</option>
                  <option value="manual_mpesa">Direct Safaricom M-Pesa</option>
                  <option value="manual_bank">Bank Wire</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-hub-text-secondary mb-1">
                  Paystack / M-Pesa Reference Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TRF_1489204829 or QA8392KSD"
                  value={externalRef}
                  onChange={(e) => setExternalRef(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-hub-surface border border-hub-border text-sm text-white font-mono focus:outline-none focus:border-hub-gold uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-hub-text-secondary mb-1">
                  Admin Audit Note (Optional)
                </label>
                <input
                  type="text"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  placeholder="e.g. Disbursed via Paystack Transfer"
                  className="w-full px-3 py-2 rounded-lg bg-hub-surface border border-hub-border text-xs text-white focus:outline-none focus:border-hub-gold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-hub-border">
              <button
                type="button"
                onClick={() => setPayoutModalItem(null)}
                className="px-4 py-2 rounded-lg text-xs bg-hub-surface border border-hub-border text-hub-text-muted hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmPayout}
                className="px-5 py-2 rounded-lg text-xs font-bold bg-hub-gold text-hub-forest-dark hover:bg-hub-gold-hover shadow-gold-glow flex items-center gap-1.5 disabled:opacity-50"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm & Mark Paid</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setRejectModalItem(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl bg-hub-surface-elevated border border-hub-border p-6 shadow-2xl text-hub-text-primary space-y-4"
          >
            <button
              onClick={() => setRejectModalItem(null)}
              className="absolute top-5 right-5 p-2 rounded-lg bg-hub-surface text-hub-text-muted hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white">Reject Withdrawal Request</h3>

            <p className="text-xs text-hub-text-muted leading-relaxed">
              Rejecting this request will restore{" "}
              <strong className="text-white">KES {rejectModalItem.amount_kes}</strong> back to{" "}
              <strong className="text-hub-gold">{rejectModalItem.user_name}&apos;s</strong> approved
              wallet balance.
            </p>

            {actionError && (
              <div className="p-3 rounded-lg bg-red-950/80 border border-red-500/50 text-xs text-red-300">
                {actionError}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-hub-text-secondary mb-1">
                Reason for Rejection *
              </label>
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Invalid M-Pesa phone number, name mismatch, or user requested cancellation."
                className="w-full px-3 py-2 rounded-lg bg-hub-surface border border-hub-border text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalItem(null)}
                className="px-4 py-2 rounded-lg text-xs bg-hub-surface border border-hub-border text-hub-text-muted hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmReject}
                className="px-5 py-2 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-500 flex items-center gap-1.5 disabled:opacity-50"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Reject & Refund Balance</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
