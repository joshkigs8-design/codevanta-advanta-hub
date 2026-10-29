"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Tv, Copy, Check, ExternalLink, Download, Search, ShieldCheck } from "lucide-react";

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

export default function DownloaderClient() {
  const [search, setSearch] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredCodes = DOWNLOADER_CODES.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.code.includes(q) ||
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4 mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-hub-gold/10 border border-hub-gold/30 text-hub-gold text-xs font-mono">
          <Tv className="w-3.5 h-3.5" />
          <span>Android TV & Firestick Sideload Directory</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-hub-text-primary">
          AFTVnews <span className="text-hub-gold">Downloader Codes</span>
        </h1>
        <p className="text-sm sm:text-base text-hub-text-secondary max-w-2xl mx-auto">
          Short numerical download codes for the popular <strong>Downloader by AFTVnews</strong> app. 
          Enter any code on your Smart TV or Firestick to quickly download and install APKs and utility toolboxes.
        </p>

        {/* How-to banner */}
        <div className="bg-hub-surface border border-hub-border-subtle rounded-xl p-4 sm:p-5 text-left max-w-3xl mx-auto mt-6">
          <div className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wider text-hub-gold mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>How to use these codes on your TV</span>
          </div>
          <ol className="list-decimal list-inside text-xs sm:text-sm text-hub-text-secondary space-y-1.5">
            <li>Install and open the free <strong className="text-white">Downloader</strong> app on your Android TV or Firestick.</li>
            <li>In the URL / Search input box, type the <strong className="text-hub-gold font-mono">numerical code</strong> (e.g. <span className="font-mono text-white">250931</span>).</li>
            <li>Press <strong className="text-white">Go</strong>. The app redirects to the verified APK or repository mirror.</li>
          </ol>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md mx-auto mb-8">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-hub-text-muted" />
        <input
          type="text"
          placeholder="Search by code, app name, or keyword…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-hub-surface border border-hub-border text-sm text-hub-text-primary focus:outline-none focus:ring-2 focus:ring-hub-gold"
        />
      </div>

      {/* Grid of Codes */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCodes.map((item) => (
          <div
            key={item.code}
            className="rounded-xl border border-hub-border-subtle bg-hub-surface hover:border-hub-gold/40 transition-all p-5 flex flex-col justify-between group"
          >
            <div>
              {/* Top row: Code badge + Copy button */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xl sm:text-2xl font-extrabold text-hub-gold tracking-wider">
                    {item.code}
                  </span>
                  <button
                    onClick={() => handleCopy(item.code)}
                    className="p-1.5 rounded-md hover:bg-hub-surface-elevated text-hub-text-muted hover:text-white transition-colors"
                    title="Copy Downloader Code"
                  >
                    {copiedCode === item.code ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-hub-surface-elevated border border-hub-border text-hub-text-muted">
                  {item.category}
                </span>
              </div>

              {/* Name & description */}
              <h3 className="text-lg font-bold text-hub-text-primary group-hover:text-hub-gold transition-colors mb-1.5">
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
                    className="text-[10px] px-2 py-0.5 rounded-md bg-hub-surface-elevated text-hub-text-muted border border-hub-border/50"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-hub-border-subtle flex items-center justify-between text-xs">
              <span className="text-[11px] text-hub-text-muted truncate max-w-[180px]">
                {item.versionNote || "Verified link"}
              </span>
              <a
                href={`https://go.aftvnews.com/${item.code}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-hub-gold hover:text-hub-gold-hover font-medium"
              >
                <span>Direct Link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Back to Resources link */}
      <div className="text-center mt-12 pt-8 border-t border-hub-border-subtle">
        <Link
          href="/directory"
          className="inline-flex items-center gap-2 text-sm text-hub-text-secondary hover:text-white transition-colors"
        >
          <span>← Browse all Developer Resources & APIs</span>
        </Link>
      </div>
    </div>
  );
}

