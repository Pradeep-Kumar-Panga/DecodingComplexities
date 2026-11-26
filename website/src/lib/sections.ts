export type Section = { slug: string; name: string; short: string; description: string };

export const SECTIONS: Section[] = [
  {
    slug: "ml-and-math",
    name: "Machine Learning & Math",
    short: "ML & Math",
    description: "Machine learning, AI and the math behind it, plus cryptography and hashing, broken into pieces and connected back to the whole.",
  },
  {
    slug: "python",
    name: "Python",
    short: "Python",
    description: "A step-by-step Python course for beginners, plus practical Python tutorials on files, data and scripting.",
  },
  {
    slug: "ibm-i",
    name: "IBM i",
    short: "IBM i",
    description: "A reference library of IBM i tutorials: RPGLE, SQL services, ILE and system administration.",
  },
];

const ML_LABELS = new Set([
  "Machine Learning",
  "Mathematics",
  "Statistics",
  "Probability",
  "Artificial Intelligence",
  "LLM",
  "RAG",
  "MCP",
  "Cryptography",
]);

export const getSection = (slug: string) => SECTIONS.find((s) => s.slug === slug);

export const sectionOf = (post: { labels: string[] }): Section => {
  const slug = post.labels.some((l) => ML_LABELS.has(l)) ? "ml-and-math" : post.labels.includes("Python") ? "python" : "ibm-i";
  return getSection(slug)!;
};
