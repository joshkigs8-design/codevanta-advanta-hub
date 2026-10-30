"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: "user" | "member" | "admin";
  phone_number?: string;
  country: string;
  created_at: string;
  membership?: {
    id: string;
    plan_slug: string;
    plan_name: string;
    status: string;
    amount_paid_kes: number;
    starts_at: string;
    expires_at?: string;
  } | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [accessPlan, setAccessPlan] = useState("pro");
  const [accessDuration, setAccessDuration] = useState("month");
  const [accessError, setAccessError] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        search,
        role: roleFilter,
      });
      const res = await fetch(`/api/admin/users?${q.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load users");
      setUsers(data.users || []);
      setTotalPages(data.totalPages || 1);
      setTotalUsers(typeof data.total === "number" ? data.total : (data.users?.length || 0));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching users");
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to update role");
      } else {
        await fetchUsers();
        if (selectedUser?.id === userId) {
          setSelectedUser((prev) => (prev ? { ...prev, role: newRole as any } : null));
        }
      }
    } catch (e) {
      alert("Network error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleGrantAccess = async () => {
    if (!selectedUser) return;
    setUpdatingId(selectedUser.id);
    setAccessError("");
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug: accessPlan, duration: accessDuration }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAccessError(data.error || "Failed to grant access");
        return;
      }
      await fetchUsers();
      setSelectedUser((prev) => (prev ? {
        ...prev,
        membership: {
          id: "",
          plan_slug: data.membership.plan_slug,
          plan_name: data.membership.plan_name,
          status: "active",
          amount_paid_kes: 0,
          starts_at: new Date().toISOString(),
          expires_at: data.membership.expires_at,
        },
      } : null));
    } catch {
      setAccessError("Network error while granting access");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-hub-text-primary">User Management</h1>
          <p className="text-sm text-hub-text-muted mt-1">
            {totalUsers !== null ? `${totalUsers} registered user${totalUsers === 1 ? "" : "s"} total.` : "Loading registered members…"}{" "}
            Search, inspect, and update roles or access for registered members.
          </p>
        </div>
        <button
          onClick={() => fetchUsers()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-hub-surface-elevated border border-hub-border text-hub-text-secondary hover:text-white hover:border-hub-gold/40 self-start sm:self-auto transition-colors"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="bg-hub-surface border border-hub-border rounded px-3 py-2 text-sm text-hub-text-primary focus:outline-none focus:ring-2 focus:ring-hub-gold sm:w-80"
        />
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="bg-hub-surface border border-hub-border rounded px-3 py-2 text-sm text-hub-text-primary focus:outline-none focus:ring-2 focus:ring-hub-gold sm:w-44"
        >
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-hub-surface rounded-lg border border-hub-border-subtle overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-hub-text-muted">Loading users…</div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={() => fetchUsers()}
              className="px-4 py-2 text-xs font-semibold rounded bg-hub-gold text-black hover:bg-hub-gold/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-sm text-hub-text-muted">No users found matching query.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-hub-surface-elevated text-xs uppercase text-hub-text-muted tracking-wider">
                <tr>
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Plan</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hub-border-subtle">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-hub-surface-elevated/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-medium text-hub-text-primary">{u.full_name}</div>
                      <div className="text-xs text-hub-text-muted font-mono">{u.email}</div>
                    </td>
                    <td className="px-5 py-3">
                      <select
                        disabled={updatingId === u.id}
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="bg-hub-surface-elevated border border-hub-border rounded px-2 py-1 text-xs text-hub-text-primary focus:ring-1 focus:ring-hub-gold disabled:opacity-50"
                      >
                        <option value="user">User</option>
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {u.membership ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-hub-gold/10 text-hub-gold border border-hub-gold/30">
                          {u.membership.plan_name}
                        </span>
                      ) : (
                        <span className="text-xs text-hub-text-muted">None</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-hub-text-muted whitespace-nowrap">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="px-2.5 py-1 text-xs rounded bg-hub-surface-elevated border border-hub-border text-hub-text-secondary hover:text-hub-text-primary hover:border-hub-gold/40"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-hub-border text-xs text-hub-text-muted">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 rounded bg-hub-surface-elevated border border-hub-border disabled:opacity-40"
            >
              Prev
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 rounded bg-hub-surface-elevated border border-hub-border disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-hub-surface border border-hub-border rounded-lg max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-start border-b border-hub-border pb-3">
              <div>
                <h3 className="text-lg font-bold text-hub-text-primary">{selectedUser.full_name}</h3>
                <p className="text-xs font-mono text-hub-text-muted">{selectedUser.id}</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-hub-text-muted hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-hub-text-muted block">Email:</span>
                <span className="text-hub-text-primary font-mono">{selectedUser.email}</span>
              </div>
              <div>
                <span className="text-hub-text-muted block">Phone:</span>
                <span className="text-hub-text-primary">{selectedUser.phone_number || "None"}</span>
              </div>
              <div>
                <span className="text-hub-text-muted block">Country:</span>
                <span className="text-hub-text-primary">{selectedUser.country}</span>
              </div>
              <div>
                <span className="text-hub-text-muted block">Role:</span>
                <span className="text-hub-text-primary font-bold uppercase">{selectedUser.role}</span>
              </div>
              <div>
                <span className="text-hub-text-muted block">Current Plan:</span>
                <span className="text-hub-text-primary">
                  {selectedUser.membership ? selectedUser.membership.plan_name : "Free User"}
                </span>
              </div>
              <div>
                <span className="text-hub-text-muted block">Joined:</span>
                <span className="text-hub-text-primary">
                  {new Date(selectedUser.created_at).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="border-t border-hub-border pt-4 space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-hub-text-primary">Grant membership access</h4>
                <p className="text-xs text-hub-text-muted mt-1">This replaces the user&apos;s current active membership.</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={accessPlan}
                  onChange={(e) => setAccessPlan(e.target.value)}
                  className="bg-hub-surface-elevated border border-hub-border rounded px-2 py-2 text-xs text-hub-text-primary"
                >
                  <option value="basic">Basic</option>
                  <option value="pro">Pro</option>
                  <option value="vip">VIP</option>
                </select>
                <select
                  value={accessDuration}
                  onChange={(e) => setAccessDuration(e.target.value)}
                  className="bg-hub-surface-elevated border border-hub-border rounded px-2 py-2 text-xs text-hub-text-primary"
                >
                  <option value="month">One month</option>
                  <option value="lifetime">Lifetime</option>
                </select>
              </div>
              {accessError && <p className="text-xs text-red-400">{accessError}</p>}
              <button
                onClick={handleGrantAccess}
                disabled={updatingId === selectedUser.id}
                className="w-full px-4 py-2 text-xs font-semibold rounded bg-hub-gold text-black hover:bg-hub-gold/90 disabled:opacity-50"
              >
                {updatingId === selectedUser.id ? "Granting access…" : "Grant access"}
              </button>
            </div>

            <div className="border-t border-hub-border pt-4 flex justify-end gap-2">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-1.5 text-xs rounded bg-hub-surface-elevated border border-hub-border text-hub-text-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
