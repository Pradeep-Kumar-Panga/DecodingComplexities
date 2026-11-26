import Link from "next/link";
import { slugify } from "@/lib/posts";

export function TopicChip({ label, count }: { label: string; count?: number }) {
  return (
    <Link
      href={`/topics/${slugify(label)}`}
      className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800 hover:bg-brand-100 dark:bg-brand-950 dark:text-brand-200 dark:hover:bg-brand-900"
    >
      {label}
      {count !== undefined && <span className="ml-1.5 text-brand-400">{count}</span>}
    </Link>
  );
}
