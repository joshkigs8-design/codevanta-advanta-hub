"use client";

import { useEffect, useState } from "react";

interface Plan {
  id: string;
  slug: string;
  name: string;
  description: string;
  price_kes: number;
  direct_referral_reward_kes: number;
  billing_cycle: string;
  is_active: boolean;
  subscriber_count?: number;
  entitlements: Record<string, any>;
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/plans");
      const data = await res.json();
      setPlans(data.plans || []);
    } catch (e) {
      alert("Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleToggleActive = async (plan: Plan) => {
    try {
      const res = await fetch(`/api/admin/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !plan.is_active }),
      });
      if (!res.ok) alert("Failed to toggle status");
      else fetchPlans();
    } catch {
      alert("Network error");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    setSaving(true);
    try {
      const isNew = isCreating;
      const url = isNew ? "/api/admin/plans" : `/api/admin/plans/${editingPlan.id}`;
      const method = isNew ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingPlan),
      });

      if (!res.ok) {
        const d = await res.json();
        alert(d.error || "Failed to save plan");
      } else {
        setEditingPlan(null);
        setIsCreating(false);
        fetchPlans();
      }
    } catch {
      alert("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-hub-text-primary">Membership Plans</h1>
          <p className="text-sm text-hub-text-muted mt-1">
            Configure tiers, pricing (KES), commissions, and permissions.
          </p>
        </div>
        <button
          onClick={() => {
            setIsCreating(true);
            setEditingPlan({
              id: "",
              slug: "",
              name: "",
              description: "",
              price_kes: 1000,
              direct_referral_reward_kes: 100,
              billing_cycle: "lifetime",
              is_active: true,
              entitlements: {
                can_access_basic_directory: true,
                can_use_advanced_search: true,
                can_access_curated_collections: false,
                can_access_learning_paths: false,
                can_access_original_blueprints: false,
                can_download_starter_kits: false,
                can_access_early_releases: false,
                max_bookmarks: 25,
              },
            });
          }}
          className="bg-hub-gold text-white hover:bg-hub-gold-hover px-4 py-2 rounded text-sm font-medium"
        >
          + Add New Plan
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-hub-text-muted">Loading plans…</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.id}
              className={`rounded-lg border bg-hub-surface p-5 flex flex-col justify-between ${
                p.is_active ? "border-hub-border-subtle" : "border-red-900/30 opacity-70"
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-hub-text-primary">{p.name}</h3>
                  <span
                    className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded ${
                      p.is_active
                        ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                        : "bg-red-950/60 text-red-400 border border-red-800/40"
                    }`}
                  >
                    {p.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-xs text-hub-text-muted mb-4">{p.description}</p>
                <div className="space-y-2 border-t border-b border-hub-border-subtle py-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-hub-text-muted">Price:</span>
                    <span className="font-mono font-bold text-hub-gold">KES {p.price_kes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-hub-text-muted">Referral Commission:</span>
                    <span className="font-mono text-hub-text-primary">KES {p.direct_referral_reward_kes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-hub-text-muted">Cycle:</span>
                    <span className="text-hub-text-primary capitalize">{p.billing_cycle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-hub-text-muted">Active Subscribers:</span>
                    <span className="font-mono text-cyan-400">{p.subscriber_count || 0}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-2">
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setEditingPlan(p);
                  }}
                  className="flex-1 py-1.5 text-xs rounded bg-hub-surface-elevated border border-hub-border hover:text-white"
                >
                  Edit Plan
                </button>
                <button
                  onClick={() => handleToggleActive(p)}
                  className={`px-3 py-1.5 text-xs rounded border ${
                    p.is_active
                      ? "border-red-800/40 text-red-400 hover:bg-red-950/30"
                      : "border-emerald-800/40 text-emerald-400 hover:bg-emerald-950/30"
                  }`}
                >
                  {p.is_active ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Plan Edit / Create Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
          <form
            onSubmit={handleSave}
            className="bg-hub-surface border border-hub-border rounded-lg max-w-xl w-full p-6 space-y-4 my-8"
          >
            <div className="flex justify-between items-center border-b border-hub-border pb-3">
              <h3 className="text-lg font-bold text-hub-text-primary">
                {isCreating ? "Create Membership Plan" : `Edit Plan: ${editingPlan.name}`}
              </h3>
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="text-hub-text-muted hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-hub-text-muted mb-1">Plan Name</label>
                <input
                  type="text"
                  required
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  className="w-full bg-hub-surface-elevated border border-hub-border rounded p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-hub-text-muted mb-1">Slug</label>
                <input
                  type="text"
                  required
                  disabled={!isCreating}
                  value={editingPlan.slug}
                  onChange={(e) => setEditingPlan({ ...editingPlan, slug: e.target.value })}
                  className="w-full bg-hub-surface-elevated border border-hub-border rounded p-2 text-white disabled:opacity-50"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-hub-text-muted mb-1">Description</label>
                <textarea
                  required
                  rows={2}
                  value={editingPlan.description}
                  onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  className="w-full bg-hub-surface-elevated border border-hub-border rounded p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-hub-text-muted mb-1">Price (KES)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={editingPlan.price_kes}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, price_kes: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-hub-surface-elevated border border-hub-border rounded p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-hub-text-muted mb-1">Referral Reward (KES)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={editingPlan.direct_referral_reward_kes}
                  onChange={(e) =>
                    setEditingPlan({
                      ...editingPlan,
                      direct_referral_reward_kes: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-hub-surface-elevated border border-hub-border rounded p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-hub-text-muted mb-1">Billing Cycle</label>
                <select
                  value={editingPlan.billing_cycle}
                  onChange={(e) => setEditingPlan({ ...editingPlan, billing_cycle: e.target.value })}
                  className="w-full bg-hub-surface-elevated border border-hub-border rounded p-2 text-white"
                >
                  <option value="lifetime">Lifetime</option>
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
              <div>
                <label className="block text-hub-text-muted mb-1">Max Bookmarks</label>
                <input
                  type="number"
                  value={editingPlan.entitlements?.max_bookmarks || 10}
                  onChange={(e) =>
                    setEditingPlan({
                      ...editingPlan,
                      entitlements: {
                        ...editingPlan.entitlements,
                        max_bookmarks: parseInt(e.target.value) || 10,
                      },
                    })
                  }
                  className="w-full bg-hub-surface-elevated border border-hub-border rounded p-2 text-white"
                />
              </div>
            </div>

            <div className="border-t border-hub-border pt-3">
              <span className="block text-xs font-semibold text-hub-text-muted mb-2">Entitlements</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  ["can_access_basic_directory", "Basic Directory Access"],
                  ["can_use_advanced_search", "Advanced Search Filters"],
                  ["can_access_curated_collections", "Curated Collections"],
                  ["can_access_learning_paths", "Learning Paths"],
                  ["can_access_original_blueprints", "Original Blueprints"],
                  ["can_download_starter_kits", "Download Starter Kits"],
                  ["can_access_early_releases", "Early Releases"],
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-hub-text-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editingPlan.entitlements?.[key])}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          entitlements: {
                            ...editingPlan.entitlements,
                            [key]: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-hub-border bg-hub-surface-elevated text-hub-gold focus:ring-hub-gold"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="border-t border-hub-border pt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="px-4 py-2 text-xs rounded bg-hub-surface-elevated border border-hub-border text-hub-text-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-xs rounded bg-hub-gold text-white hover:bg-hub-gold-hover font-medium disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save Plan"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

