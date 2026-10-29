"use client";

import { useEffect, useState } from "react";

interface ReferralCodeItem {
  id: string;
  code: string;
  clicks: number;
  created_at: string;
  referrer_name: string;
  referrer_email: string;
  attribution_count: number;
  approved_reward_count: number;
  pending_reward_count: number;
  total_earned_kes: number;
}

interface AttributionItem {
  id: string;
  referral_code: string;
  status: string;
  created_at: string;
  referrer_name: string;
  referrer_email: string;
  referred_name: string;
  referred_email: string;
}

interface RewardItem {
  id: string;
  plan_slug: string;
  reward_amount_kes: number;
  status: string;
  rejection_reason?: string;
  created_at: string;
  referrer_name: string;
  referrer_email: string;
  referred_name: string;
  referred_email: string;
}

export default function AdminReferralsPage() {
  const [tab, setTab] = useState<"codes" | "attributions" | "rewards">("codes");
  const [referrals, setReferrals] = useState<ReferralCodeItem[]>([]);
  const [attributions, setAttributions] = useState<AttributionItem[]>([]);
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/referrals?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      setReferrals(data.referrals || []);
      setAttributions(data.attributions || []);
      setRewards(data.rewards || []);
    } catch {
      alert("Failed to load referrals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  const handleRewardAction = async (rewardId: string, action: "approve" | "reject") => {
    setActionLoading(rewardId);
    try {
      const res = await fetch(`/api/admin/rewards/${rewardId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: action === "reject" ? "Manual admin rejection" : undefined }),
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
        <h1 className="text-2xl font-bold text-hub-text-primary">Referral Management</h1>
        <p className="text-sm text-hub-text-muted mt-1">
          Monitor invitation codes, verify qualified attributions, and manage commission rewards.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-hub-border gap-4 text-sm font-medium">
        <button
          onClick={() => setTab("codes")}
          className={`pb-2 border-b-2 transition-colors ${
            tab === "codes"
              ? "border-hub-gold text-hub-gold"
              : "border-transparent text-hub-text-muted hover:text-white"
          }`}
        >
          Referral Codes ({referrals.length})
        </button>
        <button
          onClick={() => setTab("attributions")}
          className={`pb-2 border-b-2 transition-colors ${
            tab === "attributions"
              ? "border-hub-gold text-hub-gold"
              : "border-transparent text-hub-text-muted hover:text-white"
          }`}
        >
          Attributions ({attributions.length})
        </button>
        <button
          onClick={() => setTab("rewards")}
          className={`pb-2 border-b-2 transition-colors ${
            tab === "rewards"
              ? "border-hub-gold text-hub-gold"
              : "border-transparent text-hub-text-muted hover:text-white"
          }`}
        >
          Commission Rewards ({rewards.length})
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search by code, referrer, or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-hub-surface border border-hub-border rounded px-3 py-2 text-sm text-hub-text-primary focus:outline-none focus:ring-2 focus:ring-hub-gold sm:w-80"
        />
      </div>

      {/* Content */}
      <div className="bg-hub-surface rounded-lg border border-hub-border-subtle overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-hub-text-muted">Loading referral data…</div>
        ) : tab === "codes" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-hub-surface-elevated text-xs uppercase text-hub-text-muted">
                <tr>
                  <th className="px-5 py-3">Referrer</th>
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Clicks</th>
                  <th className="px-5 py-3">Signups</th>
                  <th className="px-5 py-3">Approved Rewards</th>
                  <th className="px-5 py-3">Total Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hub-border-subtle">
                {referrals.map((r) => (
                  <tr key={r.id} className="hover:bg-hub-surface-elevated/50">
                    <td className="px-5 py-3">
                      <div className="font-medium text-hub-text-primary">{r.referrer_name}</div>
                      <div className="text-xs text-hub-text-muted font-mono">{r.referrer_email}</div>
                    </td>
                    <td className="px-5 py-3 font-mono font-bold text-hub-gold">{r.code}</td>
                    <td className="px-5 py-3 font-mono">{r.clicks}</td>
                    <td className="px-5 py-3 font-mono text-cyan-400">{r.attribution_count}</td>
                    <td className="px-5 py-3 font-mono text-emerald-400">{r.approved_reward_count}</td>
                    <td className="px-5 py-3 font-mono font-bold text-hub-text-primary">
                      KES {r.total_earned_kes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : tab === "attributions" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-hub-surface-elevated text-xs uppercase text-hub-text-muted">
                <tr>
                  <th className="px-5 py-3">Referrer</th>
                  <th className="px-5 py-3">Referred User</th>
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hub-border-subtle">
                {attributions.map((a) => (
                  <tr key={a.id} className="hover:bg-hub-surface-elevated/50">
                    <td className="px-5 py-3">
                      <div className="font-medium text-hub-text-primary">{a.referrer_name}</div>
                      <div className="text-xs text-hub-text-muted font-mono">{a.referrer_email}</div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-hub-text-primary">{a.referred_name}</div>
                      <div className="text-xs text-hub-text-muted font-mono">{a.referred_email}</div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-hub-gold">{a.referral_code}</td>
                    <td className="px-5 py-3">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-hub-surface-elevated border border-hub-border uppercase">
                        {a.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-hub-text-muted">
                      {new Date(a.created_at).toLocaleDateString()}
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
                  <th className="px-5 py-3">Referrer</th>
                  <th className="px-5 py-3">Referred User</th>
                  <th className="px-5 py-3">Plan</th>
                  <th className="px-5 py-3">Commission</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hub-border-subtle">
                {rewards.map((rw) => (
                  <tr key={rw.id} className="hover:bg-hub-surface-elevated/50">
                    <td className="px-5 py-3">
                      <div className="font-medium text-hub-text-primary">{rw.referrer_name}</div>
                      <div className="text-xs text-hub-text-muted font-mono">{rw.referrer_email}</div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-hub-text-primary">{rw.referred_name}</div>
                      <div className="text-xs text-hub-text-muted font-mono">{rw.referred_email}</div>
                    </td>
                    <td className="px-5 py-3 uppercase text-xs font-mono">{rw.plan_slug}</td>
                    <td className="px-5 py-3 font-mono font-bold text-hub-gold">
                      KES {rw.reward_amount_kes}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-[11px] font-mono px-2 py-0.5 rounded uppercase ${
                          rw.status === "approved"
                            ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                            : rw.status === "rejected"
                            ? "bg-red-950/60 text-red-400 border border-red-800/40"
                            : "bg-yellow-950/60 text-yellow-400 border border-yellow-800/40"
                        }`}
                      >
                        {rw.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {rw.status === "pending" && (
                        <div className="flex gap-1.5 justify-end">
                          <button
                            disabled={actionLoading === rw.id}
                            onClick={() => handleRewardAction(rw.id, "approve")}
                            className="px-2.5 py-1 text-xs rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400 hover:bg-emerald-900/60 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            disabled={actionLoading === rw.id}
                            onClick={() => handleRewardAction(rw.id, "reject")}
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

