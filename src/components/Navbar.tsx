"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import BrandLogo from "./BrandLogo";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { syncUserWithFirestoreAndBackend, logoutUser } from "@/lib/firebaseAuth";
import GlobalSearchModal from "./GlobalSearchModal";
import {
  Tv,
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
  Search,
  Wrench,
  GraduationCap,
  Layers,
  MessageCircle,
  BriefcaseBusiness,
  Zap,
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
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        let res = await fetch("/api/auth/me");
        let data = await res.json();
        if (data.authenticated && data.user) {
          if (isMounted) setUser(data.user);
          return;
        }

        // If backend returned unauthenticated, check Firebase client session
        if (isFirebaseConfigured()) {
          if (typeof auth.authStateReady === "function") {
            await auth.authStateReady();
          }
          const currentUser = auth.currentUser;
          if (currentUser) {
            await syncUserWithFirestoreAndBackend(currentUser);
            const retryRes = await fetch("/api/auth/me");
            const retryData = await retryRes.json();
            if (retryData.authenticated && retryData.user) {
              if (isMounted) setUser(retryData.user);
              return;
            }
          }
        }

        if (isMounted) setUser(null);
      } catch {
        if (isMounted) setUser(null);
      }
    };

    checkAuth();

    if (isFirebaseConfigured()) {
      const unsub = auth.onAuthStateChanged(async (currentUser) => {
        if (!currentUser) {
          if (isMounted) setUser(null);
          return;
        }

        await syncUserWithFirestoreAndBackend(currentUser);
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (isMounted) {
          setUser(data.authenticated && data.user ? data.user : null);
        }
      });
      return () => {
        isMounted = false;
        unsub();
      };
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    if (isFirebaseConfigured()) {
      try {
        await logoutUser();
      } catch {
        await fetch("/api/auth/logout", { method: "POST" });
      }
    } else {
      await fetch("/api/auth/logout", { method: "POST" });
    }
    setUser(null);
    setUserMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  const navLinks = [
    { href: "/directory", label: "Directory", icon: Compass },
    { href: "/tutorials", label: "Tutorials", icon: BookOpen },
    { href: "/learning-paths", label: "Paths", icon: Sparkles },
    { href: "/projects", label: "Projects", icon: Layers },
    { href: "/troubleshooting", label: "Fixes", icon: Wrench },
    { href: "/students", label: "Students", icon: GraduationCap },
    { href: "/referrals", label: "Earn", icon: Zap },
    { href: "/plans", label: "Pricing", icon: Sparkles },
    { href: "/downloader-codes", label: "Downloader", icon: Tv },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-hub-base/80 backdrop-blur-2xl overflow-hidden max-w-full">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-[74px] flex items-center justify-between gap-2 xl:gap-4 w-full min-w-0">
          {/* Brand */}
          <div className="shrink-0">
            <BrandLogo />
          </div>

          {/* Desktop Nav - Floating Frosted Capsule */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 rounded-full border border-white/[0.1] bg-black/50 backdrop-blur-xl p-1 shadow-2xl shrink-0">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1 xl:gap-1.5 px-2.5 xl:px-3.5 py-1 xl:py-1.5 rounded-full text-[11px] xl:text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-gold-glow"
                      : "text-hub-text-secondary hover:text-white hover:bg-white/[0.08]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Search Trigger & User Actions */}
          <div className="hidden md:flex items-center gap-2 xl:gap-3 shrink-0">
            {/* WhatsApp Community Channel (Ultra-wide screens only) */}
            <a
              href="https://whatsapp.com/channel/0029Vb84p6QKGGGNAp8VIB2g"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden 2xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-xs font-mono text-emerald-400 hover:text-white hover:bg-emerald-900 transition-all shadow-sm"
              title="Join our official WhatsApp Channel"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Channel</span>
            </a>
            <a
              href="https://www.joshkigen.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden 2xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/45 border border-white/[0.1] text-xs font-mono text-hub-text-muted hover:text-white hover:border-hub-gold/50 transition-all"
              title="Visit Josh Kigen's portfolio"
            >
              <BriefcaseBusiness className="w-3.5 h-3.5 text-hub-gold" />
              <span>Portfolio</span>
            </a>

            {/* Quick Search Button */}
            <button
              onClick={() => setSearchModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/45 border border-white/[0.1] text-xs text-hub-text-muted hover:text-white hover:border-hub-gold/50 transition-all font-mono shadow-sm group"
              title="Search documentation and tools (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-hub-gold group-hover:scale-110 transition-transform" />
              <span className="hidden xl:inline">Search...</span>
              <kbd className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded border border-white/10 text-white/80 font-mono">
                ⌘K
              </kbd>
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-black/60 border border-white/[0.12] hover:border-hub-gold/50 text-sm transition-all text-hub-text-primary"
                >
                  <div className="w-6 h-6 rounded-full bg-hub-gold/20 text-hub-gold flex items-center justify-center font-bold text-xs uppercase border border-hub-gold/40">
                    {user.full_name ? user.full_name.charAt(0) : "U"}
                  </div>
                  <span className="max-w-[120px] truncate font-medium text-xs">{user.full_name}</span>
                  {user.role === "admin" && (
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-red-950/80 text-red-400 border border-red-800/60">
                      Admin
                    </span>
                  )}
                  {user.role === "member" && (
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/60">
                      Member
                    </span>
                  )}
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-60 rounded-2xl glass-panel shadow-2xl py-2 z-50 text-sm animate-fadeIn">
                    <div className="px-4 py-2.5 border-b border-white/[0.08]">
                      <p className="font-semibold text-white truncate text-xs">{user.full_name}</p>
                      <p className="text-[11px] text-hub-text-muted truncate font-mono mt-0.5">{user.email}</p>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-hub-text-secondary hover:text-white hover:bg-white/[0.06] transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-hub-gold" />
                        Member Dashboard
                      </Link>

                      <Link
                        href="/dashboard#referrals"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-hub-text-secondary hover:text-white hover:bg-white/[0.06] transition-colors"
                      >
                        <Share2 className="w-4 h-4 text-emerald-400" />
                        Referrals &amp; Wallet
                      </Link>

                      {user.role === "admin" && (
                        <Link
                          href="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-red-400 hover:text-white hover:bg-red-950/40 transition-colors"
                        >
                          <ShieldAlert className="w-4 h-4 text-red-400" />
                          Admin Control Panel
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-white/[0.08] pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-medium text-red-400 hover:bg-red-950/30 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-full text-xs font-semibold text-hub-text-secondary hover:text-white hover:bg-white/[0.08] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-black transition-all active:scale-95 shadow-gold-glow group"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu and search buttons */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setSearchModalOpen(true)}
              className="p-2 rounded-xl text-hub-text-secondary hover:text-white hover:bg-white/[0.06]"
              aria-label="Search"
            >
              <Search className="w-5 h-5 text-hub-gold" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-hub-text-secondary hover:text-white hover:bg-white/[0.06]"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-white/[0.08] bg-hub-surface/95 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-4 animate-fadeIn">
            {/* Quick Referral Banner on Mobile */}
            <Link
              href="/referrals"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-transparent border border-hub-gold/40 text-hub-gold text-xs font-bold shadow-md hover:border-hub-gold transition-all"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-hub-gold/20 flex items-center justify-center text-hub-gold shrink-0">
                  <Zap className="w-4 h-4 text-hub-gold" />
                </div>
                <div>
                  <div className="text-white font-bold text-xs">2-Tier Referral Engine</div>
                  <div className="text-[10px] text-hub-text-muted font-normal">Earn up to KES 150 per referral</div>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-hub-gold text-black font-extrabold uppercase shrink-0">
                Earn
              </span>
            </Link>

            <div className="grid grid-cols-2 gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-hub-gold/20 text-hub-gold border border-hub-gold/40"
                        : "text-hub-text-secondary hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    <Icon className="w-4 h-4 text-hub-gold shrink-0" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="border-t border-white/[0.08] pt-3">
              {user ? (
                <div className="space-y-2">
                  <div className="px-3 py-1.5 bg-black/40 rounded-xl border border-white/[0.06]">
                    <p className="font-semibold text-white text-xs">{user.full_name}</p>
                    <p className="text-[11px] text-hub-text-muted font-mono">{user.email}</p>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2.5 rounded-xl text-xs bg-hub-gold/15 text-hub-gold border border-hub-gold/30 font-bold"
                  >
                    Member Dashboard &amp; Wallet
                  </Link>
                  {user.role === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2.5 rounded-xl text-xs bg-red-950/60 text-red-400 font-semibold border border-red-800/40"
                    >
                      Admin Control Panel
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-950/20"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center py-2.5 rounded-xl text-xs font-semibold bg-white/[0.05] border border-white/[0.1] text-white hover:bg-white/[0.1]"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-gold-glow"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Global Search Command Palette */}
      <GlobalSearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
    </>
  );
}
