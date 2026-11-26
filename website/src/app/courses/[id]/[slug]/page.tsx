import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPosts, getPostByPath } from "@/lib/posts";
import { PostView } from "@/components/PostView";

type Props = { params: Promise<{ id: string; slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPosts()
    .map((p) => p.path.match(/^\/courses\/([^/]+)\/([^/]+)$/))
    .filter((m): m is RegExpMatchArray => !!m)
    .map((m) => ({ id: m[1], slug: m[2] }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, slug } = await params;
  const post = getPostByPath(`/courses/${id}/${slug}`);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: post.path },
    openGraph: {
      type: "article",
      siteName: "Decoding Complexities",
      title: post.title,
      description: post.excerpt,
      publishedTime: post.published,
      images: [post.coverImage ?? "/opengraph-image"],
    },
  };
}

export default async function LessonPage({ params }: Props) {
  const { id, slug } = await params;
  const post = getPostByPath(`/courses/${id}/${slug}`);
  if (!post) notFound();
  return <PostView post={post} />;
}
