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
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
          Open Source
        </span>
      );
    case "free_hosted_service":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-950/80 text-teal-300 border border-teal-800/60">
          Free Service
        </span>
      );
    case "freemium":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-950/80 text-amber-300 border border-amber-800/60">
          Freemium
        </span>
      );
    case "limited_trial":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-950/80 text-blue-300 border border-blue-800/60">
          Free Trial
        </span>
      );
    case "paid":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-900 text-zinc-400 border border-zinc-700">
          Paid
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-900 text-zinc-500 border border-zinc-800">
          Unverified
        </span>
      );
  }
}

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  switch (status) {
    case "verified":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950/50 text-emerald-400 border border-emerald-800/40">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Verified Active
        </span>
      );
    case "stale":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-red-950/50 text-red-400 border border-red-800/40">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
          Stale / Needs Audit
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-900 text-zinc-400 border border-zinc-700">
          Unverified
        </span>
      );
  }
}

export function SkillBadge({ level }: { level: SkillLevel }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase bg-hub-surface-elevated text-hub-text-secondary border border-hub-border">
      {level.replace("_", " ")}
    </span>
  );
}
