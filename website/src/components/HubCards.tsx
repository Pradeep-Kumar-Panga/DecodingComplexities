import Link from "next/link";
import { hubPosts, type Hub } from "@/lib/hubs";

export function HubCards({ hubs }: { hubs: Hub[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {hubs.map((h) => (
        <Link
          key={h.slug}
          href={`/${h.slug}`}
          className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-baseline justify-between">
            <h3 className="text-lg font-bold group-hover:text-brand-700 dark:group-hover:text-brand-300">{h.title}</h3>
            <span className="text-sm text-slate-500">{hubPosts(h).length} posts</span>
          </div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{h.description}</p>
          <span className="mt-4 inline-block text-sm font-semibold text-brand-700 dark:text-brand-300">Open the index →</span>
        </Link>
      ))}
    </div>
  );
}
