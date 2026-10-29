"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  Gem,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShieldCheck,
  Users,
  X,
  Zap,
} from "lucide-react";

const sidebarGroups = [
  {
    label: "Workspace",
    links: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/plans", label: "Plans & access", icon: Gem },
      { href: "/admin/payments", label: "Payments", icon: CreditCard },
    ],
  },
  {
    label: "Growth",
    links: [
      { href: "/admin/referrals", label: "Referrals", icon: Zap },
      { href: "/admin/resources", label: "Resources", icon: Package },
      { href: "/admin/reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    label: "Control",
    links: [
      { href: "/admin/audit-log", label: "Audit log", icon: ClipboardList },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

interface AdminUser {
  email: string;
  full_name: string;
  role: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) return;
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((data) => {
        if (data.authenticated && data.user) setUser(data.user);
      })
      .catch(() => undefined);
  }, [isLoginPage]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  if (isLoginPage) {
    return <div className="min-h-screen bg-hub-bg text-hub-text-primary">{children}</div>;
  }

  return (
    <div className="admin-shell min-h-screen bg-hub-bg text-hub-text-primary lg:flex">
      {mobileOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-950/75 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-white/[0.08] bg-[#0d111a]/95 px-3 transition-transform duration-300 lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${sidebarOpen ? "lg:w-[280px]" : "lg:w-[82px]"}`}
      >
        <div className="flex h-[76px] items-center justify-between border-b border-white/[0.08] px-3">
          <Link href="/admin" className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-hub-gold text-white shadow-gold-glow">
              <ShieldCheck size={19} strokeWidth={2.2} />
            </span>
            {sidebarOpen && (
              <span className="truncate text-sm font-bold tracking-tight text-white">
                CodeVanta <span className="text-hub-gold">Command</span>
              </span>
            )}
          </Link>
          <button
            onClick={() => setSidebarOpen((open) => !open)}
            className="hidden h-8 w-8 items-center justify-center rounded-lg text-hub-text-muted hover:bg-white/[0.06] hover:text-white lg:flex"
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-hub-text-muted hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-5">
          {sidebarGroups.map((group) => (
            <div key={group.label} className="mb-6">
              {sidebarOpen && (
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-hub-text-muted">
                  {group.label}
                </p>
              )}
              <div className="space-y-1">
                {group.links.map((link) => {
                  const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      title={link.label}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                        active
                          ? "bg-hub-gold text-white shadow-[0_8px_24px_rgba(201,0,61,0.2)]"
                          : "text-hub-text-secondary hover:bg-white/[0.06] hover:text-white"
                      } ${!sidebarOpen ? "justify-center" : ""}`}
                    >
                      <Icon size={17} strokeWidth={active ? 2.3 : 1.8} />
                      {sidebarOpen && <span>{link.label}</span>}
                      {sidebarOpen && active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/[0.08] py-4">
          <Link
            href="/"
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium text-hub-text-muted hover:bg-white/[0.06] hover:text-white ${
              !sidebarOpen ? "justify-center" : ""
            }`}
            title="Back to public site"
          >
            <ArrowLeft size={16} />
            {sidebarOpen && <span>Back to website</span>}
          </Link>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[76px] shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#0b0f17]/80 px-4 backdrop-blur-xl sm:px-7">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] text-hub-text-secondary hover:text-white lg:hidden"
            aria-label="Open navigation"
          >
            <Menu size={19} />
          </button>
          <div className="hidden items-center gap-2 text-xs text-hub-text-muted lg:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            All systems operational
          </div>
          <div className="ml-auto flex items-center gap-3">
            {user && (
              <div className="hidden items-center gap-2.5 sm:flex">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-hub-gold/30 bg-hub-gold/10 text-xs font-bold uppercase text-hub-gold">
                  {user.full_name?.charAt(0) || "A"}
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">{user.full_name}</p>
                  <p className="text-[11px] text-hub-text-muted">{user.role} access</p>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl border border-white/[0.08] px-3 py-2 text-xs font-medium text-hub-text-secondary hover:border-red-400/40 hover:text-red-300"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>
        <main className="admin-content flex-1 overflow-y-auto p-4 sm:p-7 xl:p-9">{children}</main>
      </div>
    </div>
  );
}
