import Image from "next/image";
import type { PostMeta } from "@/lib/posts";
import { sectionOf } from "@/lib/sections";

const COVER_STYLE: Record<string, string> = {
  "ml-and-math": "from-brand-900 via-brand-700 to-brand-500",
  python: "from-brand-900 via-slate-800 to-brand-500",
  "ibm-i": "from-slate-900 via-slate-800 to-brand-700",
};

export function PostCover({ post, priority = false, large = false }: { post: PostMeta; priority?: boolean; large?: boolean }) {
  const sizes = large ? "(min-width: 1024px) 640px, 100vw" : "(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw";
  if (post.youtubeId && post.youtubeThumb) {
    return (
      <Image
        src={`https://i.ytimg.com/vi/${post.youtubeId}/hqdefault.jpg`}
        alt=""
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
    );
  }
  if (post.coverImage) {
    return <Image src={post.coverImage} alt="" fill sizes={sizes} priority={priority} className="object-cover" />;
  }
  const section = sectionOf(post);
  const label = post.labels[0] ?? section.short;
  return (
    <div
      className={`relative flex h-full w-full flex-col justify-between bg-gradient-to-br p-4 ${COVER_STYLE[section.slug]}`}
    >
      <span aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.16)_1px,transparent_0)] bg-[length:18px_18px]" />
      <span className={`relative self-start rounded-full bg-white/15 font-semibold uppercase tracking-widest text-white ${large ? "px-3 py-1 text-sm" : "px-2.5 py-0.5 text-[11px]"}`}>
        {label}
      </span>
      <Image
        src="/brand/dc-logo.png"
        alt=""
        width={large ? 44 : 32}
        height={large ? 44 : 32}
        className="relative self-end rounded-md bg-white"
      />
    </div>
  );
}
