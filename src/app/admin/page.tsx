"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ReferralReward, WithdrawalRequest, ReferralProgramStatus } from "@/types";
import {
  ShieldAlert,
  Users,
  CreditCard,
  Database,
  Share2,
  Wallet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCheck,
  Plus,
  Loader2,
  RefreshCw,
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();

  const [metrics, setMetrics] = useState<any>(null);
  const [rewards, setRewards] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Status transition form
  const [selectedStatus, setSelectedStatus] = useState<ReferralProgramStatus>("compliance_review");
  const [lawyerNotes, setLawyerNotes] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  // Resource verification modal/state
  const [verifyModalId, setVerifyModalId] = useState<string | null>(null);
  const [verifyNotes, setVerifyNotes] = useState("");

  // Rejection modal
  const [rejectRewardId, setRejectRewardId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Withdrawal action state
  const [withdrawalActionId, setWithdrawalActionId] = useState<string | null>(null);
  const [withdrawalActionType, setWithdrawalActionType] = useState<"approve" | "reject">("approve");
  const [withdrawalTxId, setWithdrawalTxId] = useState("");
  const [withdrawalNotes, setWithdrawalNotes] = useState("");

  const refreshData = async () => {
    setLoading(true);
    try {
      const [metricsRes, rewardsRes, withdrawalsRes, resourcesRes] = await Promise.all([
        fetch("/api/admin/metrics"),
        fetch("/api/admin/rewards"),
        fetch("/api/admin/withdrawals"),
        fetch("/api/resources?limit=20"),
      ]);

      if (metricsRes.status === 403 || metricsRes.status === 401) {
        alert("Unauthorized: You must be logged in as an administrator to access this area.");
        router.push("/login");
        return;
      }

      const mData = await metricsRes.json();
      const rData = await rewardsRes.json();
      const wData = await withdrawalsRes.json();
      const resData = await resourcesRes.json();

      setMetrics(mData);
      setSelectedStatus(mData.programStatus || "compliance_review");
      setRewards(rData.rewards || []);
      setWithdrawals(wData.withdrawals || []);
      setResources(resData.resources || []);
    } catch {
      alert("Error loading administrative data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setStatusMessage("");

    try {
      const res = await fetch("/api/admin/program-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: selectedStatus,
          legalReviewerNotes: lawyerNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatusMessage(`Error: ${data.error}`);
      } else {
        setStatusMessage(data.message);
        refreshData();
      }
    } catch {
      setStatusMessage("Network error updating programme status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveReward = async (id: string) => {
    if (!confirm("Approve this referral commission into the member's withdrawable balance?")) return;
    try {
      const res = await fetch(`/api/admin/rewards/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      const data = await res.json();
      if (!res.ok) alert(data.error);
      else refreshData();
    } catch {
      alert("Error approving reward");
    }
  };

  const handleRejectRewardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectRewardId || !rejectReason) return;

    try {
      const res = await fetch(`/api/admin/rewards/${rejectRewardId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", reason: rejectReason }),
      });
      const data = await res.json();
      if (!res.ok) alert(data.error);
      else {
        setRejectRewardId(null);
        setRejectReason("");
        refreshData();
      }
    } catch {
      alert("Error rejecting reward");
    }
  };

  const handleWithdrawalActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawalActionId) return;

    try {
      const res = await fetch(`/api/admin/withdrawals/${withdrawalActionId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: withdrawalActionType,
          externalTransactionId: withdrawalTxId,
          notes: withdrawalNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) alert(data.error);
      else {
        setWithdrawalActionId(null);
        setWithdrawalTxId("");
        setWithdrawalNotes("");
        refreshData();
      }
    } catch {
      alert("Error processing withdrawal");
    }
  };

  const handleVerifyResourceSubmit = async (status: "verified" | "stale") => {
    if (!verifyModalId) return;
    try {
      const res = await fetch(`/api/resources/${verifyModalId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes: verifyNotes }),
      });
      const data = await res.json();
      if (!res.ok) alert(data.error);
      else {
        setVerifyModalId(null);
        setVerifyNotes("");
        refreshData();
      }
    } catch {
      alert("Error updating verification");
    }
  };

  if (loading || !metrics) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center text-hub-gold flex items-center justify-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>Loading secure admin workspace...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hub-border pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-red-400 font-bold mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>Authorized Administration Console</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            CodeVanta Platform Governance
          </h1>
        </div>

        <button
          onClick={refreshData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-hub-surface border border-hub-border hover:bg-hub-surface-elevated text-hub-text-secondary hover:text-white"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-hub-surface-card border border-hub-border space-y-1">
          <span className="text-xs text-hub-text-muted flex items-center gap-1.5">
            <Users className="w-4 h-4 text-hub-gold" />
            Registered Members
          </span>
          <p className="text-2xl font-bold text-white font-mono">{metrics.users.total}</p>
          <span className="text-[11px] text-hub-text-secondary">{metrics.memberships.active} Active Paid Members</span>
        </div>

        <div className="p-5 rounded-xl bg-hub-surface-card border border-hub-border space-y-1">
          <span className="text-xs text-hub-text-muted flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            Membership Revenue
          </span>
          <p className="text-2xl font-bold text-emerald-400 font-mono">
            KES {metrics.memberships.totalRevenueKes.toLocaleString()}
          </p>
          <span className="text-[11px] text-hub-text-secondary">Direct customer payments</span>
        </div>

        <div className="p-5 rounded-xl bg-hub-surface-card border border-hub-border space-y-1">
          <span className="text-xs text-hub-text-muted flex items-center gap-1.5">
            <Database className="w-4 h-4 text-hub-gold" />
            Audited Resources
          </span>
          <p className="text-2xl font-bold text-white font-mono">{metrics.resources.total}</p>
          <span className="text-[11px] text-emerald-400 font-mono">{metrics.resources.verified} Verified Active</span>
        </div>

        <div className="p-5 rounded-xl bg-hub-surface-card border border-hub-border space-y-1">
          <span className="text-xs text-hub-text-muted flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-amber-400" />
            Pending Withdrawals
          </span>
          <p className="text-2xl font-bold text-amber-400 font-mono">
            {metrics.withdrawals.pendingCount}
          </p>
          <span className="text-[11px] text-hub-text-secondary">KES {metrics.withdrawals.pendingTotalKes.toLocaleString()} total</span>
        </div>
      </div>

      {/* SECTION 1: LEGAL COMPLIANCE GATE CONTROL */}
      <div className="p-6 rounded-2xl bg-hub-surface border border-hub-gold/40 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-hub-gold" />
            <h3 className="text-lg font-bold text-white">Kenyan Legal Compliance Gate</h3>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono uppercase font-bold bg-hub-forest text-hub-gold border border-hub-gold/30">
            Current: {metrics.programStatus.replace("_", " ")}
          </span>
        </div>

        <p className="text-xs text-hub-text-secondary leading-relaxed">
          In strict compliance with Kenyan consumer protection and anti-pyramid provisions, real-money referral
          withdrawals remain locked in <strong className="text-amber-400">compliance_review</strong> mode.
          Only transition to <strong className="text-emerald-400">approved_for_launch</strong> when formal legal certification
          from a practicing Kenyan advocate has been recorded.
        </p>

        {statusMessage && (
          <div className="p-3 rounded-lg bg-hub-surface-elevated border border-hub-gold text-xs text-hub-gold">
            {statusMessage}
          </div>
        )}

        <form onSubmit={handleStatusUpdate} className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-medium text-hub-text-secondary mb-1">Program Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as ReferralProgramStatus)}
              className="w-full px-3 py-2 rounded-lg bg-hub-surface-elevated border border-hub-border text-sm text-white focus:outline-none focus:border-hub-gold"
            >
              <option value="compliance_review">Compliance Review (Payouts Locked)</option>
              <option value="approved_for_launch">Approved For Launch (Payouts Active)</option>
              <option value="disabled">Disabled</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-hub-text-secondary mb-1">
              Legal Certification Reference (Advocate Name &amp; High Court Roll Number)
            </label>
            <input
              type="text"
              value={lawyerNotes}
              onChange={(e) => setLawyerNotes(e.target.value)}
              placeholder="e.g. Reviewed & verified by Advocate J. Kamau, Roll P105/..."
              className="w-full px-3 py-2 rounded-lg bg-hub-surface-elevated border border-hub-border text-sm text-white focus:outline-none focus:border-hub-gold"
            />
          </div>

          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2.5 rounded-lg text-xs font-bold bg-hub-gold text-hub-forest-dark hover:bg-hub-gold-hover shadow-gold-glow flex items-center gap-2"
            >
              {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Compliance Configuration</span>
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: WITHDRAWAL REQUESTS DISBURSEMENT */}
      <div className="p-6 rounded-2xl bg-hub-surface border border-hub-border space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Wallet className="w-4 h-4 text-emerald-400" />
          <span>Pending Member Withdrawal Requests</span>
        </h3>

        {withdrawals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-hub-border text-hub-text-muted font-mono uppercase">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Member</th>
                  <th className="py-2.5 px-3">M-Pesa Phone</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hub-border">
                {withdrawals.map((w) => (
                  <tr key={w.id}>
                    <td className="py-2.5 px-3 font-mono text-hub-text-muted">{w.created_at.split("T")[0]}</td>
                    <td className="py-2.5 px-3">
                      <p className="font-bold text-white">{w.account_name}</p>
                      <p className="text-[11px] text-hub-text-muted">{w.email}</p>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-hub-text-secondary">{w.phone_number}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">KES {w.amount_kes}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                        w.status === "paid"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : w.status === "submitted"
                          ? "bg-amber-950 text-amber-400 border border-amber-800"
                          : "bg-red-950 text-red-400 border border-red-800"
                      }`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {w.status === "submitted" ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setWithdrawalActionId(w.id);
                              setWithdrawalActionType("approve");
                            }}
                            className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-400 hover:bg-emerald-900 border border-emerald-800 font-medium"
                          >
                            Disburse
                          </button>
                          <button
                            onClick={() => {
                              setWithdrawalActionId(w.id);
                              setWithdrawalActionType("reject");
                            }}
                            className="px-2.5 py-1 rounded bg-red-950 text-red-400 hover:bg-red-900 border border-red-800 font-medium"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-hub-text-muted font-mono">{w.external_transaction_id || "Completed"}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-hub-text-muted py-2">No pending withdrawal requests.</p>
        )}
      </div>

      {/* SECTION 3: REFERRAL REWARDS AUDIT */}
      <div className="p-6 rounded-2xl bg-hub-surface border border-hub-border space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Share2 className="w-4 h-4 text-hub-gold" />
          <span>Referral Commissions &amp; Fraud Review</span>
        </h3>

        {rewards.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-hub-border text-hub-text-muted font-mono uppercase">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Referrer</th>
                  <th className="py-2.5 px-3">Referred User</th>
                  <th className="py-2.5 px-3">Plan</th>
                  <th className="py-2.5 px-3">Reward</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hub-border">
                {rewards.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2.5 px-3 font-mono text-hub-text-muted">{r.created_at.split("T")[0]}</td>
                    <td className="py-2.5 px-3 text-white font-medium">{r.referrer_name}</td>
                    <td className="py-2.5 px-3 text-hub-text-secondary">{r.referred_email}</td>
                    <td className="py-2.5 px-3 font-mono uppercase text-hub-gold">{r.plan_slug}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">KES {r.reward_amount_kes}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                        r.status === "approved"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : r.status === "pending"
                          ? "bg-amber-950 text-amber-400 border border-amber-800"
                          : "bg-red-950 text-red-400 border border-red-800"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {r.status === "pending" && (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleApproveReward(r.id)}
                            className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-400 hover:bg-emerald-900 border border-emerald-800 font-medium"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectRewardId(r.id)}
                            className="px-2.5 py-1 rounded bg-red-950 text-red-400 hover:bg-red-900 border border-red-800 font-medium"
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
        ) : (
          <p className="text-xs text-hub-text-muted py-2">No referral transactions recorded yet.</p>
        )}
      </div>

      {/* SECTION 4: RESOURCE VERIFICATION MANAGEMENT */}
      <div className="p-6 rounded-2xl bg-hub-surface border border-hub-border space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-hub-gold" />
          <span>Developer Resource Editorial Status</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-hub-border text-hub-text-muted font-mono uppercase">
              <tr>
                <th className="py-2.5 px-3">Resource Name</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Pricing</th>
                <th className="py-2.5 px-3">Last Verified</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hub-border">
              {resources.map((res) => (
                <tr key={res.id}>
                  <td className="py-2.5 px-3 font-bold text-white">{res.name}</td>
                  <td className="py-2.5 px-3 text-hub-text-secondary">{res.category_name}</td>
                  <td className="py-2.5 px-3 font-mono uppercase text-hub-gold">{res.pricing_classification}</td>
                  <td className="py-2.5 px-3 font-mono text-hub-text-muted">{res.last_verification_date}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                      res.verification_status === "verified"
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                        : "bg-red-950 text-red-400 border border-red-800"
                    }`}>
                      {res.verification_status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => setVerifyModalId(res.id)}
                      className="px-2.5 py-1 rounded bg-hub-surface-elevated hover:bg-hub-forest text-hub-gold border border-hub-border font-medium"
                    >
                      Audit / Verify
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: VERIFY RESOURCE */}
      {verifyModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-hub-surface-elevated border border-hub-border p-6 space-y-4">
            <h3 className="font-bold text-lg text-white">Record Editorial Verification</h3>
            <textarea
              value={verifyNotes}
              onChange={(e) => setVerifyNotes(e.target.value)}
              placeholder="Notes on verified rate limits, pricing changes, or documentation check..."
              className="w-full h-24 p-3 rounded-lg bg-hub-surface border border-hub-border text-xs text-white focus:outline-none focus:border-hub-gold"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setVerifyModalId(null)}
                className="px-4 py-2 rounded-lg text-xs text-hub-text-muted hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleVerifyResourceSubmit("stale")}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-red-950 text-red-400 border border-red-800"
              >
                Mark Stale
              </button>
              <button
                onClick={() => handleVerifyResourceSubmit("verified")}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800"
              >
                Confirm Verified
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REJECT REWARD */}
      {rejectRewardId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form onSubmit={handleRejectRewardSubmit} className="w-full max-w-md rounded-2xl bg-hub-surface-elevated border border-hub-border p-6 space-y-4">
            <h3 className="font-bold text-lg text-white">Reject Referral Commission</h3>
            <p className="text-xs text-hub-text-secondary">
              A specific rejection reason is mandatory to maintain compliance audit integrity.
            </p>
            <input
              type="text"
              required
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason: e.g. Self-referral duplicate, payment chargeback, bot activity"
              className="w-full p-2.5 rounded-lg bg-hub-surface border border-hub-border text-xs text-white focus:outline-none focus:border-hub-gold"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectRewardId(null)}
                className="px-4 py-2 rounded-lg text-xs text-hub-text-muted hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-xs font-bold bg-red-950 text-red-400 border border-red-800"
              >
                Confirm Rejection &amp; Clawback
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: WITHDRAWAL ACTION */}
      {withdrawalActionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form onSubmit={handleWithdrawalActionSubmit} className="w-full max-w-md rounded-2xl bg-hub-surface-elevated border border-hub-border p-6 space-y-4">
            <h3 className="font-bold text-lg text-white">
              {withdrawalActionType === "approve" ? "Disburse M-Pesa Withdrawal" : "Reject Withdrawal Request"}
            </h3>

            {withdrawalActionType === "approve" ? (
              <div>
                <label className="block text-xs font-medium text-hub-text-secondary mb-1">
                  M-Pesa B2C / Bank Transaction Reference
                </label>
                <input
                  type="text"
                  required
                  value={withdrawalTxId}
                  onChange={(e) => setWithdrawalTxId(e.target.value)}
                  placeholder="e.g. QKH7892341"
                  className="w-full p-2.5 rounded-lg bg-hub-surface border border-hub-border text-xs text-white focus:outline-none focus:border-hub-gold"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-hub-text-secondary mb-1">
                  Mandatory Rejection Reason
                </label>
                <input
                  type="text"
                  required
                  value={withdrawalNotes}
                  onChange={(e) => setWithdrawalNotes(e.target.value)}
                  placeholder="e.g. M-Pesa name mismatch with National ID"
                  className="w-full p-2.5 rounded-lg bg-hub-surface border border-hub-border text-xs text-white focus:outline-none focus:border-hub-gold"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setWithdrawalActionId(null)}
                className="px-4 py-2 rounded-lg text-xs text-hub-text-muted hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 rounded-lg text-xs font-bold ${
                  withdrawalActionType === "approve"
                    ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                    : "bg-red-950 text-red-400 border border-red-800"
                }`}
              >
                Confirm {withdrawalActionType === "approve" ? "Disbursement" : "Rejection"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
