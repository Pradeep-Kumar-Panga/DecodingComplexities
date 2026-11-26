import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllPosts, getTopics } from "@/lib/posts";
import { ArchiveList } from "@/components/ArchiveList";

export const metadata: Metadata = { title: "All posts", alternates: { canonical: "/blog" } };

export default function BlogIndex() {
  const items = getAllPosts().map(({ id, path, title, published, labels, excerpt }) => ({
    id,
    path,
    title,
    published,
    labels,
    excerpt,
  }));
  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">All posts</h1>
      <Suspense>
        <ArchiveList items={items} topics={getTopics().map((t) => t.label)} />
      </Suspense>
    </div>
  );
}
