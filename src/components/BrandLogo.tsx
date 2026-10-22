import React from "react";
import Link from "next/link";

export default function BrandLogo({ className = "h-8" }: { className?: string }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 group transition-transform active:scale-95">
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-hub-forest-light to-hub-surface border border-hub-gold-border flex items-center justify-center shadow-gold-glow group-hover:border-hub-gold transition-colors">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className="w-5 h-5 text-hub-gold group-hover:rotate-12 transition-transform duration-300"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
          <line x1="12" y1="2" x2="12" y2="22" stroke="currentColor" strokeDasharray="3 3" />
        </svg>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span className="font-bold text-base tracking-tight text-hub-text-primary">CodeVanta</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-hub-gold/15 text-hub-gold border border-hub-gold/30">
            Hub
          </span>
        </div>
        <span className="text-[10px] tracking-widest text-hub-text-muted uppercase font-mono mt-0.5">
          Advanta by CodeVanta Ventures
        </span>
      </div>
    </Link>
  );
}
