import Link from "next/link";
import type { Metadata } from "next";
import { getAllPosts, getTopics, formatDate } from "@/lib/posts";
import { getLatestPosts } from "@/lib/feed";
import { SITE } from "@/lib/site";
import { PostCard } from "@/components/PostCard";
import { PostCover } from "@/components/PostCover";
import { TopicChip } from "@/components/TopicChip";
import { SectionCards } from "@/components/SectionCards";
import { StartHere } from "@/components/StartHere";
import { PopularList } from "@/components/PopularList";
import { getStartCards } from "@/lib/start";
import { getPopular } from "@/lib/popularity";

export const metadata: Metadata = {
  alternates: { canonical: "/", types: { "application/rss+xml": "/feed.xml" } },
};

export default function Home() {
  const posts = getAllPosts();
  const [featured, ...rest] = getLatestPosts();
  const alsoNew = rest.slice(0, 4);
  const latest = rest.slice(4, 10);
  const topics = getTopics().slice(0, 10);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <section className="mb-10 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{SITE.tagline}</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400">{SITE.description}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/ml-and-math" className="rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
            Start with AI &amp; ML
          </Link>
          <Link
            href="/python"
            className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold hover:border-brand-400 dark:border-slate-700"
          >
            Learn Python
          </Link>
          <Link
            href="/ibm-i"
            className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold hover:border-brand-400 dark:border-slate-700"
          >
            IBM i library
          </Link>
        </div>
      </section>

      <section aria-labelledby="latest-heading" className="grid gap-6 lg:grid-cols-5">
        <Link
          href={featured.path}
          className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg lg:col-span-3 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="relative aspect-[16/9]">
            <PostCover post={featured} priority large />
          </div>
          <div className="space-y-3 p-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">
              <span id="latest-heading">Latest post</span>
              <span className="text-slate-400">·</span>
              <span className="font-normal normal-case text-slate-500 dark:text-slate-400">
                {formatDate(featured.published)} · {featured.readingMinutes} min read
              </span>
            </div>
            <h2 className="text-2xl font-bold leading-tight group-hover:text-brand-700 dark:group-hover:text-brand-300">
              {featured.title}
            </h2>
            <p className="text-slate-600 dark:text-slate-400">{featured.excerpt}</p>
            <span className="inline-block text-sm font-semibold text-brand-700 dark:text-brand-300">Read the post →</span>
          </div>
        </Link>

        <aside className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Also new</h2>
          <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
            {alsoNew.map((p) => (
              <li key={p.id}>
                <Link href={p.path} className="group block p-4">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(p.published, "short")} · {p.labels[0]}
                  </div>
                  <div className="mt-1 font-semibold leading-snug group-hover:text-brand-700 dark:group-hover:text-brand-300">
                    {p.title}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="mt-14" aria-labelledby="start-heading">
        <h2 id="start-heading" className="text-xl font-bold">New here? Start here</h2>
        <p className="mb-5 mt-1 text-sm text-slate-600 dark:text-slate-400">Short reading orders that build on each other.</p>
        <StartHere cards={getStartCards()} />
      </section>

      <section className="mt-14" aria-labelledby="popular-heading">
        <h2 id="popular-heading" className="mb-5 text-xl font-bold">Most read</h2>
        <div className="grid gap-5 md:grid-cols-3">
          <PopularList title="AI, ML & Math" posts={getPopular(5, "ml-and-math")} href="/ml-and-math" />
          <PopularList title="Python" posts={getPopular(5, "python")} href="/python" />
          <PopularList title="IBM i" posts={getPopular(5, "ibm-i")} href="/ibm-i" />
        </div>
      </section>

      <section className="mt-14">
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="text-xl font-bold">More recent posts</h2>
          <Link href="/blog" className="text-sm font-semibold text-brand-700 dark:text-brand-300">
            Browse all {posts.length} posts →
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {latest.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      </section>

      <section className="mt-14" aria-labelledby="paths-heading">
        <h2 id="paths-heading" className="mb-5 text-xl font-bold">Browse by subject</h2>
        <SectionCards />
      </section>

      <section className="mt-14">
        <h2 className="mb-4 text-xl font-bold">Browse by topic</h2>
        <div className="flex flex-wrap gap-2">
          {topics.map((t) => (
            <TopicChip key={t.slug} label={t.label} count={t.count} />
          ))}
        </div>
      </section>
    </div>
  );
}
