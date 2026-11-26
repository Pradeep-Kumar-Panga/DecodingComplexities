import Link from "next/link";
import { hubGroups, type Hub } from "@/lib/hubs";
import { getPopular } from "@/lib/popularity";
import { getSection } from "@/lib/sections";
import { hubPosts } from "@/lib/hubs";
import { slugify } from "@/lib/posts";

export function HubPage({ hub }: { hub: Hub }) {
  const groups = hubGroups(hub);
  const section = getSection(hub.section)!;
  const popular = new Set(getPopular(3, undefined, hubPosts(hub)).map((p) => p.id));

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/" className="hover:text-brand-700">Home</Link>
        <span className="mx-2">/</span>
        <Link href={`/${section.slug}`} className="hover:text-brand-700">{section.short}</Link>
      </nav>
      <h1 className="text-3xl font-bold tracking-tight">{hub.title}</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">{hub.description}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {groups.map((g) => (
          <a
            key={g.title}
            href={`#${slugify(g.title)}`}
            className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800 hover:bg-brand-100 dark:bg-brand-950 dark:text-brand-200 dark:hover:bg-brand-900"
          >
            {g.title} <span className="text-brand-400">{g.posts.length}</span>
          </a>
        ))}
      </div>

      {groups.map((g) => (
        <section key={g.title} id={slugify(g.title)} className="mt-10 scroll-mt-24">
          <h2 className="mb-3 border-b border-slate-200 pb-2 text-lg font-bold dark:border-slate-800">{g.title}</h2>
          <ul className="space-y-2">
            {g.posts.map((p) => (
              <li key={p.id}>
                <Link href={p.path} className="font-medium hover:text-brand-700 dark:hover:text-brand-300">
                  {p.title}
                </Link>
                {popular.has(p.id) && (
                  <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-800 dark:bg-brand-950 dark:text-brand-200">
                    Popular
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
