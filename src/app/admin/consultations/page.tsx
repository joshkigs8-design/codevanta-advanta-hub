"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Loader2 } from "lucide-react";

interface ConsultationRequest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  project_description?: string;
  status: string;
  created_at: string;
}

export default function AdminConsultationsPage() {
  const [requests, setRequests] = useState<ConsultationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/consultations")
      .then((response) => response.json())
      .then((data) => setRequests(data.requests || []))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-7">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-hub-gold/10 border border-hub-gold/20 text-xs font-mono text-hub-gold mb-2">
          <ClipboardList className="w-3.5 h-3.5" />
          CONSULTATION LEADS
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Architecture Advisory Requests</h1>
        <p className="text-sm text-hub-text-secondary mt-1">
          Requests submitted through the public website consultation form.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
        {loading ? (
          <div className="p-16 text-center text-hub-gold"><Loader2 className="mx-auto animate-spin" /></div>
        ) : requests.length === 0 ? (
          <div className="p-16 text-center text-sm text-hub-text-muted">No consultation requests yet.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.04] text-xs uppercase text-hub-text-muted">
              <tr>
                <th className="px-5 py-3">Contact</th>
                <th className="px-5 py-3">Project description</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {requests.map((request) => (
                <tr key={request.id} className="align-top hover:bg-white/[0.03]">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-white">{request.name}</div>
                    <div className="text-xs text-hub-text-secondary">{request.email}</div>
                    {request.phone && <div className="text-xs text-hub-text-muted">{request.phone}</div>}
                  </td>
                  <td className="max-w-xl whitespace-pre-wrap px-5 py-4 text-hub-text-secondary">
                    {request.project_description || "No description provided."}
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] uppercase text-amber-300">
                      {request.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-xs text-hub-text-muted">
                    {new Date(request.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
