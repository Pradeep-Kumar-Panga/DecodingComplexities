import { getAllPosts, type Post } from "./posts";

export type Course = {
  id: string;
  section: string;
  title: string;
  description: string;
  modules: { title: string; slugs: string[] }[];
};

export const COURSES: Course[] = [
  {
    id: "python-for-beginners",
    section: "python",
    title: "Python for Beginners",
    description: "A step-by-step Python course: data types, strings, collections, control flow, functions, files, modules and classes, finishing with a small project. One lesson at a time.",
    modules: [
      {
        title: "Getting started",
        slugs: [
          "getting-started-with-python",
          "python-print-function-what-parameters",
          "python-syntax-comments",
          "variables-in-python",
          "python-input-function",
        ],
      },
      {
        title: "Data types and operators",
        slugs: ["data-types-in-python", "numeric-data-types-in-python", "python-type-conversion", "operators-in-python"],
      },
      {
        title: "Working with strings",
        slugs: [
          "mastering-string-manipulation-in-python",
          "python-slicing",
          "python-f-strings",
          "case-conversion-in-python-upper-case",
          "split-join-strings-in-python",
          "string-method-zfill-in-python",
        ],
      },
      {
        title: "Lists, tuples, dictionaries and sets",
        slugs: [
          "working-with-lists-in-python",
          "removing-elements-from-list-in-python",
          "python-copy-lists",
          "mastering-art-of-tuples-in-python",
          "tuple-unpacking-in-python",
          "working-with-dictionaries-in-python_9",
          "working-with-dictionaries-in-python",
          "dictionary-merge-update-operators-in",
          "what-is-use-of-setdefault-method-in",
          "working-with-sets-in-python",
          "removing-element-from-set-remove-vs",
        ],
      },
      {
        title: "Control flow and comprehensions",
        slugs: [
          "if-condition-in-python",
          "python-truthiness-none",
          "for-loop-in-python",
          "while-loop-in-python",
          "how-to-iterate-over-list-and-get",
          "python-zip-function",
          "list-comprehension-in-python",
          "using-if-else-statements-in-list",
        ],
      },
      {
        title: "Functions",
        slugs: [
          "python-functions",
          "python-default-keyword-arguments",
          "python-args-kwargs",
          "python-variable-scope",
          "python-lambda-functions",
          "python-docstrings-type-hints",
          "usage-of-map-function-in-python",
          "different-ways-of-sorting-data-in-list",
        ],
      },
      {
        title: "Files and errors",
        slugs: [
          "exception-handling-in-python-try-except",
          "opening-and-closing-file-in-python",
          "python-file-io-reading-writing-and",
        ],
      },
      {
        title: "Modules and the standard library",
        slugs: ["python-import-modules", "python-pip-virtual-environments", "python-datetime", "python-json"],
      },
      {
        title: "Object-oriented basics",
        slugs: [
          "python-classes-objects",
          "python-init-attributes",
          "python-methods",
          "python-inheritance",
          "python-str-dunder-methods",
        ],
      },
      {
        title: "Beyond the basics",
        slugs: ["generators-in-python", "decorators-in-python"],
      },
      {
        title: "Project",
        slugs: ["python-word-counter-project"],
      },
    ],
  },
];

export type ResolvedCourse = Omit<Course, "modules"> & {
  modules: { title: string; lessons: { number: number; post: Post }[] }[];
  lessons: Post[];
  minutes: number;
};

function resolve(course: Course): ResolvedCourse {
  const all = getAllPosts();
  let n = 0;
  const modules = course.modules.map((m) => ({
    title: m.title,
    lessons: m.slugs.map((slug) => {
      const post = all.find((p) => p.slug === slug);
      if (!post) throw new Error(`Course "${course.id}" references unknown post slug "${slug}"`);
      return { number: ++n, post };
    }),
  }));
  const lessons = modules.flatMap((m) => m.lessons.map((l) => l.post));
  return { ...course, modules, lessons, minutes: lessons.reduce((sum, p) => sum + p.readingMinutes, 0) };
}

export const getCourses = (sectionSlug?: string) =>
  COURSES.filter((c) => !sectionSlug || c.section === sectionSlug).map(resolve);

export const getCourse = (id: string) => {
  const course = COURSES.find((c) => c.id === id);
  return course ? resolve(course) : undefined;
};

export function getCourseContext(post: Post) {
  const course = COURSES.find((c) => c.modules.some((m) => m.slugs.includes(post.slug)));
  if (!course) return null;
  const resolved = resolve(course);
  const index = resolved.lessons.findIndex((p) => p.id === post.id);
  const current = resolved.modules.find((m) => m.lessons.some((l) => l.post.id === post.id))!;
  return {
    course: resolved,
    module: current.title,
    index,
    total: resolved.lessons.length,
    prev: resolved.lessons[index - 1],
    next: resolved.lessons[index + 1],
  };
}
