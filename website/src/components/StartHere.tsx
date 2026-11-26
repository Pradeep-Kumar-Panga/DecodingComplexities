import Link from "next/link";
import type { StartCard } from "@/lib/start";

export function StartHere({ cards }: { cards: StartCard[] }) {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.id}
          className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">{card.label}</div>
          <h3 className="mt-1 text-lg font-bold leading-snug">{card.title}</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{card.blurb}</p>
          <ol className="mt-4 flex-1 space-y-2 text-sm">
            {card.posts.map((p, i) => (
              <li key={p.id} className="flex gap-2">
                <span className="w-5 shrink-0 text-right text-slate-400">{i + 1}.</span>
                <Link href={p.path} className="hover:text-brand-700 dark:hover:text-brand-300">
                  {p.title}
                </Link>
              </li>
            ))}
            {card.more > 0 && (
              <li className="pl-7 text-slate-500">
                <Link href={card.href} className="hover:text-brand-700">
                  …and {card.more} more lessons
                </Link>
              </li>
            )}
          </ol>
          <Link
            href={card.href}
            className="mt-5 inline-block rounded-full bg-brand-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-brand-700"
          >
            {card.cta}
          </Link>
        </div>
      ))}
    </div>
  );
}
