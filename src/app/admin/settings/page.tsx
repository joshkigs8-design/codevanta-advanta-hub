"use client";

import { useEffect, useState } from "react";

interface SettingItem {
  key: string;
  value: string;
  description: string;
  updated_at: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      setSettings(data.settings || []);
    } catch {
      alert("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdate = async (key: string, value: string) => {
    setSavingKey(key);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) {
        alert("Failed to update setting");
      } else {
        alert("Setting updated successfully!");
        fetchSettings();
      }
    } catch {
      alert("Network error");
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-hub-text-primary">System Settings</h1>
        <p className="text-sm text-hub-text-muted mt-1">
          Configure site metadata, payout thresholds, and operational rules.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-hub-text-muted">Loading settings…</div>
      ) : (
        <div className="bg-hub-surface rounded-lg border border-hub-border-subtle divide-y divide-hub-border-subtle">
          {settings.map((s) => (
            <div key={s.key} className="p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="max-w-md">
                <span className="font-mono text-xs text-hub-gold uppercase block">{s.key}</span>
                <p className="text-xs text-hub-text-muted mt-0.5">{s.description}</p>
                <span className="text-[10px] text-hub-text-muted/60 mt-1 block">
                  Last updated: {new Date(s.updated_at).toLocaleString()}
                </span>
              </div>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  defaultValue={s.value}
                  id={`input-${s.key}`}
                  className="bg-hub-surface-elevated border border-hub-border rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-hub-gold w-64"
                />
                <button
                  disabled={savingKey === s.key}
                  onClick={() => {
                    const input = document.getElementById(`input-${s.key}`) as HTMLInputElement;
                    if (input) handleUpdate(s.key, input.value);
                  }}
                  className="px-3 py-1.5 rounded text-xs bg-hub-gold text-white hover:bg-hub-gold-hover disabled:opacity-50 font-medium"
                >
                  {savingKey === s.key ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

