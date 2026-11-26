import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { COURSES, getCourse } from "@/lib/courses";
import { CoursePage } from "@/components/CoursePage";

type Props = { params: Promise<{ id: string }> };

export const dynamicParams = false;

export const generateStaticParams = () => COURSES.map((c) => ({ id: c.id }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = getCourse((await params).id);
  return course ? { title: course.title, description: course.description, alternates: { canonical: `/courses/${course.id}` } } : {};
}

export default async function Page({ params }: Props) {
  const course = getCourse((await params).id);
  if (!course) notFound();
  return <CoursePage course={course} />;
}
