import type { Metadata } from "next";
import { getSection } from "@/lib/sections";
import { SectionPage } from "@/components/SectionPage";

const section = getSection("ibm-i")!;

export const metadata: Metadata = {
  title: section.name,
  description: section.description,
  alternates: { canonical: `/${section.slug}` },
};

export default function Page() {
  return <SectionPage section={section} />;
}
