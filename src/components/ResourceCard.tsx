"use client";

import React, { useState } from "react";
import { Resource } from "@/types";
import { PricingBadge, VerificationBadge, SkillBadge } from "./Badge";
import {
  ExternalLink,
  BookOpen,
  Bookmark,
  CheckCircle2,
  XCircle,
  Key,
  CreditCard,
  UserCheck,
} from "lucide-react";

interface ResourceCardProps {
  resource: Resource;
  isBookmarked?: boolean;
  onBookmarkToggle?: (resourceId: string) => void;
  onSelect?: (resource: Resource) => void;
}

export default function ResourceCard({
  resource,
  isBookmarked = false,
  onBookmarkToggle,
  onSelect,
}: ResourceCardProps) {
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [loadingBookmark, setLoadingBookmark] = useState(false);

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingBookmark(true);
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resource_id: resource.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setBookmarked(data.bookmarked);
        if (onBookmarkToggle) onBookmarkToggle(resource.id);
      } else {
        alert(data.error || "Failed to update bookmark");
      }
    } catch {
      alert("Error saving bookmark");
    } finally {
      setLoadingBookmark(false);
    }
  };

  return (
    <article
      onClick={() => onSelect && onSelect(resource)}
      className="group relative flex flex-col justify-between p-5 rounded-xl bg-hub-surface-card border border-hub-border hover:border-hub-gold/50 hover:shadow-card-subtle transition-all duration-200 cursor-pointer"
    >
      <div>
        {/* Top Badges & Bookmark */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <PricingBadge pricing={resource.pricing_classification} />
            <VerificationBadge status={resource.verification_status} />
          </div>

          <button
            type="button"
            onClick={handleBookmark}
            disabled={loadingBookmark}
            className={`p-1.5 rounded-lg border transition-colors ${
              bookmarked
                ? "bg-hub-gold/20 text-hub-gold border-hub-gold/40"
                : "bg-hub-surface text-hub-text-muted hover:text-hub-text-primary border-hub-border"
            }`}
            title={bookmarked ? "Remove bookmark" : "Save bookmark"}
            aria-label="Bookmark resource"
          >
            <Bookmark className={`w-4 h-4 ${bookmarked ? "fill-hub-gold" : ""}`} />
          </button>
        </div>

        {/* Title & Category */}
        <h3 className="font-bold text-base text-hub-text-primary group-hover:text-hub-gold transition-colors leading-snug">
          {resource.name}
        </h3>

        <p className="text-xs text-hub-text-secondary mt-2 line-clamp-2 leading-relaxed">
          {resource.short_description}
        </p>

        {/* Free Tier Highlight Box */}
        {resource.free_tier_details && (
          <div className="mt-3 p-2.5 rounded-lg bg-hub-surface border border-hub-border-subtle text-xs text-hub-text-secondary">
            <span className="font-semibold text-hub-gold block mb-0.5">Free Tier:</span>
            <p className="line-clamp-2 text-hub-text-secondary">{resource.free_tier_details}</p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-hub-border/60">
        {/* Requirements Pills */}
        <div className="flex items-center gap-3 text-[11px] text-hub-text-muted mb-3 flex-wrap">
          <div className="flex items-center gap-1">
            <CreditCard className="w-3.5 h-3.5" />
            <span>{resource.credit_card_required ? "Card Req." : "No Card"}</span>
          </div>

          <div className="flex items-center gap-1">
            <Key className="w-3.5 h-3.5" />
            <span>{resource.api_key_required ? "API Key" : "No Key"}</span>
          </div>

          <div className="flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5" />
            <span>{resource.account_required ? "Account" : "No Login"}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-2">
          <SkillBadge level={resource.skill_level} />

          <div className="flex items-center gap-2">
            {resource.documentation_url && (
              <a
                href={resource.documentation_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs text-hub-text-secondary hover:text-hub-text-primary bg-hub-surface hover:bg-hub-surface-elevated border border-hub-border"
                title="View documentation"
              >
                <BookOpen className="w-3 h-3" />
                Docs
              </a>
            )}

            <a
              href={resource.official_website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-hub-forest-dark bg-hub-gold hover:bg-hub-gold-hover"
              title="Visit official website"
            >
              <span>Visit</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
