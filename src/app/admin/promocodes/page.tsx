"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PromoCode, PromoCodeRedemption } from "@/types";
import {
  Ticket,
  Plus,
  Copy,
  Check,
  Users,
  Trash2,
  Calendar,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Loader2,
  X,
  ExternalLink,
  Lock,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export default function AdminPromoCodesPage() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCodeForRedemptions, setSelectedCodeForRedemptions] = useState<PromoCode | null>(null);

  // Form states
  const [newCode, setNewCode] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPlanSlug, setNewPlanSlug] = useState<"pro" | "vip" | "basic">("vip");
  const [newMaxUses, setNewMaxUses] = useState(5);
  const [newExpiresAt, setNewExpiresAt] = useState("");
  const [creating, setCreating] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchPromoCodes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/promocodes");
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      setCodes(data.promoCodes || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load promo codes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromoCodes();
  }, [fetchPromoCodes]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/promocodes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentActive }),
      });
      if (res.ok) {
        fetchPromoCodes();
      }
    } catch {
      alert("Failed to update status");
    }
  };

  const handleDelete = async (id: string, codeName: string) => {
    if (!confirm(`Are you sure you want to delete promo code "${codeName}"?`)) return;
    try {
      const res = await fetch(`/api/admin/promocodes/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchPromoCodes();
      }
    } catch {
      alert("Failed to delete promo code");
    }
  };

  const handleCreatePromoCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setActionSuccess(null);
    try {
      const res = await fetch("/api/admin/promocodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCode,
          description: newDescription,
          plan_slug: newPlanSlug,
          max_uses: newMaxUses,
          expires_at: newExpiresAt ? new Date(newExpiresAt).toISOString() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create promo code");
      }

      setActionSuccess(`Promo code "${data.promoCode.code}" created successfully!`);
      setShowCreateModal(false);
      setNewCode("");
      setNewDescription("");
      setNewMaxUses(5);
      setNewExpiresAt("");
      fetchPromoCodes();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Creation failed");
    } finally {
      setCreating(false);
    }
  };

  // Metrics
  const totalCodes = codes.length;
  const activeCodes = codes.filter((c) => c.is_active).length;
  const totalClaimed = codes.reduce((acc, c) => acc + c.used_count, 0);
  const totalAvailable = codes.reduce((acc, c) => acc + Math.max(0, c.max_uses - c.used_count), 0);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-hub-gold/10 border border-hub-gold/20 text-xs font-mono text-hub-gold mb-2">
            <Ticket className="w-3.5 h-3.5" />
            <span>LAUNCHDAY ACCESS CONTROL</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Promo Codes &amp; Free Access Passes
          </h1>
          <p className="mt-1 text-sm text-hub-text-secondary max-w-2xl">
            Create limited-use launchday codes (e.g. 5 free VIP or Pro accounts) to distribute to early community supporters, beta testers, or VIP partners.
          </p>
        </div>

        <button
          onClick={() => {
            setNewCode(`LAUNCH${Math.floor(100 + Math.random() * 900)}`);
            setShowCreateModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-hub-gold text-white hover:bg-hub-gold-hover transition-all active:scale-95 shadow-md shadow-hub-gold/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Promo Code</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
          <p className="text-xs font-mono text-hub-text-secondary">TOTAL CODES</p>
          <p className="text-2xl font-extrabold text-white font-mono">{totalCodes}</p>
        </div>
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
          <p className="text-xs font-mono text-hub-text-secondary">ACTIVE CAMPAIGNS</p>
          <p className="text-2xl font-extrabold text-emerald-400 font-mono">{activeCodes}</p>
        </div>
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
          <p className="text-xs font-mono text-hub-text-secondary">CLAIMED ACCOUNTS</p>
          <p className="text-2xl font-extrabold text-hub-gold font-mono">{totalClaimed}</p>
        </div>
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
          <p className="text-xs font-mono text-hub-text-secondary">REMAINING SLOTS</p>
          <p className="text-2xl font-extrabold text-cyan-400 font-mono">{totalAvailable}</p>
        </div>
      </div>

      {/* Promo Codes Table */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Active Promo Campaigns</h2>
          <span className="text-xs font-mono text-hub-text-secondary">{codes.length} total codes</span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-hub-gold flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs font-mono">Loading promo codes...</span>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-rose-400 text-xs font-mono">{error}</div>
        ) : codes.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Ticket className="w-8 h-8 text-hub-text-muted mx-auto" />
            <p className="text-sm text-hub-text-secondary">No promo codes created yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {codes.map((promo) => {
              const percentUsed = Math.min(100, Math.round((promo.used_count / promo.max_uses) * 100));
              const isFull = promo.used_count >= promo.max_uses;

              return (
                <div
                  key={promo.id}
                  className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-hub-gold/15 border border-hub-gold/30 text-white font-mono font-bold text-sm tracking-wider">
                        <span>{promo.code}</span>
                        <button
                          onClick={() => handleCopy(promo.code)}
                          title="Copy promo code"
                          className="hover:text-hub-gold transition-colors ml-1"
                        >
                          {copiedCode === promo.code ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-hub-text-secondary" />
                          )}
                        </button>
                      </div>

                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                          promo.plan_slug === "vip"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : promo.plan_slug === "pro"
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                            : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        }`}
                      >
                        {promo.plan_slug} Tier Access
                      </span>

                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          !promo.is_active
                            ? "bg-rose-500/20 text-rose-300"
                            : isFull
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-emerald-500/20 text-emerald-300"
                        }`}
                      >
                        {!promo.is_active ? "Disabled" : isFull ? "Fully Claimed" : "Active"}
                      </span>
                    </div>

                    <p className="text-xs text-hub-text-secondary">{promo.description || "No description provided."}</p>

                    <div className="flex items-center gap-4 text-[11px] font-mono text-hub-text-muted flex-wrap">
                      <span>Created: {new Date(promo.created_at).toLocaleDateString()}</span>
                      {promo.expires_at && (
                        <span>Expires: {new Date(promo.expires_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  {/* Usage Meter & Actions */}
                  <div className="flex items-center gap-6 shrink-0 flex-wrap sm:flex-nowrap justify-between md:justify-end">
                    <div className="space-y-1.5 w-36">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-hub-text-secondary">Claimed</span>
                        <span className="text-white font-bold">
                          {promo.used_count} / {promo.max_uses}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isFull ? "bg-amber-400" : "bg-hub-gold"
                          }`}
                          style={{ width: `${percentUsed}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedCodeForRedemptions(promo)}
                        className="px-3 py-1.5 rounded-xl text-xs font-mono bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-colors flex items-center gap-1.5"
                        title="View users who redeemed this code"
                      >
                        <Users className="w-3.5 h-3.5 text-hub-gold" />
                        <span>{promo.used_count} Claimants</span>
                      </button>

                      <button
                        onClick={() => handleToggleActive(promo.id, Boolean(promo.is_active))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono border transition-colors ${
                          promo.is_active
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                        }`}
                      >
                        {promo.is_active ? "Disable" : "Enable"}
                      </button>

                      <button
                        onClick={() => handleDelete(promo.id, promo.code)}
                        className="p-1.5 rounded-xl text-hub-text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete code"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Claimants Modal */}
      {selectedCodeForRedemptions && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f131a] border border-white/15 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-hub-gold" />
                  <span>Redemptions for {selectedCodeForRedemptions.code}</span>
                </h3>
                <p className="text-xs text-hub-text-secondary mt-0.5">
                  {selectedCodeForRedemptions.used_count} of {selectedCodeForRedemptions.max_uses} free passes claimed
                </p>
              </div>
              <button
                onClick={() => setSelectedCodeForRedemptions(null)}
                className="text-hub-text-muted hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 max-h-80 overflow-y-auto">
              {!selectedCodeForRedemptions.redemptions || selectedCodeForRedemptions.redemptions.length === 0 ? (
                <div className="text-center py-8 text-hub-text-secondary text-xs font-mono">
                  No one has redeemed this code yet. Share it with your early users!
                </div>
              ) : (
                <div className="divide-y divide-white/5 space-y-2">
                  {selectedCodeForRedemptions.redemptions.map((r) => (
                    <div key={r.id} className="pt-2 flex items-center justify-between text-xs font-mono">
                      <div>
                        <p className="text-white font-medium">{r.user_email}</p>
                        <p className="text-[10px] text-hub-text-muted">UID: {r.user_id.slice(0, 14)}...</p>
                      </div>
                      <span className="text-[11px] text-hub-gold">
                        {new Date(r.redeemed_at).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-white/[0.02] border-t border-white/10 flex justify-end">
              <button
                onClick={() => setSelectedCodeForRedemptions(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 text-white hover:bg-white/20"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Promo Code Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreatePromoCode}
            className="bg-[#0f131a] border border-white/15 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl space-y-5"
          >
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-hub-gold" />
                  <span>Create Launchday Promo Code</span>
                </h3>
                <p className="text-xs text-hub-text-secondary mt-0.5">
                  Grant instant free Pro or VIP memberships to early users.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-hub-text-muted hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-mono text-hub-text-secondary mb-1">
                  PROMO CODE (UPPERCASE)
                </label>
                <input
                  type="text"
                  required
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="e.g. LAUNCHDAY5, FREEVIP"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white font-mono text-sm focus:outline-none focus:border-hub-gold uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-hub-text-secondary mb-1">
                  TARGET MEMBERSHIP TIER
                </label>
                <select
                  value={newPlanSlug}
                  onChange={(e) => setNewPlanSlug(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#141923] border border-white/15 text-white font-mono text-sm focus:outline-none focus:border-hub-gold"
                >
                  <option value="vip">VIP Architecture (Full Lifetime Access)</option>
                  <option value="pro">Pro Engineer Tier</option>
                  <option value="basic">Basic Developer Tier</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-hub-text-secondary mb-1">
                    MAX USES (CLAIMANTS)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    required
                    value={newMaxUses}
                    onChange={(e) => setNewMaxUses(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white font-mono text-sm focus:outline-none focus:border-hub-gold"
                  />
                  <p className="text-[10px] text-hub-text-muted mt-1">e.g. 5 people</p>
                </div>

                <div>
                  <label className="block text-xs font-mono text-hub-text-secondary mb-1">
                    EXPIRY DATE (OPTIONAL)
                  </label>
                  <input
                    type="date"
                    value={newExpiresAt}
                    onChange={(e) => setNewExpiresAt(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#141923] border border-white/15 text-white font-mono text-sm focus:outline-none focus:border-hub-gold"
                  />
                  <p className="text-[10px] text-hub-text-muted mt-1">Leave empty for no expiry</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-hub-text-secondary mb-1">
                  INTERNAL CAMPAIGN NOTE
                </label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="e.g. For first 5 Twitter / LinkedIn early signups"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-hub-gold"
                />
              </div>
            </div>

            <div className="p-4 bg-white/[0.02] border-t border-white/10 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 text-white hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-hub-gold text-white hover:bg-hub-gold-hover disabled:opacity-50"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Create Promo Code</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

