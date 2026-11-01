"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Tv,
  Copy,
  Check,
  ExternalLink,
  Download,
  Search,
  ShieldCheck,
  Lock,
  ArrowRight,
  MessageCircle,
  Sparkles,
  Layers,
} from "lucide-react";

interface DownloaderCode {
  code: string;
  name: string;
  category: string;
  description: string;
  targetUrl: string;
  tags: string[];
  versionNote?: string;
}

const DOWNLOADER_CODES: DownloaderCode[] = [
  {
    code: "7987405",
    name: "Reezn APK (v2)",
    category: "Media & Streaming",
    description: "Third-party lightweight Android TV media player providing streaming links and curated entertainment collections.",
    targetUrl: "https://github.com/bedevlab/rdownload/releases/download/update/Reezn.apk",
    tags: ["Android TV", "Firestick", "Streaming", "APK Direct"],
    versionNote: "Direct APK download via GitHub Releases",
  },
  {
    code: "6985536",
    name: "SK TECH Store",
    category: "App Store & Utilities",
    description: "Popular Android TV utility hub and alternative installer for streaming apps, system tools, and video players.",
    targetUrl: "https://downloadsktech.pages.dev/download",
    tags: ["Cloudflare Pages", "App Store", "Tools", "Fire TV"],
    versionNote: "Hosted on Cloudflare Pages mirror",
  },
  {
    code: "1109875",
    name: "Nuvio TV Player",
    category: "Media & Streaming",
    description: "Clean open-source TV media interface with in-app automatic updater for high-performance video streaming on big screens.",
    targetUrl: "https://github.com/tapframe/NuvioTV/releases/download/0.4.18-beta/app-universal-release.apk",
    tags: ["Open Source", "Universal APK", "GitHub", "Smart TV"],
    versionNote: "v0.4.18-beta with built-in in-app updater",
  },
  {
    code: "250931",
    name: "TROYPOINT Toolbox",
    category: "Toolbox & App Directory",
    description: "The gold standard Fire TV and Android TV setup toolbox with one-click access to curated players, browsers, launchers, and VPN utilities.",
    targetUrl: "https://troypoint.com/troypoint-toolbox/",
    tags: ["Toolbox", "AIO Directory", "Essential", "Firestick"],
    versionNote: "Official TROYPOINT streaming hub",
  },
  {
    code: "990781",
    name: "DownloaderCodes Mega Toolbox",
    category: "Toolbox & App Directory",
    description: "Extensive community toolbox repository containing utility tools, custom launchers, ad-blockers, and maintenance apps for TV OS.",
    targetUrl: "https://downloadercodes.com/toolbox/",
    tags: ["Mega Directory", "Launchers", "Maintenance", "Tools"],
    versionNote: "Universal Android TV / Google TV repository",
  },
  {
    code: "285544",
    name: "Nebula Manager (Anker / ATV Channel)",
    category: "TV Launcher & App Manager",
    description: "Official Android TV channel shortcut tool developed for Android TV & projectors to manage sideloaded apps and home screen channel banners.",
    targetUrl: "https://nebula-manager.en.aptoide.com/?store_name=catappult&app_id=61078189",
    tags: ["App Manager", "Home Screen", "Aptoide", "Nebula/Anker"],
    versionNote: "Verified Aptoide App ID 61078189 (com.zhixin.atvchannel)",
  },
];

const CATEGORIES = [
  "All",
  "Media & Streaming",
  "App Store & Utilities",
  "Toolbox & App Directory",
  "TV Launcher & App Manager",
];

export default function DownloaderClient() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setIsAuthenticated(true);
          if (data.user.role === "member" || data.user.role === "admin") {
            setIsMember(true);
          }
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
        setIsMember(false);
      })
      .finally(() => setLoadingAuth(false));
  }, []);

  const handleCopy = (code: string, isLocked: boolean) => {
    if (isLocked) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredCodes = DOWNLOADER_CODES.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const q = search.toLowerCase();
    const matchesQuery =
      !search ||
      item.code.includes(q) ||
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.tags.some((t) => t.toLowerCase().includes(q));

    return matchesCategory && matchesQuery;
  });

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-10">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-950/60 border border-amber-500/30 text-amber-300 text-xs font-mono">
          <Tv className="w-3.5 h-3.5 text-amber-400" />
          <span>Android TV &amp; Firestick Sideload Directory</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
          AFTVnews <span className="shimmer-gold">Downloader Codes</span>
        </h1>
        <p className="text-sm sm:text-base text-hub-text-secondary max-w-2xl mx-auto leading-relaxed">
          Short numerical download codes for the official <strong>Downloader by AFTVnews</strong> app. 
          Enter any code on your Smart TV, Android Box, or Firestick to directly download and install APKs and utility toolboxes.
        </p>

        {/* How-to banner */}
        <div className="glass-panel rounded-2xl p-5 sm:p-6 text-left max-w-3xl mx-auto mt-6 shadow-2xl">
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-hub-gold mb-3 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>How to use these short codes in 3 steps</span>
          </div>
          <ol className="list-decimal list-inside text-xs sm:text-sm text-slate-300 space-y-2 leading-relaxed">
            <li>Install and open the free <strong className="text-white">Downloader</strong> app on your Android TV, Google TV, or Firestick.</li>
            <li>In the URL / Search input box, type the <strong className="text-hub-gold font-mono">short code</strong> (e.g. <span className="font-mono text-white bg-white/10 px-1.5 py-0.5 rounded">250931</span>).</li>
            <li>Press <strong className="text-white">Go</strong>. Downloader redirects immediately to the verified APK or repository mirror.</li>
          </ol>
        </div>

        {/* WhatsApp Channel Callout */}
        <div className="bg-gradient-to-r from-emerald-950/70 via-black/60 to-emerald-950/50 border border-emerald-500/40 rounded-2xl p-4 sm:p-5 text-left max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>CodeVanta WhatsApp Channel</span>
                <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">Official</span>
              </h4>
              <p className="text-xs text-hub-text-secondary mt-0.5">
                Receive new APK codes, TV utilities, and verified free tier drops directly on WhatsApp.
              </p>
            </div>
          </div>
          <a
            href="https://whatsapp.com/channel/0029Vb84p6QKGGGNAp8VIB2g"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black transition-all shadow-md shrink-0 active:scale-95"
          >
            <span>Follow Channel</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Paywall Banner for Non-Members / Guests */}
      {!loadingAuth && !isMember && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/70 via-black/80 to-amber-950/60 border border-amber-500/40 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-mono text-xs uppercase tracking-wider font-bold">
                <Lock className="w-3.5 h-3.5" />
                <span>{isAuthenticated ? "Membership Paywall" : "Guest Preview Mode"}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Unlock Complete Downloader &amp; Sideload Catalog
              </h3>
              <p className="text-xs sm:text-sm text-hub-text-secondary leading-relaxed">
                You are currently viewing 2 free sample codes. Upgrade to CodeVanta Starter (KES 70), Basic, Pro, or VIP to unlock all verified short codes, one-click direct APK mirrors, and GitHub release links.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <Link
                href="/plans"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black hover:from-amber-300 hover:to-yellow-400 shadow-gold-glow transition-all active:scale-95 uppercase tracking-wider"
              >
                <Lock className="w-4 h-4" />
                <span>Upgrade from KES 70</span>
              </Link>
              {!isAuthenticated && (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all active:scale-95"
                >
                  <span>Sign In</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-amber-400 text-black font-bold shadow-gold-glow"
                  : "bg-white/[0.04] text-hub-text-secondary hover:text-white hover:bg-white/[0.08] border border-white/[0.08]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-hub-text-muted" />
          <input
            type="text"
            placeholder="Search by code, app name, or keyword…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-hub-surface border border-white/[0.1] text-sm text-hub-text-primary focus:outline-none focus:border-hub-gold transition-colors font-mono placeholder:font-sans"
          />
        </div>
      </div>

      {/* Grid of Codes */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCodes.map((item, index) => {
          const isLocked = !isMember && index >= 2;
          const displayCode = isLocked ? `${item.code.slice(0, 3)}****` : item.code;

          return (
            <div
              key={item.code}
              className={`rounded-2xl border transition-all p-5 flex flex-col justify-between group relative overflow-hidden glass-card-interactive card-specular-edge ${
                isLocked
                  ? "border-amber-500/30"
                  : "border-white/[0.08] hover:border-hub-gold/50"
              }`}
            >
              <div>
                {/* Top row: Code badge + Copy button */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-2xl sm:text-3xl font-black tracking-wider ${
                      isLocked ? "text-amber-400/80" : "text-amber-400"
                    }`}>
                      {displayCode}
                    </span>
                    {!isLocked ? (
                      <button
                        onClick={() => handleCopy(item.code, isLocked)}
                        className={`p-2 rounded-xl transition-all ${
                          copiedCode === item.code
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-500/50"
                            : "bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white border border-white/[0.08]"
                        }`}
                        title="Copy Downloader Code"
                      >
                        {copiedCode === item.code ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    ) : (
                      <span className="p-2 rounded-xl bg-amber-950/50 text-amber-400 border border-amber-500/30" title="Locked for guests">
                        <Lock className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-hub-text-muted">
                    {item.category}
                  </span>
                </div>

                {/* Name & description */}
                <h3 className="text-base font-bold text-white group-hover:text-hub-gold transition-colors mb-1">
                  {item.name}
                </h3>
                <p className="text-xs text-hub-text-secondary leading-relaxed mb-4">
                  {item.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.04] text-hub-text-muted border border-white/[0.06]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs">
                <span className="text-[11px] text-hub-text-muted truncate max-w-[170px] font-mono">
                  {item.versionNote || "Verified link"}
                </span>

                {isLocked ? (
                  <Link
                    href={isAuthenticated ? "/plans" : "/login"}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-300 bg-amber-950/70 border border-amber-700/60 hover:bg-amber-900 transition-colors"
                  >
                    <Lock className="w-3 h-3" />
                    <span>{isAuthenticated ? "Upgrade" : "Sign In"}</span>
                  </Link>
                ) : (
                  <a
                    href={`https://go.aftvnews.com/${item.code}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-black bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 transition-all shadow-sm active:scale-95"
                  >
                    <span>Direct Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Back to Resources link */}
      <div className="text-center pt-8 border-t border-white/[0.08]">
        <Link
          href="/directory"
          className="inline-flex items-center gap-2 text-xs font-mono text-hub-text-secondary hover:text-white transition-colors"
        >
          <span>← Browse all Developer Resources &amp; APIs</span>
        </Link>
      </div>
    </div>
  );
}
