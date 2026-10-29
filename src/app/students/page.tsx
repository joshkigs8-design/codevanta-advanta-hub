"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { StudentBenefit } from "@/types";
import {
  GraduationCap,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookOpen,
  Loader2,
} from "lucide-react";

export default function StudentsPage() {
  const [benefits, setBenefits] = useState<StudentBenefit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/students")
      .then((res) => res.json())
      .then((data) => setBenefits(data.benefits || []))
      .catch(() => setBenefits([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="space-y-4 border-b border-white/10 pb-8">
        <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-hub-gold font-bold bg-black/40 px-3 py-1.5 rounded-full border border-white/10 shadow-md">
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Verified Student Opportunities</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Student Developer Benefits &amp; Free Cloud Packs
        </h1>
        <p className="text-sm sm:text-base text-hub-text-secondary max-w-2xl leading-relaxed">
          Independently verified student developer programs, educational licenses, and free cloud compute credits.
          Learn to code with professional-grade software without spending a shilling.
        </p>

        {/* Verification Alert */}
        <div className="p-4 rounded-xl bg-hub-surface border border-hub-border max-w-3xl flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-hub-text-secondary">
            <span className="font-bold text-white block">Confirmed Eligibility Guidelines:</span>
            <p>
              Most programs require a verifiable university/college email address (e.g. <span className="font-mono text-hub-gold">@uonbi.ac.ke</span>, <span className="font-mono text-hub-gold">@ku.ac.ke</span>, <span className="font-mono text-hub-gold">@strathmore.edu</span>, or international <span className="font-mono text-hub-gold">.edu</span>) or a dated student identity card.
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Student Benefits */}
      {loading ? (
        <div className="py-20 text-center text-hub-gold flex items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading verified student benefits...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit) => (
            <div
              key={benefit.id}
              className="group relative flex flex-col justify-between rounded-2xl bg-hub-surface-card border border-white/10 hover:border-hub-gold/50 transition-all p-6 shadow-md hover:-translate-y-1 hover:shadow-card-subtle"
            >
              <div className="space-y-4">
                {/* Provider and Category Header */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono uppercase text-hub-gold font-bold px-2.5 py-1 rounded-md bg-hub-surface border border-hub-border">
                    {benefit.provider}
                  </span>
                  <span className="text-[11px] font-mono text-hub-text-muted">
                    {benefit.category}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-hub-gold transition-colors leading-snug">
                    {benefit.title}
                  </h3>
                  <p className="text-xs text-hub-text-secondary mt-2 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>

                {/* Benefits Included Pill Box */}
                <div className="p-3 rounded-xl bg-hub-surface border border-white/5 space-y-1.5">
                  <span className="text-[11px] font-mono uppercase font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3" />
                    What You Get:
                  </span>
                  <p className="text-xs text-white/90 leading-relaxed">
                    {benefit.benefits_included}
                  </p>
                </div>

                {/* Eligibility Requirements */}
                <div className="space-y-1 text-xs text-hub-text-secondary">
                  <span className="text-[11px] font-mono uppercase text-hub-text-muted font-bold block">
                    Eligibility Requirement:
                  </span>
                  <p className="leading-relaxed">{benefit.eligibility_requirements}</p>
                </div>

                {/* Limitations */}
                {benefit.limitations && (
                  <div className="flex items-start gap-1.5 text-[11px] text-amber-300/80">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                    <span>{benefit.limitations}</span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Verified {benefit.last_verified_date}
                </span>

                <a
                  href={benefit.application_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-hub-gold text-white hover:bg-hub-gold-hover shadow-md transition-all active:scale-95"
                >
                  <span>Apply Now</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

