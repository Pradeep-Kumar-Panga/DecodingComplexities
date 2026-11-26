import { getAllPosts, type Post } from "./posts";

export type LearningPath = {
  id: string;
  section: string;
  title: string;
  blurb: string;
  slugs: string[];
};

export const PATHS: LearningPath[] = [
  {
    id: "ml-foundations",
    section: "ml-and-math",
    title: "From vectors to how a model learns",
    blurb: "The building blocks first, then loss, calculus and gradient descent.",
    slugs: [
      "what-is-a-vector",
      "the-dot-product",
      "matrix-basics",
      "loss-function",
      "calculus-machine-learning",
      "gradient-vector",
      "gradient-descent",
    ],
  },
  {
    id: "ibm-i-essentials",
    section: "ibm-i",
    title: "IBM i essentials",
    blurb: "Subsystems, activation groups, free-format RPGLE, CHAIN and the SQL services.",
    slugs: [
      "what-is-subsystem",
      "what-is-activation-group",
      "advantages-of-using-free-format-rpgle",
      "what-we-need-to-know-about-chain-rpgle",
      "what-is-sql-path-and-how-to-change-sql",
      "run-cl-commands-from-sql-ibm-i",
    ],
  },
];

export type ResolvedPath = LearningPath & { posts: Post[] };

function resolve(path: LearningPath): ResolvedPath {
  const all = getAllPosts();
  const posts = path.slugs.map((slug) => {
    const post = all.find((p) => p.slug === slug);
    if (!post) throw new Error(`Learning path "${path.id}" references unknown post slug "${slug}"`);
    return post;
  });
  return { ...path, posts };
}

export const getPaths = (sectionSlug?: string): ResolvedPath[] =>
  PATHS.filter((p) => !sectionSlug || p.section === sectionSlug).map(resolve);

export function getPathContext(post: Post) {
  const path = PATHS.find((p) => p.slugs.includes(post.slug));
  if (!path) return null;
  const resolved = resolve(path);
  const index = resolved.posts.findIndex((p) => p.id === post.id);
  return { path: resolved, index, total: resolved.posts.length, next: resolved.posts[index + 1] };
}
