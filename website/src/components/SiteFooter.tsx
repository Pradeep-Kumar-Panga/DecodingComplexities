import Link from "next/link";
import { SITE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 py-8 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5">
        <p>
          © {new Date().getFullYear()} {SITE.author} · {SITE.name}
        </p>
        <div className="flex gap-5">
          <Link href="/topics" className="hover:text-brand-700">Topics</Link>
          <Link href="/feed.xml" className="hover:text-brand-700">RSS</Link>
          <Link href="/about#contact" className="hover:text-brand-700">Contact</Link>
          <a href={SITE.youtube} target="_blank" rel="noopener noreferrer" className="hover:text-brand-700">YouTube</a>
        </div>
      </div>
    </footer>
  );
}
