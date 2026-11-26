import { getAllPosts, type Post } from "./posts";
import { COURSES } from "./courses";

const lessonSlugs = new Set(COURSES.flatMap((c) => c.modules.flatMap((m) => m.slugs)));

// Home page and RSS follow the newest standalone posts; course lessons are reached through their course.
export const getLatestPosts = (): Post[] => getAllPosts().filter((p) => !lessonSlugs.has(p.slug));
