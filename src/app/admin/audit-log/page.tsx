"use client";

import { useEffect, useState } from "react";

interface AuditLog {
  id: string;
  action: string;
  target_entity: string;
  target_id: string;
  details: string;
  created_at: string;
  admin_name?: string;
  admin_email?: string;
}

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        page: page.toString(),
        limit: "25",
        action: actionFilter,
      });
      const res = await fetch(`/api/admin/audit-log?${q.toString()}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      alert("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-hub-text-primary">Audit Log</h1>
        <p className="text-sm text-hub-text-muted mt-1">
          Immutable system log of all administrative actions, status updates, and modifications.
        </p>
      </div>

      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Filter by action (e.g. update_setting, create_resource)…"
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          className="bg-hub-surface border border-hub-border rounded px-3 py-2 text-sm text-hub-text-primary focus:outline-none focus:ring-2 focus:ring-hub-gold sm:w-80"
        />
      </div>

      <div className="bg-hub-surface rounded-lg border border-hub-border-subtle overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-hub-text-muted">Loading audit entries…</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-sm text-hub-text-muted">No audit logs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-hub-surface-elevated text-xs uppercase text-hub-text-muted">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Admin</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Target Entity</th>
                  <th className="px-5 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hub-border-subtle">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-hub-surface-elevated/50">
                    <td className="px-5 py-3 text-xs text-hub-text-muted whitespace-nowrap">
                      {new Date(l.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-xs">
                      <div className="font-medium text-hub-text-primary">{l.admin_name || "System"}</div>
                      <div className="text-[10px] text-hub-text-muted font-mono">{l.admin_email}</div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-hub-gold">{l.action}</td>
                    <td className="px-5 py-3 text-xs font-mono text-hub-text-secondary">
                      {l.target_entity} / {l.target_id?.slice(0, 8)}…
                    </td>
                    <td className="px-5 py-3 text-xs font-mono text-hub-text-muted max-w-xs truncate">
                      {l.details}
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
    </div>
  );
}

