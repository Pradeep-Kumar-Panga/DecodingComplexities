import type { MetadataRoute } from "next";
import { getAllPosts, getTopics } from "@/lib/posts";
import { SITE } from "@/lib/site";
import { SECTIONS } from "@/lib/sections";
import { HUBS } from "@/lib/hubs";
import { COURSES } from "@/lib/courses";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE.url },
    { url: `${SITE.url}/blog` },
    { url: `${SITE.url}/topics` },
    ...SECTIONS.map((s) => ({ url: `${SITE.url}/${s.slug}` })),
    ...HUBS.map((h) => ({ url: `${SITE.url}/${h.slug}` })),
    ...COURSES.map((c) => ({ url: `${SITE.url}/courses/${c.id}` })),
    { url: `${SITE.url}/about` },
    { url: `${SITE.url}/privacy` },
    ...getTopics().map((t) => ({ url: `${SITE.url}/topics/${t.slug}` })),
    ...getAllPosts().map((p) => ({ url: `${SITE.url}${p.path}`, lastModified: p.updated })),
  ];
}
