import Link from "next/link";
import { getNeighbors, getRelated, formatDate, type Post } from "@/lib/posts";
import { getCourseContext } from "@/lib/courses";
import { getPathContext } from "@/lib/paths";
import { sectionOf } from "@/lib/sections";
import { SITE } from "@/lib/site";
import { TopicChip } from "@/components/TopicChip";
import { PostCard } from "@/components/PostCard";
import { Toc } from "@/components/Toc";
import { CopyCodeButtons } from "@/components/CopyCodeButtons";
import { hubOfPost } from "@/lib/hubs";

export function PostView({ post }: { post: Post }) {
  const section = sectionOf(post);
  const { topic, earlier, later } = getNeighbors(post);
  const related = getRelated(post);
  const courseCtx = getCourseContext(post);
  const pathCtx = courseCtx ? null : getPathContext(post);
  const hub = courseCtx ? undefined : hubOfPost(post);
  const showToc = post.headings.length >= 3;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.published,
    dateModified: post.updated,
    author: { "@type": "Person", name: SITE.author },
    mainEntityOfPage: `${SITE.url}${post.path}`,
  };

  return (
    <div
      className={
        showToc
          ? "mx-auto max-w-6xl px-5 py-10 lg:grid lg:grid-cols-[minmax(0,46rem)_15rem] lg:justify-center lg:gap-12"
          : "mx-auto max-w-3xl px-5 py-10"
      }
    >
      <article className="min-w-0">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          <Link href="/" className="hover:text-brand-700">Home</Link>
          <span className="mx-2">/</span>
          <Link href={`/${section.slug}`} className="hover:text-brand-700">{section.short}</Link>
          {courseCtx && (
            <>
              <span className="mx-2">/</span>
              <Link href={`/courses/${courseCtx.course.id}`} className="hover:text-brand-700">{courseCtx.course.title}</Link>
            </>
          )}
          {hub && (
            <>
              <span className="mx-2">/</span>
              <Link href={`/${hub.slug}`} className="hover:text-brand-700">{hub.title}</Link>
            </>
          )}
        </nav>

        {courseCtx && (
          <p className="mb-4 inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800 dark:bg-brand-950 dark:text-brand-200">
            Lesson {courseCtx.index + 1} of {courseCtx.total} · {courseCtx.module}
          </p>
        )}

        {pathCtx && (
          <p className="mb-4 inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800 dark:bg-brand-950 dark:text-brand-200">
            Part {pathCtx.index + 1} of {pathCtx.total} · {pathCtx.path.title}
          </p>
        )}

        <header className="mb-8">
          <div className="mb-3 flex flex-wrap gap-2">
            {post.labels.map((l) => (
              <TopicChip key={l} label={l} />
            ))}
          </div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{post.title}</h1>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            {SITE.author} · {formatDate(post.published)} · {post.readingMinutes} min read
          </p>
        </header>

        {showToc && (
          <details className="mb-8 rounded-lg border border-slate-200 p-4 text-sm lg:hidden dark:border-slate-800">
            <summary className="cursor-pointer font-semibold">On this page</summary>
            <ul className="mt-3 space-y-1.5">
              {post.headings.map((h) => (
                <li key={h.id} className={h.level === 3 ? "pl-4" : ""}>
                  <a href={`#${h.id}`} className="text-brand-700 dark:text-brand-300">{h.text}</a>
                </li>
              ))}
            </ul>
          </details>
        )}

        <div className="post-body" dangerouslySetInnerHTML={{ __html: post.html }} />
        <CopyCodeButtons />

        {courseCtx && (
          <div className="mt-14 grid gap-4 sm:grid-cols-2">
            {courseCtx.prev ? (
              <Link href={courseCtx.prev.path} className="rounded-xl border border-slate-200 p-4 hover:border-brand-400 dark:border-slate-800">
                <div className="text-xs text-slate-500">← Previous lesson</div>
                <div className="font-medium">{courseCtx.prev.title}</div>
              </Link>
            ) : (
              <span />
            )}
            {courseCtx.next && (
              <Link href={courseCtx.next.path} className="rounded-xl bg-brand-600 p-4 text-white hover:bg-brand-700 sm:text-right">
                <div className="text-xs font-semibold uppercase tracking-wide text-brand-200">
                  Next lesson · {courseCtx.index + 2} of {courseCtx.total}
                </div>
                <div className="mt-1 font-bold">{courseCtx.next.title}</div>
              </Link>
            )}
          </div>
        )}

        {pathCtx?.next && (
          <Link
            href={pathCtx.next.path}
            className="mt-14 block rounded-xl bg-brand-600 p-5 text-white hover:bg-brand-700"
          >
            <div className="text-xs font-semibold uppercase tracking-wide text-brand-200">
              Next in the path · part {pathCtx.index + 2} of {pathCtx.total}
            </div>
            <div className="mt-1 text-lg font-bold">{pathCtx.next.title}</div>
          </Link>
        )}

        {!courseCtx && (earlier || later) && (
          <nav className="mt-14 grid gap-4 border-t border-slate-200 pt-8 sm:grid-cols-2 dark:border-slate-800" aria-label={`More in ${topic}`}>
            {earlier ? (
              <Link href={earlier.path} className="rounded-lg border border-slate-200 p-4 hover:border-brand-400 dark:border-slate-800">
                <div className="text-xs text-slate-500">← Earlier in {topic}</div>
                <div className="font-medium">{earlier.title}</div>
              </Link>
            ) : (
              <span />
            )}
            {later && (
              <Link href={later.path} className="rounded-lg border border-slate-200 p-4 text-right hover:border-brand-400 dark:border-slate-800">
                <div className="text-xs text-slate-500">Later in {topic} →</div>
                <div className="font-medium">{later.title}</div>
              </Link>
            )}
          </nav>
        )}

        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-xl font-bold">Keep reading</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {related.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
            <p className="mt-6 text-sm">
              <Link href={`/${section.slug}`} className="font-semibold text-brand-700 dark:text-brand-300">
                More from {section.name} →
              </Link>
            </p>
          </section>
        )}
      </article>

      {showToc && (
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <Toc headings={post.headings} />
          </div>
        </aside>
      )}
    </div>
  );
}
