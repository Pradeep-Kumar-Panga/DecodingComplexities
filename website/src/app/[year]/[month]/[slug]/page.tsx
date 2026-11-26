import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPosts, getPost, isLegacyPath } from "@/lib/posts";
import { PostView } from "@/components/PostView";

type Props = { params: Promise<{ year: string; month: string; slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPosts()
    .filter((p) => isLegacyPath(p.path))
    .map(({ year, month, slug }) => ({ year, month, slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { year, month, slug } = await params;
  const post = getPost(year, month, slug);
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

export default async function PostPage({ params }: Props) {
  const { year, month, slug } = await params;
  const post = getPost(year, month, slug);
  if (!post) notFound();
  return <PostView post={post} />;
}
