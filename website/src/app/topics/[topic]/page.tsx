import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostsByTopic, getTopics, slugify } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";

type Props = { params: Promise<{ topic: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  // Old Blogger label links arrive as the label text ("IBM i"), so prerender that form too.
  return getTopics().flatMap((t) => [...new Set([t.slug, t.label])].map((topic) => ({ topic })));
}

const resolve = (raw: string) => {
  const slug = slugify(decodeURIComponent(raw));
  return getTopics().find((t) => t.slug === slug);
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const topic = resolve((await params).topic);
  return topic ? { title: topic.label, alternates: { canonical: `/topics/${topic.slug}` } } : {};
}

export default async function TopicPage({ params }: Props) {
  const topic = resolve((await params).topic);
  if (!topic) notFound();
  const posts = getPostsByTopic(topic.slug);
  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="text-3xl font-bold tracking-tight">{topic.label}</h1>
      <p className="mb-8 mt-1 text-slate-500 dark:text-slate-400">{posts.length} posts</p>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>
    </div>
  );
}
