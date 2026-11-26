import { getLatestPosts } from "@/lib/feed";
import { SITE } from "@/lib/site";

// Built once at deploy time so the Worker never reads content files at request time.
export const dynamic = "force-static";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function GET() {
  const items = getLatestPosts()
    .slice(0, 30)
    .map(
      (p) => `<item>
<title>${esc(p.title)}</title>
<link>${SITE.url}${p.path}</link>
<guid isPermaLink="true">${SITE.url}${p.path}</guid>
<pubDate>${new Date(p.published).toUTCString()}</pubDate>
<description>${esc(p.excerpt)}</description>
</item>`,
    )
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>${esc(SITE.name)}</title>
<link>${SITE.url}</link>
<description>${esc(SITE.description)}</description>
${items}
</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
