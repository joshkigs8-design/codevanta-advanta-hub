"use client";

import React, { useState } from "react";
import { Resource } from "@/types";
import { PricingBadge, VerificationBadge, SkillBadge } from "./Badge";
import { getResourceImage, getResourceLogo, getDomain } from "@/lib/resourceImages";
import {
  ExternalLink,
  BookOpen,
  Bookmark,
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
  const [logoFailed, setLogoFailed] = useState(false);

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

  const domain = getDomain(resource.official_website);
  const imageUrl = resource.image_url || getResourceImage(resource);
  const logoUrl = resource.logo_url || getResourceLogo(resource);

  return (
    <article
      onClick={() => onSelect && onSelect(resource)}
      className="group relative flex flex-col justify-between rounded-2xl bg-hub-surface-card/90 border border-white/10 hover:border-hub-gold/55 hover:-translate-y-1 hover:shadow-card-subtle transition-all duration-200 cursor-pointer overflow-hidden"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-hub-gold/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-20" />

      {/* Website Picture Preview Header */}
      <div className="relative w-full h-44 overflow-hidden bg-hub-surface-elevated">
        <img
          src={imageUrl}
          alt={resource.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-hub-surface-card via-hub-surface-card/35 to-black/50" />

        {/* Top Badges & Bookmark */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 z-10">
          <div className="flex items-center gap-1.5 flex-wrap">
            <PricingBadge pricing={resource.pricing_classification} />
            <VerificationBadge status={resource.verification_status} />
          </div>

          <button
            type="button"
            onClick={handleBookmark}
            disabled={loadingBookmark}
            className={`p-1.5 rounded-lg border backdrop-blur-md transition-colors ${
              bookmarked
                ? "bg-hub-gold/25 text-hub-gold border-hub-gold/50 shadow-md"
                : "bg-black/55 text-white/80 hover:text-white border-white/15 hover:bg-black/80"
            }`}
            title={bookmarked ? "Remove bookmark" : "Save bookmark"}
            aria-label="Bookmark resource"
          >
            <Bookmark className={`w-4 h-4 ${bookmarked ? "fill-hub-gold" : ""}`} />
          </button>
        </div>

        {/* Website Logo & Domain Tag */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2 z-10">
          {!logoFailed && logoUrl && (
            <div className="w-8 h-8 rounded-lg bg-hub-surface-card/95 border border-white/20 p-1 flex items-center justify-center shadow-lg backdrop-blur-md overflow-hidden shrink-0">
              <img
                src={logoUrl}
                alt=""
                className="w-5 h-5 object-contain"
                onError={() => setLogoFailed(true)}
              />
            </div>
          )}
          {domain && (
            <span className="text-[11px] font-mono text-white/90 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10">
              {domain}
            </span>
          )}
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-5 flex flex-col justify-between flex-1">
        <div>
          {/* Title & Category */}
          <h3 className="font-semibold text-lg tracking-tight text-hub-text-primary group-hover:text-hub-gold transition-colors leading-snug">
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
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-hub-bg bg-hub-gold hover:bg-hub-gold-hover"
                title="Visit official website"
              >
                <span>Visit</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
