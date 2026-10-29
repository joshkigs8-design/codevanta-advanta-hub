import React from "react";
import Link from "next/link";
import BrandLogo from "./BrandLogo";
import { ShieldCheck, Heart, MessageCircle, ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-hub-border bg-hub-surface/80 pt-12 pb-8 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-hub-border">
          {/* Col 1: Brand & Purpose */}
          <div className="md:col-span-2 space-y-4">
            <BrandLogo />
            <p className="text-sm text-hub-text-secondary leading-relaxed max-w-md">
              CodeVanta Advanta Hub connects developers and students across Kenya and the world with verified free APIs,
              AI models, generous cloud hosting tiers, student perks, and production blueprints.
            </p>
            <div className="flex items-center gap-2 text-xs text-hub-text-muted">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Independent editorial curation &amp; verified free tier limits</span>
            </div>

            {/* Official WhatsApp Channel Badge */}
            <div className="pt-2">
              <a
                href="https://whatsapp.com/channel/0029Vb84p6QKGGGNAp8VIB2g"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-300 hover:text-white transition-all shadow-md group"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                </div>
                <span>Join Official WhatsApp Channel</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            </div>
          </div>

          {/* Col 2: Hub Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-hub-gold font-semibold">Discovery</h4>
            <ul className="space-y-2 text-sm text-hub-text-secondary">
              <li>
                <Link href="/directory" className="hover:text-hub-text-primary transition-colors">
                  Developer Resources
                </Link>
              </li>
              <li>
                <Link href="/tutorials" className="hover:text-hub-text-primary transition-colors">
                  Tutorials &amp; Setup Guides
                </Link>
              </li>
              <li>
                <Link href="/learning-paths" className="hover:text-hub-text-primary transition-colors">
                  Learning Paths
                </Link>
              </li>
              <li>
                <Link href="/projects" className="hover:text-hub-text-primary transition-colors">
                  Project Lab
                </Link>
              </li>
              <li>
                <Link href="/troubleshooting" className="hover:text-hub-text-primary transition-colors">
                  Troubleshooting Centre
                </Link>
              </li>
              <li>
                <Link href="/students" className="hover:text-hub-text-primary transition-colors">
                  Student Benefits
                </Link>
              </li>
              <li>
                <Link href="/guides" className="hover:text-hub-text-primary transition-colors">
                  Starter Kits
                </Link>
              </li>
              <li>
                <Link href="/plans" className="hover:text-hub-text-primary transition-colors">
                  Membership Plans
                </Link>
              </li>
              <li>
                <Link href="/downloader-codes" className="hover:text-hub-text-primary transition-colors">
                  Downloader Codes (Android TV)
                </Link>
              </li>
              <li>
                <a
                  href="https://whatsapp.com/channel/0029Vb84p6QKGGGNAp8VIB2g"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 text-emerald-400/90 font-medium inline-flex items-center gap-1 transition-colors"
                >
                  <span>WhatsApp Channel (Daily Drops)</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-hub-gold font-semibold">Legal</h4>
            <ul className="space-y-2 text-sm text-hub-text-secondary">
              <li>
                <Link href="/terms" className="hover:text-hub-text-primary transition-colors">
                  Terms and Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-hub-text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-hub-text-primary transition-colors">
                  Refund &amp; Cancellation Policy
                </Link>
              </li>
              <li>
                <Link href="/compliance" className="hover:text-hub-text-primary transition-colors">
                  Compliance &amp; Regulatory Notice
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-hub-text-muted">
          <p>
            &copy; {new Date().getFullYear()} CodeVanta Ventures. All rights reserved.
          </p>
          <p className="flex items-center gap-1.5">
            Engineered for African and global developers with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> in Nairobi, Kenya.
          </p>
        </div>
      </div>
    </footer>
  );
}
