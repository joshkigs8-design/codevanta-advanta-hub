"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Resource } from "@/types";
import { PricingBadge, VerificationBadge, SkillBadge } from "./Badge";
import { getResourceImage, getResourceLogo, getDomain } from "@/lib/resourceImages";
import {
  X,
  ExternalLink,
  BookOpen,
  Calendar,
  Layers,
  Code,
  ShieldAlert,
  CreditCard,
  Key,
  UserCheck,
  Lock,
  ArrowRight,
} from "lucide-react";

interface ResourceDetailModalProps {
  resource: (Resource & { is_locked?: boolean; lock_reason?: string }) | null;
  onClose: () => void;
}

export default function ResourceDetailModal({ resource, onClose }: ResourceDetailModalProps) {
  const [logoFailed, setLogoFailed] = useState(false);

  if (!resource) return null;

  const isLocked = Boolean(resource.is_locked);
  const domain = resource.official_website ? getDomain(resource.official_website) : "codevanta.com";
  const imageUrl = resource.image_url || getResourceImage(resource);
  const logoUrl = resource.logo_url || getResourceLogo(resource);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-hub-surface-elevated border border-hub-border shadow-2xl text-hub-text-primary"
      >
        {/* Website Picture Banner Header */}
        <div className="relative w-full h-48 sm:h-56 overflow-hidden bg-hub-surface">
          <img
            src={imageUrl}
            alt={resource.name}
            className={`w-full h-full object-cover ${isLocked ? "filter blur-sm brightness-75" : ""}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-hub-surface-elevated via-hub-surface-elevated/40 to-black/60" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-black/60 text-white/80 hover:text-white hover:bg-black/80 border border-white/15 backdrop-blur-md transition-colors z-20"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Metadata */}
          <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              {!logoFailed && logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`${resource.name} logo`}
                  className="w-10 h-10 rounded-xl object-contain bg-white/10 p-1.5 backdrop-blur-md border border-white/20"
                  onError={() => setLogoFailed(true)}
                />
              ) : null}
              <div>
                <h2 id="modal-title" className="text-xl sm:text-2xl font-bold text-white drop-shadow">
                  {resource.name}
                </h2>
                <span className="text-xs font-mono text-white/80">{domain}</span>
              </div>
            </div>
            <VerificationBadge status={resource.verification_status} />
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Locked Notice Banner */}
          {isLocked && (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-600/40 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Lock className="w-4 h-4" />
                <span>Member-Restricted Directory Entry</span>
              </div>
              <p className="text-xs text-hub-text-secondary">
                {resource.lock_reason ||
                  "Detailed architectural specifications, verification logs, and setup documentation are reserved for verified CodeVanta members."}
              </p>
              <div className="pt-1 flex gap-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-hub-gold text-white hover:bg-hub-gold-hover"
                >
                  <span>Sign In / Create Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/plans"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-hub-surface border border-hub-border hover:bg-hub-surface-elevated text-white"
                >
                  <span>View Membership Plans</span>
                </Link>
              </div>
            </div>
          )}

          {/* Category & Pricing Highlights */}
          <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-hub-border">
            <span className="text-xs font-mono uppercase tracking-wider text-hub-text-secondary bg-hub-surface px-3 py-1 rounded-full border border-hub-border">
              {resource.category_name}
            </span>
            <div className="flex items-center gap-2">
              <PricingBadge pricing={resource.pricing_classification} />
              <SkillBadge level={resource.skill_level} />
            </div>
          </div>

          {/* Descriptions */}
          <div className="space-y-3">
            <p className="text-sm text-hub-text-secondary font-medium leading-relaxed">
              {resource.short_description}
            </p>
            <p className="text-sm text-hub-text-muted leading-relaxed">
              {resource.detailed_description}
            </p>
          </div>

          {/* Free Tier Specifications */}
          {resource.free_tier_details && (
            <div className="p-4 rounded-xl bg-hub-surface border border-hub-border space-y-2">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-hub-gold">
                Verified Free Tier Allowance
              </h4>
              <p className="text-sm text-hub-text-primary leading-relaxed">
                {resource.free_tier_details}
              </p>
            </div>
          )}

          {/* Requirements & Specs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-hub-surface border border-hub-border flex items-center gap-2.5">
              <CreditCard className="w-4 h-4 text-hub-gold" />
              <div>
                <span className="text-[10px] text-hub-text-muted block">Credit Card</span>
                <span className="text-xs font-semibold text-hub-text-primary">
                  {resource.credit_card_required ? "Required" : "Not Required"}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-hub-surface border border-hub-border flex items-center gap-2.5">
              <Key className="w-4 h-4 text-hub-gold" />
              <div>
                <span className="text-[10px] text-hub-text-muted block">API Key</span>
                <span className="text-xs font-semibold text-hub-text-primary">
                  {resource.api_key_required ? "API Key Needed" : "Open Access / None"}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-hub-surface border border-hub-border flex items-center gap-2.5">
              <UserCheck className="w-4 h-4 text-hub-gold" />
              <div>
                <span className="text-[10px] text-hub-text-muted block">Account Setup</span>
                <span className="text-xs font-semibold text-hub-text-primary">
                  {resource.account_required ? "Signup Required" : "Instant Access"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="mt-8 pt-4 border-t border-hub-border flex items-center justify-between gap-3">
            <div>
              {!isLocked && resource.documentation_url && (
                <a
                  href={resource.documentation_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-hub-text-secondary hover:text-white bg-hub-surface hover:bg-hub-surface-elevated border border-hub-border transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Read Official Docs</span>
                </a>
              )}
            </div>

            {isLocked ? (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-hub-gold hover:bg-hub-gold-hover shadow-gold-glow transition-all active:scale-95"
              >
                <Lock className="w-4 h-4" />
                <span>Unlock Full Access</span>
              </Link>
            ) : (
              <a
                href={resource.official_website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-hub-bg bg-hub-gold hover:bg-hub-gold-hover shadow-gold-glow transition-all active:scale-95"
              >
                <span>Visit Official Website</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
