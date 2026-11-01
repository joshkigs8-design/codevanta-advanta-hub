import React from "react";
import Link from "next/link";
import BrandLogo from "./BrandLogo";
import { ShieldCheck, Heart, MessageCircle, ExternalLink, ArrowRight, BriefcaseBusiness } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/[0.08] bg-hub-base/90 pt-16 pb-12 mt-24 text-hub-text-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-white/[0.08]">
          {/* Brand & Purpose (2 cols) */}
          <div className="md:col-span-2 space-y-4">
            <BrandLogo size="md" />
            <p className="text-xs sm:text-sm text-hub-text-secondary leading-relaxed max-w-sm">
              CodeVanta Advanta Hub connects developers and students across Kenya and the world with verified free cloud APIs,
              AI models, generous database quotas, student perks, and production blueprints.
            </p>
            <div className="flex items-center gap-2 text-xs text-hub-text-muted">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Zero-card traps &amp; independently audited free tier quotas</span>
            </div>

            {/* Official WhatsApp Channel Badge */}
            <div className="pt-2">
              <a
                href="https://whatsapp.com/channel/0029Vb84p6QKGGGNAp8VIB2g"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-950/70 hover:bg-emerald-900/90 border border-emerald-500/40 text-emerald-300 hover:text-white transition-all shadow-md group"
              >
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </div>
                <span>Join Official WhatsApp Channel</span>
                <ExternalLink className="w-3 h-3 opacity-70 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
            <a
              href="https://www.joshkigen.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-hub-text-muted hover:text-hub-gold transition-colors"
            >
              <BriefcaseBusiness className="w-3.5 h-3.5" />
              <span>Visit Josh Kigen&apos;s Portfolio</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Col 2: Discovery */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-hub-gold font-bold">Discovery</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/directory" className="hover:text-white transition-colors">
                  Developer Directory (55+ APIs)
                </Link>
              </li>
              <li>
                <Link href="/tutorials" className="hover:text-white transition-colors">
                  Tutorials &amp; Setup Guides
                </Link>
              </li>
              <li>
                <Link href="/learning-paths" className="hover:text-white transition-colors">
                  Learning Roadmaps
                </Link>
              </li>
              <li>
                <Link href="/projects" className="hover:text-white transition-colors">
                  Guided Production Lab
                </Link>
              </li>
              <li>
                <Link href="/troubleshooting" className="hover:text-white transition-colors">
                  Troubleshooting Centre
                </Link>
              </li>
              <li>
                <Link href="/students" className="hover:text-white transition-colors">
                  Student Cloud Perks
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Tools & Downloader */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-hub-gold font-bold">Tools &amp; Streaming</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/downloader-codes" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <span>Downloader Short Codes</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-950 text-amber-300 font-mono">Popular</span>
                </Link>
              </li>
              <li>
                <Link href="/guides" className="hover:text-white transition-colors">
                  Starter Kits &amp; Blueprints
                </Link>
              </li>
              <li>
                <Link href="/plans" className="hover:text-white transition-colors">
                  Membership Plans (from KES 70)
                </Link>
              </li>
              <li>
                <Link href="/referral-rules" className="hover:text-white transition-colors">
                  2-Tier Referral Compensation
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Platform & Compliance */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-hub-gold font-bold">Compliance &amp; Trust</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/compliance" className="hover:text-white transition-colors">
                  Legal Compliance Statement
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-white transition-colors">
                  Refund &amp; Cancellation Policy
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="hover:text-white transition-colors font-mono text-[11px] text-hub-text-muted">
                  Administrative Portal
                </Link>
              </li>
              <li>
                <a
                  href="https://www.joshkigen.me/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors inline-flex items-center gap-1.5"
                >
                  Personal Portfolio
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-hub-text-muted">
          <p>© {new Date().getFullYear()} CodeVanta Advanta Hub. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="inline-flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Safaricom Daraja &amp; Paystack Active
            </span>
            <span>•</span>
            <span>Nairobi, Kenya &amp; Global Edge</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
