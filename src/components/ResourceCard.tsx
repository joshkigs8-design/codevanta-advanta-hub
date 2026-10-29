"use client";

import React, { useState } from "react";
import Link from "next/link";
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
  Lock,
} from "lucide-react";

interface ResourceCardProps {
  resource: Resource & { is_locked?: boolean; lock_reason?: string };
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

  const isLocked = Boolean(resource.is_locked);

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLocked) return;
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

  const domain = resource.official_website ? getDomain(resource.official_website) : "codevanta.com";
  const imageUrl = resource.image_url || getResourceImage(resource);
  const logoUrl = resource.logo_url || getResourceLogo(resource);

  return (
    <article
      onClick={() => onSelect && onSelect(resource)}
      className={`group relative flex flex-col justify-between rounded-2xl bg-hub-surface-card/90 border transition-all duration-200 cursor-pointer overflow-hidden ${
        isLocked
          ? "border-white/10 hover:border-amber-500/40"
          : "border-white/10 hover:border-hub-gold/55 hover:-translate-y-1 hover:shadow-card-subtle"
      }`}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-hub-gold/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-20" />

      {/* Website Picture Preview Header */}
      <div className="relative w-full h-44 overflow-hidden bg-hub-surface-elevated">
        <img
          src={imageUrl}
          alt={resource.name}
          className={`w-full h-full object-cover transition-transform duration-500 ease-out ${
            isLocked ? "filter blur-sm brightness-75 scale-105" : "group-hover:scale-105"
          }`}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-hub-surface-card via-hub-surface-card/35 to-black/50" />

        {/* Lock Overlay on Image */}
        {isLocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs p-4 text-center z-10">
            <div className="w-9 h-9 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-400 flex items-center justify-center mb-1.5 shadow-lg">
              <Lock className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-mono uppercase font-bold text-amber-400 tracking-wider">
              Member Exclusive
            </span>
            <span className="text-[10px] text-hub-text-muted mt-0.5 line-clamp-1 max-w-[200px]">
              Sign in to unlock full quota details
            </span>
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
          <PricingBadge pricing={resource.pricing_classification} />
          {!isLocked && (
            <button
              onClick={handleBookmark}
              disabled={loadingBookmark}
              className={`p-1.5 rounded-full backdrop-blur-md transition-colors ${
                bookmarked
                  ? "bg-hub-gold text-white"
                  : "bg-black/50 text-white/80 hover:text-white hover:bg-black/75"
              }`}
              title={bookmarked ? "Remove bookmark" : "Bookmark resource"}
            >
              <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? "fill-current" : ""}`} />
            </button>
          )}
        </div>

        {/* Bottom Bar on Header */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            {!logoFailed && logoUrl ? (
              <img
                src={logoUrl}
                alt={`${resource.name} logo`}
                className="w-5 h-5 rounded object-contain bg-white/10 p-0.5 backdrop-blur-sm"
                onError={() => setLogoFailed(true)}
              />
            ) : null}
            <span className="text-xs font-mono text-white/90 drop-shadow">{domain}</span>
          </div>
          <VerificationBadge status={resource.verification_status} />
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-5 flex flex-col justify-between flex-1">
        <div>
          {/* Title & Category */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg tracking-tight text-hub-text-primary group-hover:text-hub-gold transition-colors leading-snug">
              {resource.name}
            </h3>
            {isLocked && <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-1" />}
          </div>

          <p className="text-xs text-hub-text-secondary mt-2 line-clamp-2 leading-relaxed">
            {resource.short_description}
          </p>

          {/* Free Tier Highlight Box */}
          {resource.free_tier_details && (
            <div
              className={`mt-3 p-2.5 rounded-lg border text-xs ${
                isLocked
                  ? "bg-amber-950/25 border-amber-500/30 text-amber-300/90"
                  : "bg-hub-surface border-hub-border-subtle text-hub-text-secondary"
              }`}
            >
              <span className={`font-semibold block mb-0.5 ${isLocked ? "text-amber-400" : "text-hub-gold"}`}>
                {isLocked ? "Access Status:" : "Free Tier:"}
              </span>
              <p className="line-clamp-2">{resource.free_tier_details}</p>
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
              {isLocked ? (
                <Link
                  href="/login"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 shadow-md transition-all active:scale-95"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Sign In to Access</span>
                </Link>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
