import Image from "next/image";
import Link from "next/link";
import { SECTIONS } from "@/lib/sections";
import { SITE } from "@/lib/site";

const nav = [
  ...SECTIONS.map((s) => ({ href: `/${s.slug}`, label: s.short })),
  { href: "/blog", label: "All posts" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-3">
        <Link href="/" aria-label={SITE.name} className="flex items-center gap-2.5 font-bold tracking-tight">
          <Image
            src="/brand/dc-logo.png"
            alt=""
            width={36}
            height={36}
            priority
            className="rounded-lg bg-white ring-1 ring-slate-200 dark:ring-slate-700"
          />
          <span className="hidden sm:inline">{SITE.name}</span>
        </Link>
        <nav className="order-3 -mx-1 flex w-full items-center gap-4 overflow-x-auto px-1 text-sm font-medium text-slate-600 md:order-none md:w-auto dark:text-slate-300">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="whitespace-nowrap py-1 hover:text-brand-700 dark:hover:text-brand-300">
              {n.label}
            </Link>
          ))}
        </nav>
        <form action="/blog" role="search" className="flex items-center gap-2">
          <input
            type="search"
            name="q"
            placeholder="Search posts"
            aria-label="Search posts"
            className="w-36 rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-sm outline-none focus:border-brand-500 sm:w-48 dark:border-slate-700 dark:bg-slate-900"
          />
          <a
            href={SITE.youtube}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-full bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 lg:inline"
          >
            YouTube
          </a>
        </form>
      </div>
    </header>
  );
}
