"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

/* ── Sidebar link definitions ── */
const sidebarLinks = [
  { href: "/admin", label: "Dashboard", icon: "📊", exact: true },
  { href: "/admin/users", label: "Users", icon: "👥" },
  { href: "/admin/plans", label: "Plans", icon: "💎" },
  { href: "/admin/referrals", label: "Referrals", icon: "🔗" },
  { href: "/admin/payments", label: "Payments", icon: "💳" },
  { href: "/admin/resources", label: "Resources", icon: "📦" },
  { href: "/admin/reports", label: "Reports", icon: "📈" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
  { href: "/admin/audit-log", label: "Audit Log", icon: "📋" },
];

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);

  /* ── Login page gets no shell ── */
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) return;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated && d.user) setUser(d.user);
      })
      .catch(() => {});
  }, [isLoginPage]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  /* ── Login page: render children only (no sidebar / topbar) ── */
  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-hub-bg text-hub-text-primary">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hub-bg text-hub-text-primary flex">
      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed z-50 top-0 left-0 h-screen bg-hub-surface border-r border-hub-border
          flex flex-col transition-all duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto
          ${sidebarOpen ? "w-64" : "w-[72px]"}
        `}
      >
        {/* Brand */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-hub-border flex-shrink-0">
          <Link href="/admin" className="flex items-center gap-2.5 min-w-0">
            <span className="text-hub-gold text-xl font-bold flex-shrink-0">⬡</span>
            {sidebarOpen && (
              <span className="text-sm font-semibold text-hub-text-primary truncate">
                CodeVanta <span className="text-hub-gold">Admin</span>
              </span>
            )}
          </Link>
          {/* Desktop collapse */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md text-hub-text-muted hover:text-hub-text-primary hover:bg-hub-surface-elevated transition-colors"
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? "◁" : "▷"}
          </button>
          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden flex items-center justify-center w-7 h-7 rounded-md text-hub-text-muted hover:text-hub-text-primary"
          >
            ✕
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {sidebarLinks.map((link) => {
            const isActive = link.exact
              ? pathname === link.href
              : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                title={link.label}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${
                    isActive
                      ? "bg-hub-gold/10 text-hub-gold border border-hub-gold/20"
                      : "text-hub-text-secondary hover:text-hub-text-primary hover:bg-hub-surface-elevated border border-transparent"
                  }
                  ${!sidebarOpen ? "justify-center" : ""}
                `}
              >
                <span className="text-base flex-shrink-0 w-6 text-center">{link.icon}</span>
                {sidebarOpen && <span className="truncate">{link.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: back to site */}
        <div className="flex-shrink-0 border-t border-hub-border p-3">
          <Link
            href="/"
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-hub-text-muted
              hover:text-hub-text-primary hover:bg-hub-surface-elevated transition-colors
              ${!sidebarOpen ? "justify-center" : ""}
            `}
            title="Back to public site"
          >
            <span className="flex-shrink-0">↩</span>
            {sidebarOpen && <span>Back to Site</span>}
          </Link>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-hub-border bg-hub-surface/50 backdrop-blur-lg flex-shrink-0">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-hub-text-muted hover:text-hub-text-primary hover:bg-hub-surface-elevated"
            aria-label="Open sidebar"
          >
            <span className="text-xl">☰</span>
          </button>

          {/* Page title area — let it breathe */}
          <div className="hidden lg:block" />

          {/* Right side: admin info + logout */}
          <div className="flex items-center gap-3 ml-auto">
            {user && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-hub-gold/20 border border-hub-gold/40 flex items-center justify-center text-hub-gold font-bold text-xs uppercase">
                  {user.full_name?.charAt(0) || "A"}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-hub-text-primary leading-tight">
                    {user.full_name}
                  </p>
                  <p className="text-[11px] text-hub-text-muted leading-tight">
                    {user.email}
                  </p>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-hub-surface-elevated border border-hub-border text-hub-text-secondary hover:text-red-400 hover:border-red-800 transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
