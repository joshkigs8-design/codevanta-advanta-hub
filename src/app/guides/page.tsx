"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpen, Clock, Search, ShieldCheck } from "lucide-react";

interface Tutorial {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  difficulty: string;
  estimated_minutes: number;
  last_verified_date?: string;
  featured?: boolean;
}

export default function GuidesPage() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (category) params.set("category", category);
      fetch(`/api/guides?${params}`)
        .then((response) => response.json())
        .then((data) => { setTutorials(data.guides || []); setCategories(data.categories || []); })
        .finally(() => setLoading(false));
    }, 180);
    return () => window.clearTimeout(timer);
  }, [query, category]);

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="space-y-3 border-b border-hub-border pb-7">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-hub-gold"><BookOpen size={16} /> Practical tutorials</div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">Learn by building.</h1>
        <p className="max-w-2xl text-sm leading-6 text-hub-text-secondary">Original, database-backed guides for local AI, coding tools, security, and deployment. Each guide links to the official documentation used for verification.</p>
      </header>
      <section className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1"><Search className="absolute left-3 top-3 text-hub-gold" size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tutorials..." className="w-full rounded-xl border border-hub-border bg-hub-surface px-10 py-3 text-sm text-white outline-none focus:border-hub-gold" /></div>
        <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-xl border border-hub-border bg-hub-surface px-4 py-3 text-sm text-white outline-none focus:border-hub-gold"><option value="">All categories</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select>
      </section>
      {loading ? <div className="admin-loading">Loading tutorials...</div> : (
        <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {tutorials.map((tutorial) => <Link key={tutorial.id} href={`/guides/${tutorial.slug}`} className="surface-panel group rounded-2xl p-6 hover:-translate-y-1 hover:border-hub-gold/50">
            <div className="mb-5 flex items-center justify-between"><span className="rounded-full border border-hub-gold/30 bg-hub-gold/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-hub-gold">{tutorial.category}</span>{tutorial.featured && <span className="text-xs text-hub-gold">Featured</span>}</div>
            <h2 className="text-xl font-bold leading-tight text-white group-hover:text-hub-gold">{tutorial.title}</h2>
            <p className="mt-3 text-sm leading-6 text-hub-text-secondary">{tutorial.summary}</p>
            <div className="mt-6 flex items-center gap-4 text-xs text-hub-text-muted"><span className="flex items-center gap-1"><Clock size={14} /> {tutorial.estimated_minutes} min</span><span className="capitalize">{tutorial.difficulty}</span>{tutorial.last_verified_date && <span className="ml-auto flex items-center gap-1"><ShieldCheck size={14} /> {tutorial.last_verified_date}</span>}</div>
          </Link>)}
        </section>
      )}
      {!loading && tutorials.length === 0 && <div className="admin-empty-state">No tutorials match those filters.</div>}
    </main>
  );
}
