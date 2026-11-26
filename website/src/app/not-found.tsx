import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-5 py-24 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="mt-3 text-slate-600 dark:text-slate-400">The page may have moved. Try the archive.</p>
      <Link href="/blog" className="mt-6 inline-block font-semibold text-brand-700 dark:text-brand-300">
        Browse all posts →
      </Link>
    </div>
  );
}
