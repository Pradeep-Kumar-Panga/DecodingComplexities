import { getAllPosts, type Post } from "./posts";
import { clicksFor } from "./popularity";

type Group = { title: string; test: RegExp };

export type Hub = {
  slug: string;
  section: string;
  title: string;
  description: string;
  include: (p: Post) => boolean;
  groups: Group[];
  fallback: string;
};

const RPG_LABELS = ["RPGLE", "Subfile", "SQLRPGLE", "ILE"];

export const HUBS: Hub[] = [
  {
    slug: "ibm-i-sql-services",
    section: "ibm-i",
    title: "IBM i SQL services",
    description: "Using the IBM i SQL services (QSYS2 and SYSTOOLS) to work with queues, the IFS, journals, jobs and more, grouped by what they touch.",
    include: (p) =>
      p.labels.includes("IBM i") && (p.labels.includes("SQL") || /\b(from|in|using) SQL\b/i.test(p.title)),
    groups: [
      { title: "Data queues", test: /data queue|dtaq/i },
      { title: "IFS files and directories", test: /\bifs\b/i },
      { title: "Journals", test: /journal/i },
      { title: "Jobs, spooled files and locks", test: /spool|job|lock|open files/i },
      { title: "Objects, system information and SQL generation", test: /system value|binding|generate sql|sql path|restrict|split|data area|cl commands|table/i },
    ],
    fallback: "More SQL services",
  },
  {
    slug: "rpgle-reference",
    section: "ibm-i",
    title: "RPGLE reference",
    description: "RPGLE posts on files, subfiles and built-in functions, grouped for quick lookup.",
    include: (p) =>
      p.labels.some((l) => RPG_LABELS.includes(l)) || /rpgle|subfile|sflnxtchg|readc|usropn|\bchain\b/i.test(p.title),
    groups: [
      { title: "Subfiles", test: /subfile|sfl/i },
      { title: "Reading and chaining files", test: /\bchain\b|\bread\b|setll|reade|opnqryf|ovrdbf/i },
      { title: "Built-in functions and operators", test: /built-in|%|range|list|max|min|lower|upper|parms|conversion|numeric|timestamp|date/i },
    ],
    fallback: "More RPGLE",
  },
  {
    slug: "cryptography",
    section: "ml-and-math",
    title: "Cryptography and hashing",
    description: "What cryptography is, how hash functions work, and how MD5, SHA-1 and SHA-256 are built, plus how AI systems use cryptography.",
    include: (p) => p.labels.includes("Cryptography"),
    groups: [
      { title: "Cryptography basics", test: /what is cryptography/i },
      { title: "Hash functions", test: /what is a hash/i },
      { title: "Hash algorithms", test: /md5|sha-/i },
    ],
    fallback: "Cryptography and AI",
  },
];

export const getHub = (slug: string) => HUBS.find((h) => h.slug === slug);

export function hubPosts(hub: Hub): Post[] {
  return getAllPosts().filter(hub.include);
}

export function hubGroups(hub: Hub) {
  const posts = hubPosts(hub);
  const groups = new Map<string, Post[]>();
  for (const p of posts) {
    const g = hub.groups.find((x) => x.test.test(p.title))?.title ?? hub.fallback;
    groups.set(g, [...(groups.get(g) ?? []), p]);
  }
  const order = [...hub.groups.map((g) => g.title), hub.fallback];
  return order
    .filter((t) => groups.has(t))
    .map((title) => ({
      title,
      posts: groups.get(title)!.sort((a, b) => clicksFor(b) - clicksFor(a) || a.title.localeCompare(b.title)),
    }));
}

export const hubsForSection = (sectionSlug: string) => HUBS.filter((h) => h.section === sectionSlug);
export const hubOfPost = (post: Post) => HUBS.find((h) => h.include(post));
