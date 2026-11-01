"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Resource } from "@/types";
import { PricingBadge, VerificationBadge, SkillBadge } from "./Badge";
import { getResourceImage, getResourceLogo, getDomain } from "@/lib/resourceImages";
import SafeImage from "./SafeImage";
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

  const domain = resource.official_website ? getDomain(resource.official_website) : "codevanta.online";
  const imageUrl = resource.image_url || getResourceImage(resource);
  const logoUrl = resource.logo_url || getResourceLogo(resource);

  return (
    <article
      onClick={() => onSelect && onSelect(resource)}
      className={`group relative flex flex-col justify-between rounded-2xl glass-card-interactive card-specular-edge cursor-pointer overflow-hidden ${
        isLocked
          ? "border-amber-500/30 hover:border-amber-400/50"
          : "border-white/[0.08] hover:border-hub-gold/50"
      }`}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-hub-gold/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-20" />

      {/* Website Picture Preview Header */}
      <div className="relative w-full h-44 overflow-hidden bg-black/40">
        <SafeImage
          src={imageUrl}
          fallbackSrc="/og-image.png"
          alt={resource.name}
          className={`w-full h-full object-cover transition-transform duration-500 ease-out ${
            isLocked ? "filter blur-sm brightness-75 scale-105" : "group-hover:scale-105"
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-hub-surface via-hub-surface/40 to-black/60" />

        {/* Lock Overlay on Image */}
        {isLocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/65 backdrop-blur-xs p-4 text-center z-10">
            <div className="w-10 h-10 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-400 flex items-center justify-center mb-1.5 shadow-lg">
              <Lock className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-mono uppercase font-bold text-amber-300 tracking-wider">
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
              className={`p-1.5 rounded-full backdrop-blur-md transition-all active:scale-90 ${
                bookmarked
                  ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-gold-glow"
                  : "bg-black/60 text-white/80 hover:text-white hover:bg-black/90 border border-white/10"
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
            {logoUrl ? (
              <SafeImage
                src={logoUrl}
                fallbackSrc="/icon.svg"
                alt={`${resource.name} logo`}
                className="w-5 h-5 rounded object-contain bg-white/10 p-0.5 backdrop-blur-sm"
              />
            ) : null}
            <span className="text-xs font-mono text-white/95 drop-shadow">{domain}</span>
          </div>
          <VerificationBadge status={resource.verification_status} />
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-5 flex flex-col justify-between flex-1">
        <div>
          {/* Title & Category */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-base tracking-tight text-white group-hover:text-hub-gold transition-colors leading-snug">
              {resource.name}
            </h3>
            {isLocked && <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
          </div>

          <p className="text-xs text-hub-text-secondary mt-1.5 line-clamp-2 leading-relaxed">
            {resource.short_description}
          </p>

          {/* Free Tier Highlight Box */}
          {resource.free_tier_details && (
            <div
              className={`mt-3 p-2.5 rounded-xl border text-xs leading-relaxed ${
                isLocked
                  ? "bg-amber-950/20 border-amber-500/25 text-amber-300/90"
                  : "bg-white/[0.03] border-white/[0.06] text-slate-300"
              }`}
            >
              <span className={`font-semibold block mb-0.5 text-[11px] font-mono ${isLocked ? "text-amber-400" : "text-hub-gold"}`}>
                {isLocked ? "ACCESS STATUS:" : "FREE TIER LIMITS:"}
              </span>
              <p className="line-clamp-2">{resource.free_tier_details}</p>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-white/[0.08]">
          {/* Requirements Pills */}
          <div className="flex items-center gap-3 text-[11px] text-hub-text-muted mb-3.5 flex-wrap">
            <div className={`flex items-center gap-1 font-mono ${!resource.credit_card_required ? "text-emerald-400" : ""}`}>
              <CreditCard className="w-3.5 h-3.5" />
              <span>{resource.credit_card_required ? "Card Req." : "No Card Req."}</span>
            </div>

            <div className="flex items-center gap-1 font-mono">
              <Key className="w-3.5 h-3.5" />
              <span>{resource.api_key_required ? "API Key" : "No Key"}</span>
            </div>

            <div className="flex items-center gap-1 font-mono">
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-amber-400 to-yellow-500 shadow-gold-glow hover:from-amber-300 hover:to-yellow-400 transition-all active:scale-95"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Sign In to Unlock</span>
                </Link>
              ) : (
                <>
                  {resource.documentation_url && (
                    <a
                      href={resource.documentation_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-hub-text-secondary hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-colors"
                      title="View documentation"
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>Docs</span>
                    </a>
                  )}

                  <a
                    href={resource.official_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-black bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 transition-all active:scale-95 shadow-sm"
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
