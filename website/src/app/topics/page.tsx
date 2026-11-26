import type { Metadata } from "next";
import Link from "next/link";
import { getTopics } from "@/lib/posts";

export const metadata: Metadata = { title: "Topics", alternates: { canonical: "/topics" } };

export default function TopicsIndex() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Topics</h1>
      <ul className="grid gap-3 sm:grid-cols-2">
        {getTopics().map((t) => (
          <li key={t.slug}>
            <Link
              href={`/topics/${t.slug}`}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-brand-400 dark:border-slate-800 dark:bg-slate-900"
            >
              <span className="font-medium">{t.label}</span>
              <span className="text-sm text-slate-500">{t.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
