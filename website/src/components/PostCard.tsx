import Link from "next/link";
import { formatDate, type PostMeta } from "@/lib/posts";
import { PostCover } from "./PostCover";

export function PostCard({ post }: { post: PostMeta }) {
  return (
    <Link
      href={post.path}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <PostCover post={post} />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {formatDate(post.published, "short")} · {post.readingMinutes} min read
        </div>
        <h3 className="font-semibold leading-snug group-hover:text-brand-700 dark:group-hover:text-brand-300">{post.title}</h3>
        <p className="line-clamp-3 text-sm text-slate-600 dark:text-slate-400">{post.excerpt}</p>
      </div>
    </Link>
  );
}
