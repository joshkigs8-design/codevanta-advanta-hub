import React from "react";
import { PricingClassification, VerificationStatus, SkillLevel } from "@/types";

export function PricingBadge({
  pricing,
  classification,
}: {
  pricing?: PricingClassification;
  classification?: PricingClassification;
}) {
  const resolved = pricing || classification;
  switch (resolved) {
    case "free_and_open_source":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Open Source
        </span>
      );
    case "free_hosted_service":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-teal-950/70 text-teal-300 border border-teal-500/40 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
          Free Service
        </span>
      );
    case "freemium":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-amber-950/70 text-amber-300 border border-amber-500/40 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          Freemium
        </span>
      );
    case "limited_trial":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-blue-950/70 text-blue-300 border border-blue-500/40 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          Free Trial
        </span>
      );
    case "paid":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-zinc-900 text-zinc-400 border border-zinc-700">
          Paid
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-zinc-900 text-zinc-500 border border-zinc-800">
          Unverified
        </span>
      );
  }
}

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  switch (status) {
    case "verified":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Verified Active
        </span>
      );
    case "stale":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-red-950/60 text-red-400 border border-red-500/40">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
          Needs Audit
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-zinc-900 text-zinc-400 border border-zinc-700">
          Pending
        </span>
      );
  }
}

export function SkillBadge({ level }: { level: SkillLevel }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider bg-white/[0.05] text-hub-text-secondary border border-white/[0.08]">
      {level.replace(/_/g, " ")}
    </span>
  );
}
