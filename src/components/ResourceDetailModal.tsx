"use client";

import React, { useState } from "react";
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
} from "lucide-react";

interface ResourceDetailModalProps {
  resource: Resource | null;
  onClose: () => void;
}

export default function ResourceDetailModal({ resource, onClose }: ResourceDetailModalProps) {
  const [logoFailed, setLogoFailed] = useState(false);

  if (!resource) return null;

  const domain = getDomain(resource.official_website);
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
            className="w-full h-full object-cover"
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

          {/* Website Logo & Domain Pill */}
          <div className="absolute bottom-4 left-6 flex items-center gap-3 z-10">
            {!logoFailed && logoUrl && (
              <div className="w-12 h-12 rounded-xl bg-hub-surface-elevated/95 border border-white/20 p-2 flex items-center justify-center shadow-xl backdrop-blur-md shrink-0">
                <img
                  src={logoUrl}
                  alt=""
                  className="w-8 h-8 object-contain"
                  onError={() => setLogoFailed(true)}
                />
              </div>
            )}
            <div>
              {domain && (
                <span className="text-xs font-mono text-white/90 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 block w-fit">
                  {domain}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 pt-2">
          {/* Header Info */}
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2.5">
              <PricingBadge pricing={resource.pricing_classification} />
              <VerificationBadge status={resource.verification_status} />
              <SkillBadge level={resource.skill_level} />
            </div>

            <h2 id="modal-title" className="text-2xl font-bold text-white tracking-tight">
              {resource.name}
            </h2>

            <p className="text-sm text-hub-gold mt-1 font-mono">
              Category: {resource.category_name || "Developer Tool"}
            </p>
          </div>

          {/* Detailed Description */}
          <div className="mt-6 space-y-4 text-sm text-hub-text-secondary leading-relaxed">
            <p>{resource.detailed_description || resource.short_description}</p>

            {/* Free Tier Details Box */}
            <div className="p-4 rounded-xl bg-hub-surface border border-hub-gold/25 space-y-2">
              <h4 className="text-xs font-mono uppercase tracking-wider text-hub-gold font-bold">
                Verified Free Tier &amp; Quotas
              </h4>
              <p className="text-hub-text-primary">{resource.free_tier_details || "No explicit limits published."}</p>
              {resource.usage_limits && (
                <p className="text-xs text-hub-text-muted pt-1 border-t border-hub-border">
                  <span className="font-semibold text-hub-text-secondary">Rate Limits:</span> {resource.usage_limits}
                </p>
              )}
            </div>

            {/* Verification Audit Note */}
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-hub-bg border border-hub-border text-xs text-hub-text-muted">
              <Calendar className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-hub-text-secondary">Editorial Verification: </span>
                Last independently verified on <span className="text-emerald-400 font-mono">{resource.last_verification_date}</span>.
                {resource.editorial_notes && <p className="mt-1 text-hub-text-secondary">{resource.editorial_notes}</p>}
              </div>
            </div>

            {/* Requirements Grid */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-hub-surface border border-hub-border text-center">
                <CreditCard className="w-4 h-4 mx-auto mb-1 text-hub-gold" />
                <span className="text-[11px] block font-medium">Credit Card</span>
                <span className={`text-xs font-bold ${resource.credit_card_required ? "text-amber-400" : "text-emerald-400"}`}>
                  {resource.credit_card_required ? "Required" : "Not Required"}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-hub-surface border border-hub-border text-center">
                <Key className="w-4 h-4 mx-auto mb-1 text-hub-gold" />
                <span className="text-[11px] block font-medium">API Key</span>
                <span className={`text-xs font-bold ${resource.api_key_required ? "text-amber-400" : "text-emerald-400"}`}>
                  {resource.api_key_required ? "Required" : "Not Required"}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-hub-surface border border-hub-border text-center">
                <UserCheck className="w-4 h-4 mx-auto mb-1 text-hub-gold" />
                <span className="text-[11px] block font-medium">Account</span>
                <span className={`text-xs font-bold ${resource.account_required ? "text-amber-400" : "text-emerald-400"}`}>
                  {resource.account_required ? "Required" : "No Login Req."}
                </span>
              </div>
            </div>

            {/* Technical Metadata (Platforms, Languages, Alternatives) */}
            <div className="pt-2 space-y-3">
              {resource.programming_languages && resource.programming_languages.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <div className="flex items-center gap-1 text-hub-text-muted">
                    <Code className="w-3.5 h-3.5" />
                    <span>Languages:</span>
                  </div>
                  {resource.programming_languages.map((lang) => (
                    <span key={lang} className="px-2 py-0.5 rounded bg-hub-surface border border-hub-border font-mono text-hub-text-secondary">
                      {lang}
                    </span>
                  ))}
                </div>
              )}

              {resource.platforms && resource.platforms.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <div className="flex items-center gap-1 text-hub-text-muted">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Platforms:</span>
                  </div>
                  {resource.platforms.map((plat) => (
                    <span key={plat} className="px-2 py-0.5 rounded bg-hub-surface border border-hub-border font-mono text-hub-text-secondary">
                      {plat}
                    </span>
                  ))}
                </div>
              )}

              {resource.alternatives && resource.alternatives.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
                  <span className="text-hub-text-muted">Common Alternatives:</span>
                  {resource.alternatives.map((alt) => (
                    <span key={alt} className="px-2 py-0.5 rounded bg-hub-surface-card border border-hub-border-subtle text-hub-text-secondary">
                      {alt}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Commercial use notice */}
            <div className="p-3 rounded-lg bg-hub-surface border border-hub-border text-xs flex items-center justify-between">
              <span className="text-hub-text-muted">Commercial Use Allowed:</span>
              <span className={`font-semibold ${resource.commercial_use_allowed ? "text-emerald-400" : "text-amber-400"}`}>
                {resource.commercial_use_allowed ? "Yes (Permitted in free tier)" : "No / Restricted to non-commercial"}
              </span>
            </div>
          </div>

          {/* Action Footer */}
          <div className="mt-8 pt-4 border-t border-hub-border flex items-center justify-between gap-3">
            <div>
              {resource.documentation_url && (
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

            <a
              href={resource.official_website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-hub-bg bg-hub-gold hover:bg-hub-gold-hover shadow-gold-glow transition-all active:scale-95"
            >
              <span>Visit Official Website</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
