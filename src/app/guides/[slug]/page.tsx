"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Clock, Copy, ExternalLink, ListTree, ShieldCheck } from "lucide-react";

interface Tutorial { title: string; summary: string; category: string; difficulty: string; estimated_minutes: number; introduction: string; content: string; prerequisites: string[]; supported_operating_systems: string[]; steps: Array<{ title: string; instruction: string }>; references: Array<{ title: string; url: string }>; last_verified_date: string; }

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return <button onClick={() => { navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1200); }} className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-xs text-hub-text-muted hover:text-white">{copied ? <Check size={13} /> : <Copy size={13} />}{copied ? "Copied" : "Copy"}</button>;
}

export default function TutorialDetailPage({ params }: { params: { slug: string } }) {
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [related, setRelated] = useState<Array<{ slug: string; title: string }>>([]);
  useEffect(() => { fetch(`/api/guides/${params.slug}`).then((response) => response.json()).then((data) => { setTutorial(data.tutorial || null); setRelated(data.related || []); }); }, [params.slug]);
  const sections = useMemo(() => tutorial?.content.match(/^## .+$/gm)?.map((item) => item.replace(/^## /, "")) || [], [tutorial]);
  const codeBlocks = useMemo(() => Array.from(tutorial?.content.matchAll(/```(?:\w+)?\n([\s\S]*?)```/g) || []).map((match) => match[1].trim()), [tutorial]);
  if (!tutorial) return <main className="mx-auto max-w-4xl px-4 py-20 text-center text-hub-text-muted">Loading tutorial...</main>;
  return <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
    <Link href="/guides" className="mb-8 inline-flex items-center gap-2 text-sm text-hub-text-muted hover:text-white"><ArrowLeft size={16} /> All tutorials</Link>
    <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
      <article className="min-w-0">
        <div className="mb-8"><div className="mb-3 text-xs font-mono uppercase tracking-widest text-hub-gold">{tutorial.category} · {tutorial.difficulty}</div><h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">{tutorial.title}</h1><p className="mt-4 text-lg leading-8 text-hub-text-secondary">{tutorial.introduction || tutorial.summary}</p><div className="mt-5 flex flex-wrap gap-4 text-xs text-hub-text-muted"><span className="flex items-center gap-1"><Clock size={14} /> {tutorial.estimated_minutes} min</span><span className="flex items-center gap-1"><ShieldCheck size={14} /> Verified {tutorial.last_verified_date || "date not recorded"}</span></div></div>
        <div className="grid gap-4 rounded-2xl border border-hub-border bg-hub-surface p-5 sm:grid-cols-2"><div><h2 className="font-semibold text-white">You will need</h2><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-hub-text-secondary">{tutorial.prerequisites.map((item) => <li key={item}>{item}</li>)}</ul></div><div><h2 className="font-semibold text-white">Supported systems</h2><p className="mt-2 text-sm text-hub-text-secondary">{tutorial.supported_operating_systems.join(", ")}</p></div></div>
        {tutorial.steps.length > 0 && <section className="mt-8 space-y-6"><h2 className="flex items-center gap-2 text-2xl font-bold text-white"><ListTree size={20} className="text-hub-gold" /> Steps</h2>{tutorial.steps.map((step, index) => <div key={step.title} className="rounded-2xl border border-hub-border bg-hub-surface p-5"><div className="flex gap-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-hub-gold text-sm font-bold text-white">{index + 1}</span><div><h3 className="font-bold text-white">{step.title}</h3><p className="mt-2 whitespace-pre-line text-sm leading-7 text-hub-text-secondary">{step.instruction}</p></div></div></div>)}</section>}
        <section className="prose prose-invert mt-10 max-w-none"><div className="whitespace-pre-line text-sm leading-8 text-hub-text-secondary">{tutorial.content.replace(/```(?:\w+)?\n[\s\S]*?```/g, "")}</div>{codeBlocks.length > 0 && <div className="mt-6 space-y-3">{codeBlocks.map((code) => <div key={code} className="overflow-hidden rounded-xl border border-white/10 bg-black/40"><div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-[10px] uppercase tracking-wider text-hub-text-muted"><span>Code example</span><CopyButton value={code} /></div><pre className="overflow-x-auto p-4 text-xs leading-6 text-emerald-200"><code>{code}</code></pre></div>)}</div>}</section>
        <div className="mt-8 flex flex-wrap gap-3">{tutorial.references.map((reference) => <a key={reference.url} href={reference.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-hub-border px-3 py-2 text-xs text-hub-text-secondary hover:border-hub-gold hover:text-white">{reference.title}<ExternalLink size={13} /></a>)}</div>
      </article>
      <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start"><div className="rounded-2xl border border-hub-border bg-hub-surface p-5"><h2 className="font-semibold text-white">On this page</h2><ul className="mt-3 space-y-2 text-sm text-hub-text-muted">{sections.map((section) => <li key={section}>{section}</li>)}</ul></div>{related.length > 0 && <div className="rounded-2xl border border-hub-border bg-hub-surface p-5"><h2 className="font-semibold text-white">Related guides</h2><div className="mt-3 space-y-3">{related.map((item) => <Link key={item.slug} href={`/guides/${item.slug}`} className="block text-sm text-hub-text-secondary hover:text-hub-gold">{item.title}</Link>)}</div></div>}</aside>
    </div>
  </main>;
}
