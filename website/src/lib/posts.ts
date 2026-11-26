import fs from "node:fs";
import path from "node:path";
import { sectionOf, type Section } from "./sections";

export type PostMeta = {
  id: string;
  year: string;
  month: string;
  slug: string;
  path: string;
  title: string;
  published: string;
  updated: string;
  labels: string[];
  excerpt: string;
  readingMinutes: number;
  youtubeId: string | null;
  youtubeThumb: boolean;
  coverImage: string | null;
};

export type Heading = { id: string; text: string; level: 2 | 3 };

export type Post = PostMeta & { html: string; headings: Heading[] };

const contentDir = path.join(process.cwd(), "content");
let cache: Post[] | null = null;

export function getAllPosts(): Post[] {
  if (cache && process.env.NODE_ENV === "production") return cache;
  const dir = path.join(contentDir, "posts");
  cache = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) as Post)
    .sort((a, b) => b.published.localeCompare(a.published));
  return cache;
}

export function toMeta(post: Post): PostMeta {
  return {
    id: post.id,
    year: post.year,
    month: post.month,
    slug: post.slug,
    path: post.path,
    title: post.title,
    published: post.published,
    updated: post.updated,
    labels: post.labels,
    excerpt: post.excerpt,
    readingMinutes: post.readingMinutes,
    youtubeId: post.youtubeId,
    youtubeThumb: post.youtubeThumb,
    coverImage: post.coverImage,
  };
}

export const isLegacyPath = (p: string) => /^\/\d{4}\/\d{2}\/.+\.html$/.test(p);

export function getPost(year: string, month: string, slug: string): Post | undefined {
  return getAllPosts().find((p) => p.path === `/${year}/${month}/${slug}.html`);
}

export const getPostByPath = (postPath: string) => getAllPosts().find((p) => p.path === postPath);

export const slugify = (label: string) =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export type Topic = { label: string; slug: string; count: number };

export function getTopics(): Topic[] {
  const counts = new Map<string, number>();
  for (const p of getAllPosts()) for (const l of p.labels) counts.set(l, (counts.get(l) ?? 0) + 1);
  return [...counts.entries()]
    .map(([label, count]) => ({ label, slug: slugify(label), count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function getPostsByTopic(topicSlug: string): Post[] {
  return getAllPosts().filter((p) => p.labels.some((l) => slugify(l) === topicSlug));
}

export function getPostsBySection(section: Section): Post[] {
  return getAllPosts().filter((p) => sectionOf(p).slug === section.slug);
}

// The post's most-used label stands in for its series, so "next" stays on the same subject.
export function primaryTopic(post: PostMeta): string | null {
  const counts = new Map(getTopics().map((t) => [t.label, t.count]));
  return [...post.labels].sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0))[0] ?? null;
}

export function getNeighbors(post: Post): { topic: string | null; earlier?: Post; later?: Post } {
  const topic = primaryTopic(post);
  if (!topic) return { topic };
  const series = getAllPosts().filter((p) => primaryTopic(p) === topic);
  const i = series.findIndex((p) => p.id === post.id);
  return { topic, earlier: series[i + 1], later: series[i - 1] };
}

export function getRelated(post: Post, limit = 4): Post[] {
  return getAllPosts()
    .filter((p) => p.id !== post.id)
    .map((p) => ({ p, score: p.labels.filter((l) => post.labels.includes(l)).length }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.p.published.localeCompare(a.p.published))
    .slice(0, limit)
    .map((x) => x.p);
}

export const formatDate = (iso: string, style: "short" | "long" = "long") =>
  new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: style === "long" ? "long" : "short",
    day: "numeric",
    timeZone: "Asia/Kolkata",
  });
