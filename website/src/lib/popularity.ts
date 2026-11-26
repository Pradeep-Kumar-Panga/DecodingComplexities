import fs from "node:fs";
import path from "node:path";
import { getAllPosts, type Post } from "./posts";
import { sectionOf } from "./sections";

type Entry = { clicks: number; impressions: number };

let cache: Record<string, Entry> | null = null;

function load(): Record<string, Entry> {
  if (cache && process.env.NODE_ENV === "production") return cache;
  const file = path.join(process.cwd(), "content/popularity.json");
  cache = fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, Entry>) : {};
  return cache;
}

export const clicksFor = (post: Post) => load()[post.path]?.clicks ?? 0;

export function getPopular(limit: number, sectionSlug?: string, among: Post[] = getAllPosts()): Post[] {
  return among
    .filter((p) => (!sectionSlug || sectionOf(p).slug === sectionSlug) && clicksFor(p) > 0)
    .sort((a, b) => clicksFor(b) - clicksFor(a) || b.published.localeCompare(a.published))
    .slice(0, limit);
}
