"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

type Item = { id: string; path: string; title: string; published: string; labels: string[]; excerpt: string };

const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "Asia/Kolkata" });
const yearOf = (iso: string) => new Date(iso).toLocaleDateString("en-US", { year: "numeric", timeZone: "Asia/Kolkata" });

export function ArchiveList({ items, topics }: { items: Item[]; topics: string[] }) {
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [topic, setTopic] = useState(params.get("topic") ?? "");

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = items.filter(
      (p) =>
        (!topic || p.labels.includes(topic)) &&
        (!q || p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q)),
    );
    const byYear = new Map<string, Item[]>();
    for (const p of filtered) byYear.set(yearOf(p.published), [...(byYear.get(yearOf(p.published)) ?? []), p]);
    return { total: filtered.length, years: [...byYear.entries()] };
  }, [items, query, topic]);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search posts..."
          aria-label="Search posts"
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-900"
        />
        <select
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          aria-label="Filter by topic"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="">All topics</option>
          {topics.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">{groups.total} posts</p>

      {groups.years.map(([year, list]) => (
        <section key={year} className="mb-10">
          <h2 className="mb-3 border-b border-slate-200 pb-2 text-lg font-bold dark:border-slate-800">{year}</h2>
          <ul className="space-y-3">
            {list.map((p) => (
              <li key={p.id} className="flex gap-4">
                <span className="w-14 shrink-0 pt-0.5 text-sm text-slate-500 dark:text-slate-400">
                  {dateFmt.format(new Date(p.published))}
                </span>
                <div>
                  <Link href={p.path} className="font-medium hover:text-brand-700 dark:hover:text-brand-300">
                    {p.title}
                  </Link>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{p.labels.join(" · ")}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
