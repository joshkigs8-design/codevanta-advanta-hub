"use client";

import React from "react";
import { Resource } from "@/types";
import { PricingBadge, VerificationBadge, SkillBadge } from "./Badge";
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
  if (!resource) return null;

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
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-hub-surface-elevated border border-hub-border p-6 sm:p-8 shadow-2xl text-hub-text-primary"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg bg-hub-surface text-hub-text-muted hover:text-hub-text-primary hover:bg-hub-surface-card border border-hub-border transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="pr-10">
          <div className="flex items-center gap-2 flex-wrap mb-2">
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
              Verified Free Tier & Quotas
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
              <span className="text-xs font-bold text-hub-text-primary">
                {resource.api_key_required ? "Required" : "None"}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-hub-surface border border-hub-border text-center">
              <UserCheck className="w-4 h-4 mx-auto mb-1 text-hub-gold" />
              <span className="text-[11px] block font-medium">Account</span>
              <span className="text-xs font-bold text-hub-text-primary">
                {resource.account_required ? "Required" : "No Login"}
              </span>
            </div>
          </div>

          {/* Alternatives & Languages */}
          {(resource.alternatives?.length > 0 || resource.programming_languages?.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {resource.alternatives && resource.alternatives.length > 0 && (
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-hub-text-muted mb-1.5 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    Verified Alternatives
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {resource.alternatives.map((alt, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded text-xs bg-hub-surface border border-hub-border text-hub-text-secondary">
                        {alt}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {resource.programming_languages && resource.programming_languages.length > 0 && (
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-hub-text-muted mb-1.5 flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5" />
                    Languages & SDKs
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {resource.programming_languages.map((lang, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded text-xs bg-hub-surface border border-hub-border text-hub-text-secondary">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer CTAs */}
        <div className="mt-8 pt-4 border-t border-hub-border flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-hub-text-secondary hover:text-white transition-colors"
          >
            Dismiss
          </button>

          {resource.documentation_url && (
            <a
              href={resource.documentation_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-hub-surface hover:bg-hub-surface-elevated border border-hub-border text-hub-text-primary transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Documentation
            </a>
          )}

          <a
            href={resource.official_website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold bg-hub-gold hover:bg-hub-gold-hover text-hub-forest-dark shadow-gold-glow transition-all active:scale-95"
          >
            <span>Visit Provider</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
