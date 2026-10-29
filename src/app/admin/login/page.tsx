"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }
      // On success, redirect. Preserve optional redirect query param.
      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get("redirect") || "/admin";
      router.push(redirect);
    } catch (e) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-hub-bg text-hub-text-primary">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg bg-gray-900 p-6 shadow-xl"
      >
        <h2 className="mb-4 text-center text-2xl font-semibold text-hub-gold">
          Admin Login
        </h2>
        {error && (
          <p className="mb-3 rounded bg-red-800 px-2 py-1 text-sm text-red-100">
            {error}
          </p>
        )}
        <div className="mb-4">
          <label className="block text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            className="mt-1 w-full rounded border border-gray-700 bg-gray-800 p-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-hub-gold"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            className="mt-1 w-full rounded border border-gray-700 bg-gray-800 p-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-hub-gold"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-hub-gold py-2 font-semibold text-black hover:bg-hub-gold/90 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}

