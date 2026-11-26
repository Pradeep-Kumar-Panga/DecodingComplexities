import type { Metadata } from "next";
import { getHub } from "@/lib/hubs";
import { HubPage } from "@/components/HubPage";

const hub = getHub("ibm-i-sql-services")!;

export const metadata: Metadata = {
  title: hub.title,
  description: hub.description,
  alternates: { canonical: `/${hub.slug}` },
};

export default function Page() {
  return <HubPage hub={hub} />;
}
