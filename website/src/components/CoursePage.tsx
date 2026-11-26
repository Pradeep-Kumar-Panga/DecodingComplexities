import Link from "next/link";
import type { ResolvedCourse } from "@/lib/courses";
import { getSection } from "@/lib/sections";

export function CoursePage({ course }: { course: ResolvedCourse }) {
  const section = getSection(course.section)!;
  const hours = Math.floor(course.minutes / 60);
  const mins = course.minutes % 60;

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/" className="hover:text-brand-700">Home</Link>
        <span className="mx-2">/</span>
        <Link href={`/${section.slug}`} className="hover:text-brand-700">{section.short}</Link>
      </nav>
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">
        Course · {course.lessons.length} lessons · about {hours > 0 ? `${hours} h ` : ""}{mins} min of reading
      </p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">{course.title}</h1>
      <p className="mt-3 text-slate-600 dark:text-slate-400">{course.description}</p>
      <Link
        href={course.lessons[0].path}
        className="mt-5 inline-block rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Start lesson 1
      </Link>

      {course.modules.map((m, mi) => (
        <section key={m.title} className="mt-10">
          <h2 className="mb-3 border-b border-slate-200 pb-2 text-lg font-bold dark:border-slate-800">
            <span className="mr-2 text-slate-400">Module {mi + 1}</span>
            {m.title}
          </h2>
          <ol className="space-y-2">
            {m.lessons.map(({ number, post }) => (
              <li key={post.id} className="flex gap-3">
                <span className="w-7 shrink-0 text-right text-sm text-slate-400">{number}</span>
                <Link href={post.path} className="font-medium hover:text-brand-700 dark:hover:text-brand-300">
                  {post.title}
                </Link>
                <span className="ml-auto shrink-0 text-xs text-slate-400">{post.readingMinutes} min</span>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
