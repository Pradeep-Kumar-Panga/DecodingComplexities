import Link from "next/link";
import { SECTIONS } from "@/lib/sections";
import { formatDate, getPostsBySection } from "@/lib/posts";

export function SectionCards() {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {SECTIONS.map((s) => {
        const posts = getPostsBySection(s);
        return (
          <Link
            key={s.slug}
            href={`/${s.slug}`}
            className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-baseline justify-between">
              <h3 className="text-lg font-bold group-hover:text-brand-700 dark:group-hover:text-brand-300">{s.name}</h3>
              <span className="text-sm text-slate-500">{posts.length} posts</span>
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{s.description}</p>
            <ul className="mt-4 space-y-1.5 text-sm">
              {posts.slice(0, 3).map((p) => (
                <li key={p.id} className="flex gap-2 text-slate-700 dark:text-slate-300">
                  <span className="shrink-0 text-slate-400">{formatDate(p.published, "short")}</span>
                  <span className="line-clamp-1">{p.title}</span>
                </li>
              ))}
            </ul>
            <span className="mt-4 inline-block text-sm font-semibold text-brand-700 dark:text-brand-300">Explore {s.short} →</span>
          </Link>
        );
      })}
    </div>
  );
}
