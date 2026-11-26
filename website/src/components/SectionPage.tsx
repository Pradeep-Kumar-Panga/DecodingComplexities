import { Suspense } from "react";
import type { Section } from "@/lib/sections";
import { getPostsBySection, slugify } from "@/lib/posts";
import { ArchiveList } from "./ArchiveList";
import { PostCard } from "./PostCard";
import { TopicChip } from "./TopicChip";
import { StartHere } from "./StartHere";
import { getStartCards } from "@/lib/start";
import { getPopular } from "@/lib/popularity";
import { hubsForSection } from "@/lib/hubs";
import { HubCards } from "./HubCards";
import { PopularList } from "./PopularList";

export function SectionPage({ section }: { section: Section }) {
  const posts = getPostsBySection(section);
  const popular = getPopular(6, section.slug);
  const counts = new Map<string, number>();
  for (const p of posts) for (const l of p.labels) counts.set(l, (counts.get(l) ?? 0) + 1);
  const topics = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const items = posts.map(({ id, path, title, published, labels, excerpt }) => ({ id, path, title, published, labels, excerpt }));

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="text-3xl font-bold tracking-tight">{section.name}</h1>
      <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-400">{section.description}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {topics.map(([label, count]) => (
          <TopicChip key={slugify(label)} label={label} count={count} />
        ))}
      </div>

      <h2 className="mb-4 mt-12 text-xl font-bold">Start here</h2>
      <StartHere cards={getStartCards(section.slug)} />

      {hubsForSection(section.slug).length > 0 && (
        <>
          <h2 className="mb-4 mt-14 text-xl font-bold">Reference indexes</h2>
          <HubCards hubs={hubsForSection(section.slug)} />
        </>
      )}

      {popular.length > 0 && (
        <>
          <h2 className="mb-4 mt-14 text-xl font-bold">Most read</h2>
          <PopularList title={section.name} posts={popular} />
        </>
      )}

      <h2 className="mb-4 mt-14 text-xl font-bold">Newest</h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts.slice(0, 3).map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>

      <h2 className="mb-5 mt-14 text-xl font-bold">All {posts.length} posts</h2>
      <div className="max-w-3xl">
        <Suspense>
          <ArchiveList items={items} topics={topics.map(([l]) => l)} />
        </Suspense>
      </div>
    </div>
  );
}
