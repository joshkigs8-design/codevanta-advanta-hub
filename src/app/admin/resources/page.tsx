"use client";

import { useEffect, useState } from "react";

interface ResourceItem {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  official_website: string;
  category_id: string;
  category_name?: string;
  pricing_classification: string;
  verification_status: string;
  featured: boolean;
  click_count: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function AdminResourcesPage() {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editingResource, setEditingResource] = useState<any | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        search,
        category: catFilter,
        status: statusFilter,
      });
      const res = await fetch(`/api/admin/resources?${q.toString()}`);
      const data = await res.json();
      setResources(data.resources || []);
      setCategories(data.categories || []);
    } catch {
      alert("Failed to load resources");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [search, catFilter, statusFilter]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      const res = await fetch(`/api/admin/resources/${id}`, { method: "DELETE" });
      if (!res.ok) alert("Failed to delete");
      else fetchResources();
    } catch {
      alert("Network error");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResource) return;
    setSaving(true);
    try {
      const isNew = isCreating;
      const url = isNew ? "/api/admin/resources" : `/api/admin/resources/${editingResource.id}`;
      const method = isNew ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingResource),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to save resource");
      } else {
        setEditingResource(null);
        setIsCreating(false);
        fetchResources();
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
          <h1 className="text-2xl font-bold text-hub-text-primary">Developer Resources</h1>
          <p className="text-sm text-hub-text-muted mt-1">
            Curate, edit, categorize, and verify all developer tools, APIs, and models.
          </p>
        </div>
        <button
          onClick={() => {
            setIsCreating(true);
            setEditingResource({
              name: "",
              slug: "",
              short_description: "",
              detailed_description: "",
              official_website: "",
              documentation_url: "",
              category_id: categories[0]?.id || "cat-apis",
              pricing_classification: "freemium",
              free_tier_details: "",
              api_key_required: false,
              account_required: true,
              credit_card_required: false,
              commercial_use_allowed: true,
              skill_level: "all_levels",
              verification_status: "verified",
              featured: false,
              editorial_notes: "",
            });
          }}
          className="bg-hub-gold text-white hover:bg-hub-gold-hover px-4 py-2 rounded text-sm font-medium"
        >
          + Add New Resource
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by name, description, or slug…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-hub-surface border border-hub-border rounded px-3 py-2 text-sm text-hub-text-primary focus:outline-none focus:ring-2 focus:ring-hub-gold sm:w-80"
        />
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="bg-hub-surface border border-hub-border rounded px-3 py-2 text-sm text-hub-text-primary focus:outline-none focus:ring-2 focus:ring-hub-gold sm:w-44"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-hub-surface border border-hub-border rounded px-3 py-2 text-sm text-hub-text-primary focus:outline-none focus:ring-2 focus:ring-hub-gold sm:w-40"
        >
          <option value="">All Statuses</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
          <option value="stale">Stale</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-hub-surface rounded-lg border border-hub-border-subtle overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-hub-text-muted">Loading resources…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-hub-surface-elevated text-xs uppercase text-hub-text-muted">
                <tr>
                  <th className="px-5 py-3">Resource</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Pricing Tier</th>
                  <th className="px-5 py-3">Verification</th>
                  <th className="px-5 py-3">Clicks</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hub-border-subtle">
                {resources.map((r) => (
                  <tr key={r.id} className="hover:bg-hub-surface-elevated/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {r.featured && <span className="text-hub-gold">★</span>}
                        <div className="font-medium text-hub-text-primary">{r.name}</div>
                      </div>
                      <div className="text-xs text-hub-text-muted truncate max-w-xs">{r.short_description}</div>
                    </td>
                    <td className="px-5 py-3 text-xs">{r.category_name}</td>
                    <td className="px-5 py-3 text-xs capitalize text-hub-text-muted">
                      {r.pricing_classification.replace(/_/g, " ")}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-[11px] font-mono px-2 py-0.5 rounded uppercase ${
                          r.verification_status === "verified"
                            ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                            : "bg-red-950/60 text-red-400 border border-red-800/40"
                        }`}
                      >
                        {r.verification_status}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs">{r.click_count}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => {
                            setIsCreating(false);
                            setEditingResource(r);
                          }}
                          className="px-2.5 py-1 text-xs rounded bg-hub-surface-elevated border border-hub-border hover:text-white"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(r.id, r.name)}
                          className="px-2.5 py-1 text-xs rounded bg-red-950/40 border border-red-800/40 text-red-400 hover:bg-red-900/60"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resource Modal */}
      {editingResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
          <form
            onSubmit={handleSave}
            className="bg-hub-surface border border-hub-border rounded-lg max-w-2xl w-full p-6 space-y-4 my-8"
          >
            <div className="flex justify-between items-center border-b border-hub-border pb-3">
              <h3 className="text-lg font-bold text-hub-text-primary">
                {isCreating ? "Add Developer Resource" : `Edit: ${editingResource.name}`}
              </h3>
              <button
                type="button"
                onClick={() => setEditingResource(null)}
                className="text-hub-text-muted hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-hub-text-muted mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={editingResource.name}
                  onChange={(e) => setEditingResource({ ...editingResource, name: e.target.value })}
                  className="w-full bg-hub-surface-elevated border border-hub-border rounded p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-hub-text-muted mb-1">Slug</label>
                <input
                  type="text"
                  required
                  disabled={!isCreating}
                  value={editingResource.slug}
                  onChange={(e) => setEditingResource({ ...editingResource, slug: e.target.value })}
                  className="w-full bg-hub-surface-elevated border border-hub-border rounded p-2 text-white disabled:opacity-50"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-hub-text-muted mb-1">Short Description</label>
                <input
                  type="text"
                  required
                  value={editingResource.short_description}
                  onChange={(e) =>
                    setEditingResource({ ...editingResource, short_description: e.target.value })
                  }
                  className="w-full bg-hub-surface-elevated border border-hub-border rounded p-2 text-white"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-hub-text-muted mb-1">Detailed Description</label>
                <textarea
                  rows={3}
                  value={editingResource.detailed_description || ""}
                  onChange={(e) =>
                    setEditingResource({ ...editingResource, detailed_description: e.target.value })
                  }
                  className="w-full bg-hub-surface-elevated border border-hub-border rounded p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-hub-text-muted mb-1">Official Website URL</label>
                <input
                  type="url"
                  required
                  value={editingResource.official_website}
                  onChange={(e) =>
                    setEditingResource({ ...editingResource, official_website: e.target.value })
                  }
                  className="w-full bg-hub-surface-elevated border border-hub-border rounded p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-hub-text-muted mb-1">Documentation URL</label>
                <input
                  type="url"
                  value={editingResource.documentation_url || ""}
                  onChange={(e) =>
                    setEditingResource({ ...editingResource, documentation_url: e.target.value })
                  }
                  className="w-full bg-hub-surface-elevated border border-hub-border rounded p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-hub-text-muted mb-1">Category</label>
                <select
                  value={editingResource.category_id}
                  onChange={(e) =>
                    setEditingResource({ ...editingResource, category_id: e.target.value })
                  }
                  className="w-full bg-hub-surface-elevated border border-hub-border rounded p-2 text-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-hub-text-muted mb-1">Pricing Model</label>
                <select
                  value={editingResource.pricing_classification}
                  onChange={(e) =>
                    setEditingResource({ ...editingResource, pricing_classification: e.target.value })
                  }
                  className="w-full bg-hub-surface-elevated border border-hub-border rounded p-2 text-white"
                >
                  <option value="free_and_open_source">Free & Open Source</option>
                  <option value="free_hosted_service">Free Hosted Service</option>
                  <option value="freemium">Freemium</option>
                  <option value="limited_trial">Limited Trial</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-hub-text-muted mb-1">Free Tier Specifics</label>
                <input
                  type="text"
                  value={editingResource.free_tier_details || ""}
                  onChange={(e) =>
                    setEditingResource({ ...editingResource, free_tier_details: e.target.value })
                  }
                  className="w-full bg-hub-surface-elevated border border-hub-border rounded p-2 text-white"
                />
              </div>
            </div>

            <div className="border-t border-hub-border pt-3 flex flex-wrap gap-4 text-xs">
              <label className="flex items-center gap-2 text-hub-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(editingResource.featured)}
                  onChange={(e) =>
                    setEditingResource({ ...editingResource, featured: e.target.checked })
                  }
                  className="rounded border-hub-border bg-hub-surface-elevated text-hub-gold focus:ring-hub-gold"
                />
                Featured Listing
              </label>
              <label className="flex items-center gap-2 text-hub-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(editingResource.api_key_required)}
                  onChange={(e) =>
                    setEditingResource({ ...editingResource, api_key_required: e.target.checked })
                  }
                  className="rounded border-hub-border bg-hub-surface-elevated text-hub-gold focus:ring-hub-gold"
                />
                API Key Required
              </label>
              <label className="flex items-center gap-2 text-hub-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(editingResource.credit_card_required)}
                  onChange={(e) =>
                    setEditingResource({ ...editingResource, credit_card_required: e.target.checked })
                  }
                  className="rounded border-hub-border bg-hub-surface-elevated text-hub-gold focus:ring-hub-gold"
                />
                Credit Card Required
              </label>
            </div>

            <div className="border-t border-hub-border pt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingResource(null)}
                className="px-4 py-2 text-xs rounded bg-hub-surface-elevated border border-hub-border text-hub-text-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-xs rounded bg-hub-gold text-white hover:bg-hub-gold-hover font-medium disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save Resource"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

