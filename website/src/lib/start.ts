import type { Post } from "./posts";
import { getCourses } from "./courses";
import { getPaths } from "./paths";

export type StartCard = {
  id: string;
  label: string;
  title: string;
  blurb: string;
  posts: Post[];
  more: number;
  cta: string;
  href: string;
};

const ORDER = ["ml-foundations", "python-for-beginners", "ibm-i-essentials"];
const PREVIEW = 6;

export function getStartCards(sectionSlug?: string): StartCard[] {
  const paths = getPaths(sectionSlug).map<StartCard>((p) => ({
    id: p.id,
    label: `${p.posts.length}-post path`,
    title: p.title,
    blurb: p.blurb,
    posts: p.posts,
    more: 0,
    cta: "Start with part 1",
    href: p.posts[0].path,
  }));
  const courses = getCourses(sectionSlug).map<StartCard>((c) => ({
    id: c.id,
    label: `Course · ${c.lessons.length} lessons`,
    title: c.title,
    blurb: c.description,
    posts: c.lessons.slice(0, PREVIEW),
    more: Math.max(0, c.lessons.length - PREVIEW),
    cta: "Start the course",
    href: `/courses/${c.id}`,
  }));
  return [...paths, ...courses].sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));
}
