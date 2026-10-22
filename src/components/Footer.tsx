import React from "react";
import Link from "next/link";
import BrandLogo from "./BrandLogo";
import { ShieldCheck, Heart } from "lucide-react";

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
              <span>Independent editorial curation & verified free tier limits</span>
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
                <Link href="/guides" className="hover:text-hub-text-primary transition-colors">
                  Learning Roadmaps
                </Link>
              </li>
              <li>
                <Link href="/plans" className="hover:text-hub-text-primary transition-colors">
                  Membership Plans
                </Link>
              </li>
              <li>
                <Link href="/directory?category=public-apis" className="hover:text-hub-text-primary transition-colors">
                  Free Developer APIs
                </Link>
              </li>
              <li>
                <Link href="/directory?category=ai-apis-models" className="hover:text-hub-text-primary transition-colors">
                  AI & LLM Providers
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal & Governance */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-hub-gold font-semibold">Governance & Terms</h4>
            <ul className="space-y-2 text-sm text-hub-text-secondary">
              <li>
                <Link href="/terms" className="hover:text-hub-text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-hub-text-primary transition-colors">
                  Privacy Policy (KDPA 2019)
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-hub-text-primary transition-colors">
                  Refund & Cancellation Policy
                </Link>
              </li>
              <li>
                <Link href="/compliance" className="hover:text-hub-text-primary transition-colors text-emerald-400 font-medium">
                  Referral Compliance Disclosure
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
