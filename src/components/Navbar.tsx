"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import BrandLogo from "./BrandLogo";
import {
  Compass,
  BookOpen,
  Sparkles,
  ShieldAlert,
  User,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  Share2,
  ArrowRight,
} from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: "user" | "member" | "admin";
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null));
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setUserMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  const navLinks = [
    { href: "/directory", label: "Directory", icon: Compass },
    { href: "/guides", label: "Learning & Blueprints", icon: BookOpen },
    { href: "/plans", label: "Membership Plans", icon: Sparkles },
    { href: "/compliance", label: "Compliance & Safety", icon: ShieldAlert },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-hub-bg/85 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[76px] flex items-center justify-between">
        {/* Brand */}
        <BrandLogo />

        {/* Desktop Nav - Floating Frosted Capsule */}
        <nav className="hidden md:flex items-center gap-1 rounded-full border border-white/15 bg-black/45 backdrop-blur-xl p-1 shadow-lg">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? "bg-hub-gold text-white border border-hub-gold/50 shadow-gold-glow"
                    : "text-hub-text-secondary hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* User / Actions */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-black/50 border border-white/15 hover:border-hub-gold/50 text-sm transition-colors text-hub-text-primary"
              >
                <div className="w-6 h-6 rounded-full bg-hub-gold/20 text-hub-gold flex items-center justify-center font-bold text-xs uppercase border border-hub-gold/40">
                  {user.full_name ? user.full_name.charAt(0) : "U"}
                </div>
                <span className="max-w-[120px] truncate font-medium">{user.full_name}</span>
                {user.role === "admin" && (
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800">
                    Admin
                  </span>
                )}
                {user.role === "member" && (
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-hub-gold/20 text-hub-gold border border-hub-gold/30">
                    Member
                  </span>
                )}
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-hub-surface-elevated border border-hub-border shadow-2xl py-2 z-50 text-sm">
                  <div className="px-4 py-2 border-b border-hub-border">
                    <p className="font-medium text-hub-text-primary truncate">{user.full_name}</p>
                    <p className="text-xs text-hub-text-muted truncate">{user.email}</p>
                  </div>

                  <Link
                    href="/dashboard"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-hub-text-secondary hover:text-hub-text-primary hover:bg-hub-surface transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 text-hub-gold" />
                    Member Dashboard
                  </Link>

                  <Link
                    href="/dashboard#referrals"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-hub-text-secondary hover:text-hub-text-primary hover:bg-hub-surface transition-colors"
                  >
                    <Share2 className="w-4 h-4 text-emerald-400" />
                    Referrals &amp; Wallet
                  </Link>

                  {user.role === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-red-300 hover:text-white hover:bg-red-950/40 transition-colors"
                    >
                      <ShieldAlert className="w-4 h-4 text-red-400" />
                      Admin Control Panel
                    </Link>
                  )}

                  <div className="border-t border-hub-border mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 px-4 py-2 text-red-400 hover:bg-red-950/30 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 rounded-full text-xs font-medium text-hub-text-secondary hover:text-white hover:bg-white/10 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-white text-black hover:bg-hub-gold hover:text-white transition-all active:scale-95 shadow-md group"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-hub-text-secondary hover:text-hub-text-primary hover:bg-hub-surface"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-hub-border bg-hub-surface px-4 pt-2 pb-6 space-y-3">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-hub-text-secondary hover:text-hub-text-primary hover:bg-hub-surface-elevated"
                >
                  <Icon className="w-4 h-4 text-hub-gold" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="border-t border-hub-border pt-3">
            {user ? (
              <div className="space-y-2">
                <div className="px-3 py-1">
                  <p className="font-medium text-hub-text-primary">{user.full_name}</p>
                  <p className="text-xs text-hub-text-muted">{user.email}</p>
                </div>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm bg-hub-surface-elevated text-hub-gold font-medium"
                >
                  Member Dashboard &amp; Wallet
                </Link>
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-xl text-sm bg-red-950/50 text-red-400 font-medium border border-red-800/40"
                  >
                    Admin Control Panel
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-950/20"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 rounded-xl text-xs font-medium bg-hub-surface-elevated border border-hub-border text-hub-text-primary"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 rounded-xl text-xs font-semibold bg-white text-black hover:bg-hub-gold hover:text-white"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
