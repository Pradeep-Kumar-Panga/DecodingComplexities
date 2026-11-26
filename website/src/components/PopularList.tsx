import Link from "next/link";
import type { Post } from "@/lib/posts";

export function PopularList({ title, posts, href }: { title: string; posts: Post[]; href?: string }) {
  if (posts.length === 0) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-3 font-bold">{href ? <Link href={href} className="hover:text-brand-700 dark:hover:text-brand-300">{title}</Link> : title}</h3>
      <ol className="space-y-2.5 text-sm">
        {posts.map((p, i) => (
          <li key={p.id} className="flex gap-3">
            <span className="w-4 shrink-0 text-right text-slate-400">{i + 1}</span>
            <Link href={p.path} className="leading-snug hover:text-brand-700 dark:hover:text-brand-300">
              {p.title}
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
