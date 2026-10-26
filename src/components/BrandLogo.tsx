import React from "react";
import Link from "next/link";

interface BrandLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function BrandLogo({ className = "", size = "md" }: BrandLogoProps) {
  const isSm = size === "sm";
  const isLg = size === "lg";

  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-3 group transition-transform active:scale-95 ${className}`}
      aria-label="Codevanta Advanta Hub Home"
    >
      {/* Precision Emblem Icon */}
      <div
        className={`relative rounded-xl bg-gradient-to-br from-white/10 via-white/5 to-transparent border border-white/15 p-1.5 flex items-center justify-center shadow-lg group-hover:border-hub-gold/50 transition-all ${
          isSm ? "w-8 h-8" : isLg ? "w-12 h-12" : "w-10 h-10"
        }`}
      >
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="logoRubyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff2a5f" />
              <stop offset="60%" stopColor="#c9003d" />
              <stop offset="100%" stopColor="#7a0024" />
            </linearGradient>
            <linearGradient id="logoTopFacet" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="logoLeftFacet" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3d495d" />
              <stop offset="100%" stopColor="#18202b" />
            </linearGradient>
          </defs>

          {/* 3D Monolithic Hexagonal Prism */}
          <path d="M32 10 L50 20 L32 30 L14 20 Z" fill="url(#logoTopFacet)" />
          <path d="M14 20 L32 30 V52 L14 42 Z" fill="url(#logoLeftFacet)" />
          <path d="M32 30 L50 20 V42 L32 52 Z" fill="url(#logoRubyGrad)" />
          <path d="M32 22 L42 27.5 L32 33 L22 27.5 Z" fill="#080a0f" opacity="0.9" />
          <circle cx="32" cy="27.5" r="2.5" fill="#ffffff" />
          <circle cx="32" cy="27.5" r="1.2" fill="#ff2a5f" />
        </svg>
      </div>

      {/* Typography: Architectural Uppercase with Signature Ruby Period */}
      <div className="flex flex-col">
        <div className="flex items-baseline tracking-tight">
          <span
            className={`font-black tracking-[-0.04em] text-white uppercase font-sans ${
              isSm ? "text-base" : isLg ? "text-2xl" : "text-xl"
            }`}
          >
            Codevanta
          </span>
          <span className="text-hub-gold font-black text-xl leading-none">.</span>
        </div>
        <span className="text-[9px] tracking-[0.28em] text-hub-text-muted uppercase font-mono -mt-0.5">
          Advanta Hub
        </span>
      </div>
    </Link>
  );
}
