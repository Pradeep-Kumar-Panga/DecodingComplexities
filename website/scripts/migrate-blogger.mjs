// Converts a Blogger export (feed.atom) into content/posts/*.json, and public/images/blog/*.
// Usage: node scripts/migrate-blogger.mjs [--skip-images]
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { XMLParser } from "fast-xml-parser";
import * as cheerio from "cheerio";
import katex from "katex";
import { decodeHTML } from "entities";
import { createHighlighter } from "shiki";
import { MATH } from "./math-map.mjs";
import { rpgleGrammar } from "./rpgle-grammar.mjs";

const highlighter = await createHighlighter({ themes: ["github-dark"], langs: ["python", "sql", rpgleGrammar] });

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// The folder that holds Content/ and Blogger/; override when the site lives in a standalone repo.
const workspace = path.resolve(process.env.WORKSPACE_ROOT ?? path.join(root, "../.."));
const feedPath = path.resolve(
  workspace,
  process.env.BLOGGER_FEED ?? "Blogger/Blogs/Decoding Complexities/feed.atom",
);
const postsDir = path.join(root, "content/posts");
const imagesDir = path.join(root, "public/images/blog");
const manifestPath = path.join(root, "content/image-manifest.json");
const skipImages = process.argv.includes("--skip-images");

const OWN_HOSTS = /^https?:\/\/(?:www\.)?(?:codewithpr\.com|pradeeppanga\.com|decodingcomplexities\.blogspot\.com)(?=\/|$)/i;
const BLOGGER_IMG = /^https?:\/\/(?:blogger\.googleusercontent\.com|\d+\.bp\.blogspot\.com|lh\d+\.googleusercontent\.com)\//i;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true,
  parseTagValue: false,
  isArray: (name) => name === "entry" || name === "category" || name === "link",
});

const feed = parser.parse(readFileSync(feedPath, "utf8")).feed;
const text = (v) => (typeof v === "object" && v !== null ? (v["#text"] ?? "") : (v ?? ""));

const entries = feed.entry ?? [];
// Posts dropped from the site on purpose; their old URLs redirect in next.config.ts.
const REMOVED_SLUGS = new Set([
  "introducing-with-pr",
  "introduction-to-java-programming",
  "java-terminology",
  "oops-is-java-pure-object-oriented",
]);
const postEntries = entries.filter(
  (e) => e.type === "POST" && e.status === "LIVE" && !REMOVED_SLUGS.has(text(e.filename).match(/\/([^/]+)\.html$/)?.[1]),
);

// Image download

const fullSizeUrl = (url) => {
  if (/\/s\d+(-[a-z]+)*\/[^/]+$/i.test(url)) return url.replace(/\/s\d+(-[a-z]+)*\/([^/]+)$/i, "/s1600/$2");
  if (/=[a-z0-9-]+$/i.test(url) && /\/img\/a\//.test(url)) return url.replace(/=[a-z0-9-]+$/i, "=s1600");
  return url;
};
const cleanUrl = (url) => url.replace(/&amp;/g, "&");

const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : {};
const imageUrls = new Set();
for (const e of postEntries) {
  const $ = cheerio.load(text(e.content), null, false);
  $("img[src], a[href]").each((_, el) => {
    const u = cleanUrl($(el).attr("src") ?? $(el).attr("href") ?? "");
    if (BLOGGER_IMG.test(u)) imageUrls.add(fullSizeUrl(u));
  });
}

const extFromType = (type) =>
  ({ "image/png": ".png", "image/jpeg": ".jpg", "image/gif": ".gif", "image/webp": ".webp", "image/svg+xml": ".svg" })[
    type?.split(";")[0].trim()
  ] ?? ".jpg";

async function download(url) {
  const id = createHash("sha1").update(url).digest("hex").slice(0, 12);
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { redirect: "follow" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      const name = `${id}${extFromType(res.headers.get("content-type"))}`;
      writeFileSync(path.join(imagesDir, name), buf);
      return `/images/blog/${name}`;
    } catch (err) {
      if (attempt === 3) return { error: String(err) };
    }
  }
}

mkdirSync(imagesDir, { recursive: true });
if (!skipImages) {
  const todo = [...imageUrls].filter(
    (u) => !manifest[u] || !existsSync(path.join(root, "public", manifest[u])),
  );
  console.log(`Images: ${imageUrls.size} unique, ${todo.length} to download`);
  let done = 0;
  const queue = [...todo];
  const workers = Array.from({ length: 8 }, async () => {
    while (queue.length) {
      const url = queue.shift();
      const result = await download(url);
      if (typeof result === "string") manifest[url] = result;
      else console.warn(`  failed: ${url.slice(0, 90)}... (${result.error})`);
      if (++done % 50 === 0) console.log(`  ${done}/${todo.length}`);
    }
  });
  await Promise.all(workers);
  mkdirSync(path.dirname(manifestPath), { recursive: true });
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 1));
}

// HTML cleanup

const KEEP_ATTRS = {
  a: ["href", "name", "id", "target", "rel"],
  img: ["src", "alt", "width", "height"],
  iframe: ["src", "title", "allow", "allowfullscreen", "width", "height", "referrerpolicy"],
  td: ["colspan", "rowspan"],
  th: ["colspan", "rowspan"],
  ol: ["start", "type"],
  col: [],
  colgroup: [],
};
const GLOBAL_KEEP = ["id"];

// Old internal links whose target post was later re-dated or re-slugged.
const GITHUB_BLOB = "https://github.com/Pradeep-Kumar-Panga/DecodingComplexities/blob/main/";
// Companion files moved into topic folders in the GitHub repo; a leading "/" means a page on this site.
const GITHUB_FIXES = {
  "BayesianInference.ipynb": "Content/BayesianInference/notebook/BayesianInference.ipynb",
  "BeamSearch.ipynb": "Content/BeamSearch/notebook/BeamSearch.ipynb",
  "CentralLimitTheorem.ipynb": "Content/CentralLimitTheorem/notebook/CentralLimitTheorem.ipynb",
  "CosineSimilarityEmbeddings.py": "Content/CosineSimilarityEmbeddings/script/CosineSimilarityEmbeddings.py",
  "CrossEntropy.ipynb": "Content/EntropyCrossEntropy/notebook/CrossEntropy.ipynb",
  "DataLeakage.py": "Content/DataLeakage/script/DataLeakage.py",
  "GradientDescent.ipynb": "Content/GradientDescent/notebook/GradientDescent.ipynb",
  "GreedyVsSampling.ipynb": "Content/GreedyVsSampling/notebook/GreedyVsSampling.ipynb",
  "MaximumLikelihoodEstimation.ipynb": "Content/MaximumLikelihoodEstimation/notebook/MaximumLikelihoodEstimation.ipynb",
  "OneHotEncoding.ipynb": "Content/OneHotEncoding/notebook/OneHotEncoding.ipynb",
  "TopPSampling.py": "Content/TopPSampling/script/TopPSampling.py",
  "The_Machines_Compass_Calculus.ipynb": "Content/Calculus/notebook/The_Machines_Compass_Calculus.ipynb",
  "generation_demo.py": "Projects/RAG/generation_demo.py",
  "naive_chunker.py": "Projects/RAG/naive_chunker.py",
  "Notebooks/GradientVector.ipynb": "Content/GradientVector/notebook/GradientVector.ipynb",
  "Notebooks/NaiveBayesClassifier.ipynb": "Content/NaiveBayesClassifier/notebook/NaiveBayesClassifier.ipynb",
  "Notebooks/SVD_LoRA.ipynb": "Content/SVD_LoRA/notebook/SVD_LoRA.ipynb",
  "BlogDrafts/OneHotEncoding_Draft.html": "/2026/08/one-hot-encoding.html",
};

// Old internal links whose target post was later re-dated or re-slugged.
const LINK_FIXES = {
  "/2022/03/chain-rpgle": "/2020/09/what-we-need-to-know-about-chain-rpgle.html",
  "/2022/02/read-rpgle": "/2020/09/all-about-read-in-rpgle-why-we-use-it.html",
  "/2020/12/getting-started-python": "/2020/12/getting-started-with-python.html",
  "/2020/12/python-lists": "/2020/12/working-with-lists-in-python.html",
  "/2021/01/python-tuples": "/2021/01/mastering-art-of-tuples-in-python.html",
  "/2021/01/python-dictionary": "/2021/01/working-with-dictionaries-in-python_9.html",
  "/2021/01/python-dictionary-2": "/2021/01/working-with-dictionaries-in-python.html",
  "/2023/07/md5-hash-function": "/2023/07/md5-hash-function-what-is-it-and-how-to.html",
  "/2026/03/gradient-vector": "/2026/05/gradient-vector.html",
};

function fixLink(href) {
  if (href.startsWith(GITHUB_BLOB)) {
    const target = GITHUB_FIXES[href.slice(GITHUB_BLOB.length)];
    return target ? (target.startsWith("/") ? target : GITHUB_BLOB + target) : href;
  }
  const m = href.match(/^(\/\d{4}\/\d{2}\/[^#?]+?)(?:\.html)?([#?].*)?$/);
  const target = m && LINK_FIXES[m[1]];
  return target ? target + (m[2] ?? "") : href;
}

function localizeLink(href) {
  if (OWN_HOSTS.test(href)) {
    const rest = href.replace(OWN_HOSTS, "");
    return rest === "" ? "/" : fixLink(rest);
  }
  return fixLink(href);
}

function cleanHtml(html, stats, labels = []) {
  const $ = cheerio.load(html, null, false);

  $("script, style, noscript, o\\:p").remove();
  $("*").each((_, el) => {
    if (el.type !== "tag") return;
    const keep = [...(KEEP_ATTRS[el.name] ?? []), ...GLOBAL_KEEP];
    for (const attr of Object.keys(el.attribs)) if (!keep.includes(attr)) $(el).removeAttr(attr);
  });
  $("span, font, google, st1").each((_, el) => void $(el).replaceWith($(el).contents()));

  $("h1").each((_, el) => void (el.name = "h2"));

  $("img").each((_, el) => {
    const src = cleanUrl($(el).attr("src") ?? "");
    const local = manifest[fullSizeUrl(src)];
    if (local) $(el).attr("src", local);
    else if (BLOGGER_IMG.test(src)) stats.missingImages.add(src);
    $(el).attr("loading", "lazy").attr("decoding", "async");
    if (!$(el).attr("alt")) $(el).attr("alt", "");
  });

  $("a[href]").each((_, el) => {
    const href = cleanUrl($(el).attr("href"));
    if (/^\s*javascript:/i.test(href)) return void $(el).removeAttr("href");
    const local = manifest[fullSizeUrl(href)];
    if (local) return void $(el).attr("href", local);
    const next = localizeLink(href);
    if (next !== href) stats.internalLinks++;
    $(el).attr("href", next);
    if (/^https?:\/\//i.test(next)) $(el).attr("target", "_blank").attr("rel", "noopener noreferrer");
    else $(el).removeAttr("target").removeAttr("rel");
  });

  $("iframe").each((_, el) => {
    const src = $(el).attr("src") ?? "";
    if (!/^https:\/\/(www\.)?youtube(-nocookie)?\.com\/embed\//.test(src)) {
      stats.otherIframes.push(src);
      return;
    }
    $(el).removeAttr("width").removeAttr("height").attr("loading", "lazy");
    $(el).wrap('<div class="video-embed"></div>');
  });

  convertScreenshots($, stats);
  normalizeSpacing($);
  renderMath($, stats);
  dropDeadReferences($, stats);
  highlightCode($, stats, labels);

  return $.html().trim();
}

// Screenshots transcribed to text (content/screenshots/out-*.json)

const screenshotText = {};
const screenshotDir = path.join(root, "content/screenshots");
if (existsSync(screenshotDir)) {
  for (const f of readdirSync(screenshotDir).filter((n) => /^out-\d+\.json$/.test(n))) {
    Object.assign(screenshotText, JSON.parse(readFileSync(path.join(screenshotDir, f), "utf8")));
  }
}

function convertScreenshots($, stats) {
  $("img").each((_, el) => {
    const name = ($(el).attr("src") ?? "").replace("/images/blog/", "");
    const entry = screenshotText[name];
    if (!entry || entry.action !== "convert") return;
    const blocks = entry.blocks.map((b) =>
      $("<pre>")
        .attr("data-role", b.role)
        .attr("data-lang", b.lang)
        .append($("<code>").text(b.text.replace(/\s+$/, ""))),
    );
    const parent = $(el).parent();
    const target = parent.is("a") && parent.contents().length === 1 ? parent : $(el);
    target.replaceWith(blocks);
    stats.convertedScreenshots++;
  });
}

// Formulas written as plain text -> KaTeX (rendered at build time, no client JS)

const normText = (s) => s.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
const tex = (src, display) => katex.renderToString(src, { displayMode: display, throwOnError: true, output: "htmlAndMathml" });
const DOLLAR_MATH = /\$([^\s$](?:[^$\n]*[^\s$])?)\$/g;

function renderMath($, stats) {
  const used = new Set();
  $("pre:not([data-role]), p").each((_, el) => {
    const key = normText($(el).text());
    if (!MATH[key] || $(el).closest("pre[data-role]").length) return;
    used.add(key);
    $(el).replaceWith(`<div class="math-display">${tex(MATH[key], true)}</div>`);
    stats.formulas++;
  });
  $("code").each((_, el) => {
    const key = normText($(el).text());
    if (!MATH[key] || $(el).closest("pre").length) return;
    used.add(key);
    $(el).replaceWith(`<span class="math-inline">${tex(MATH[key], false)}</span>`);
    stats.formulas++;
  });
  $.root()
    .find("*")
    .addBack()
    .contents()
    .filter((_, n) => n.type === "text" && n.data.includes("$") && !$(n.parent).closest("pre, code").length)
    .each((_, n) => {
      DOLLAR_MATH.lastIndex = 0;
      if (!DOLLAR_MATH.test(n.data)) return;
      const escaped = n.data.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      $(n).replaceWith(escaped.replace(DOLLAR_MATH, (_, src) => (stats.formulas++, tex(src.replace(/&amp;/g, "&"), false))));
    });
  for (const k of used) stats.mathKeysUsed.add(k);
}

// Things the old blog pointed at that no longer exist: unavailable videos, the comment form

const YT_ID = /youtube\.com\/embed\/([\w-]{11})/;
const FEEDBACK_PROMPT = /leave a comment|contact form/i;

function dropDeadReferences($, stats) {
  $(".video-embed").each((_, el) => {
    const id = ($(el).find("iframe").attr("src") ?? "").match(YT_ID)?.[1];
    if (!id || thumbCache[id] !== false) return;
    let top = $(el);
    while (top.parent().is("div") && top.parent().children().length === 1) top = top.parent();
    const prev = top.prev("p");
    if (prev.length && /video/i.test(prev.text()) && prev.text().length < 300) prev.remove();
    top.remove();
    stats.removedVideos++;
  });
  $("p").each((_, el) => {
    const t = $(el).text();
    if (t.length < 200 && FEEDBACK_PROMPT.test(t)) {
      $(el).remove();
      stats.removedPrompts++;
    }
  });
}

// Syntax highlighting (Shiki, at build time)

const HIGHLIGHTED = new Set(["python", "sql", "rpgle"]);
const PY = /^(?:import \w|from [\w.]+ import|def \w+\(|class \w+|\s*for \w+ in .+:|\s*if .+:$|print\(|\w+ = \w+\.\w+\()/m;
const PY_ASSIGN = /^[a-z_]\w*(?:\[[^\]]*\])? = \S/m;
const PY_LABELS = new Set(["Python", "Machine Learning", "Mathematics", "LLM", "Statistics", "Artificial Intelligence", "RAG"]);
const RPG_STMT = /^\s*(?:exsr|begsr|endsr|dow|enddo|setll|reade?|chain|endif)\b[^\n]*;/im;
const SQL = /^\s*(?:SELECT|CREATE OR REPLACE|CREATE TABLE|CALL|INSERT INTO|UPDATE \w+ SET|DELETE FROM|ALTER TABLE|DROP TABLE|WITH \w+ AS)\b/m;
const RPG = /\*\*free|^\s*dcl-[a-z]+|ctl-opt/im;
const detectLang = (t, labels) => {
  if (RPG.test(t) || (labels.some((l) => l === "RPGLE" || l === "IBM i") && RPG_STMT.test(t))) return "rpgle";
  if (SQL.test(t)) return "sql";
  if (PY.test(t) || (labels.some((l) => PY_LABELS.has(l)) && PY_ASSIGN.test(t) && /[(.]/.test(t) && !/^[A-Z][a-z]+ [a-z]/.test(t))) return "python";
  return null;
};
const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function highlightCode($, stats, labels) {
  $("pre").each((_, el) => {
    const role = $(el).attr("data-role");
    if (role === "output") return;
    const code = cheerio
      .load(($(el).html() ?? "").replace(/<br\s*\/?>/gi, "\n"), null, false)
      .root()
      .text()
      .replace(/\u00a0/g, " ")
      .replace(/\s+$/, "");
    const lang = $(el).attr("data-lang") ?? detectLang(code, labels);
    if (!lang || !HIGHLIGHTED.has(lang)) return;
    const { tokens } = highlighter.codeToTokens(code, { lang, theme: "github-dark" });
    const html = tokens
      .map((line) =>
        line
          .map((t) => {
            const style = [t.color && `color:${t.color}`, t.fontStyle === 1 && "font-style:italic"].filter(Boolean).join(";");
            return style ? `<span style="${style}">${escapeHtml(t.content)}</span>` : escapeHtml(t.content);
          })
          .join(""),
      )
      .join("\n");
    $(el).attr("data-role", "code").attr("data-lang", lang).html(`<code>${html}</code>`);
    stats.highlighted++;
  });
}

// Heading anchors and the table of contents data

function addHeadingIds(html) {
  const $ = cheerio.load(html, null, false);
  const used = new Set();
  const headings = [];
  $("h2, h3").each((_, el) => {
    const label = $(el).text().replace(/\s+/g, " ").trim();
    if (!label) return;
    const base = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "section";
    let id = base;
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    used.add(id);
    $(el).attr("id", id);
    headings.push({ id, text: label, level: el.name === "h2" ? 2 : 3 });
  });
  return { html: $.html().trim(), headings };
}

// Old posts used <div> + <br><br> for paragraphs; turn that into real paragraphs.

const BLOCKS = "div, p, ul, ol, table, pre, h2, h3, h4, h5, h6, blockquote, hr, article, section, iframe, img, figure";
const hasContent = ($, el) => $(el).text().trim() !== "" || $(el).find("img, iframe, table, pre, hr").length > 0;
const BR_RUN = /(?:\s*<br\s*\/?>\s*){2,}/gi;
const EDGE_BR = /^(?:\s*<br\s*\/?>)+|(?:<br\s*\/?>\s*)+$/gi;

function normalizeSpacing($) {
  // Non-breaking spaces outside code
  $.root()
    .find("*")
    .addBack()
    .contents()
    .filter((_, n) => n.type === "text" && n.data.includes("\u00a0") && !$(n.parent).closest("pre, code").length)
    .each((_, n) => void (n.data = n.data.replace(/\u00a0/g, " ")));

  // Divs that only hold inline content are paragraphs
  $("div")
    .get()
    .reverse()
    .forEach((el) => {
      if ($(el).hasClass("video-embed") || $(el).closest("pre").length) return;
      if ($(el).find(BLOCKS).length === 0) el.name = "p";
    });

  // <br><br> inside a paragraph splits it; edge <br> are dropped
  $("p")
    .get()
    .forEach((el) => {
      if ($(el).closest("pre").length) return;
      const html = ($(el).html() ?? "").replace(EDGE_BR, "");
      const parts = html.split(BR_RUN).map((x) => x.replace(EDGE_BR, "").trim());
      if (parts.length > 1) $(el).replaceWith(parts.filter(Boolean).map((x) => `<p>${x}</p>`).join(""));
      else $(el).html(html);
    });
  $("li, td, th")
    .get()
    .forEach((el) => void $(el).html(($(el).html() ?? "").replace(EDGE_BR, "").replace(BR_RUN, "<br>")));

  // <br> used as spacing between blocks
  $("br").each((_, el) => {
    const parent = $(el).parent();
    if (parent.is("p, li, td, th, pre, code, h2, h3, h4, h5, h6")) return;
    if (parent.is("div, article, section") || parent.length === 0 || parent[0].type === "root") $(el).remove();
  });

  for (let pass = 0; pass < 3; pass++) {
    $("div, p, li").each((_, el) => {
      if (!hasContent($, el) && !$(el).closest("pre").length) $(el).remove();
    });
  }
}

const plainText = (html) =>
  cheerio.load(html, null, false).root().text().replace(/\s+/g, " ").trim();

function makeExcerpt(entry, html) {
  const meta = decodeEntities(text(entry.metaDescription).trim());
  if (meta) return meta;
  const $ = cheerio.load(html, null, false);
  const leaves = $("p, div, li").filter((_, el) => $(el).find("p, div, li, ul, ol, table, pre, h2, h3, h4").length === 0);
  for (const p of leaves.toArray()) {
    const t = $(p).text().replace(/\s+/g, " ").trim();
    if (t.length >= 40) return t.length > 200 ? `${t.slice(0, 197).replace(/\s+\S*$/, "")}...` : t;
  }
  const all = plainText(html);
  return all.length > 200 ? `${all.slice(0, 197).replace(/\s+\S*$/, "")}...` : all;
}

// Posts

// Blogger exports titles and descriptions entity-encoded, sometimes twice (&amp;amp;)
const decodeEntities = (str) => {
  let cur = str;
  for (let i = 0; i < 4 && cur.includes("&"); i++) {
    const next = decodeHTML(cur);
    if (next === cur) break;
    cur = next;
  }
  return cur;
};

// Posts exported without labels that clearly belong to an existing series
const LABEL_FIXES = { "orthogonality-orthonormal-basis": ["Machine Learning", "Mathematics"] };

// YouTube thumbnails 404 for private or deleted videos; cards then fall back to a topic cover
const thumbCachePath = path.join(root, "content/youtube-thumbs.json");
const thumbCache = existsSync(thumbCachePath) ? JSON.parse(readFileSync(thumbCachePath, "utf8")) : {};
async function thumbAvailable(id) {
  if (id in thumbCache) return thumbCache[id];
  try {
    thumbCache[id] = (await fetch(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`, { method: "HEAD" })).ok;
  } catch {
    thumbCache[id] = true;
  }
  return thumbCache[id];
}

for (const id of new Set(postEntries.flatMap((e) => [...text(e.content).matchAll(/youtube\.com\/embed\/([\w-]{11})/g)].map((m) => m[1])))) {
  await thumbAvailable(id);
}

const stats = { missingImages: new Set(), otherIframes: [], internalLinks: 0, convertedScreenshots: 0, formulas: 0, mathKeysUsed: new Set(), highlighted: 0, removedVideos: 0, removedPrompts: 0 };
if (existsSync(postsDir)) for (const f of readdirSync(postsDir)) rmSync(path.join(postsDir, f));
mkdirSync(postsDir, { recursive: true });

let written = 0;
for (const e of postEntries) {
  const filename = text(e.filename);
  const m = filename.match(/^\/(\d{4})\/(\d{2})\/(.+)\.html$/);
  if (!m) {
    console.warn(`skipped (no filename): ${text(e.title)}`);
    continue;
  }
  const [, year, month, slug] = m;
  const labels = (e.category ?? []).map((c) => c["@_term"]).filter(Boolean);
  if (!labels.length && LABEL_FIXES[slug]) labels.push(...LABEL_FIXES[slug]);
  const { html, headings } = addHeadingIds(cleanHtml(text(e.content), stats, labels));
  const words = plainText(html).split(" ").filter(Boolean).length;
  const youtubeId = html.match(/youtube\.com\/embed\/([\w-]{11})/)?.[1] ?? null;
  const firstImage = html.match(/<img[^>]+src="(\/images\/blog\/[^"]+)"/)?.[1] ?? null;

  const post = {
    id: text(e.id),
    year,
    month,
    slug,
    path: filename,
    title: decodeEntities(text(e.title).trim()) || slug,
    published: text(e.published),
    updated: text(e.updated),
    labels,
    excerpt: makeExcerpt(e, html),
    readingMinutes: Math.max(1, Math.round(words / 220)),
    youtubeId,
    youtubeThumb: youtubeId ? await thumbAvailable(youtubeId) : false,
    coverImage: firstImage,
    headings,
    html,
  };
  writeFileSync(path.join(postsDir, `${year}-${month}-${slug}.json`), JSON.stringify(post));
  written++;
}

// Lessons written for the new site (built by scripts/build-lessons.mjs)

const lessonsDir = path.resolve(workspace, "Content/PythonCourse");
let lessonsWritten = 0;
if (existsSync(lessonsDir)) {
  for (const folder of readdirSync(lessonsDir).sort()) {
    const draft = path.join(lessonsDir, folder, "blog", `${folder}_Draft.html`);
    if (!existsSync(draft)) continue;
    const raw = readFileSync(draft, "utf8");
    const meta = JSON.parse(raw.match(/^<!--\s*([\s\S]*?)\s*-->/)[1]);
    const $ = cheerio.load(raw.replace(/^<!--[\s\S]*?-->\s*/, ""), null, false);
    highlightCode($, stats, meta.labels);
    const { html, headings } = addHeadingIds($.html().trim());
    const words = plainText(html).split(" ").filter(Boolean).length;
    const [year, month] = meta.date.split("-");
    const lesson = {
      id: `native:${meta.slug}`,
      year,
      month,
      slug: meta.slug,
      path: `/courses/${meta.course}/${meta.slug}`,
      title: meta.title,
      published: `${meta.date}T09:00:00.000Z`,
      updated: `${meta.date}T09:00:00.000Z`,
      labels: meta.labels,
      excerpt: meta.excerpt,
      readingMinutes: Math.max(1, Math.round(words / 220)),
      youtubeId: null,
      youtubeThumb: false,
      coverImage: null,
      headings,
      html,
    };
    writeFileSync(path.join(postsDir, `${year}-${month}-${meta.slug}.json`), JSON.stringify(lesson));
    lessonsWritten++;
  }
}

writeFileSync(thumbCachePath, JSON.stringify(thumbCache, null, 1));
console.log(`Posts written: ${written} (+ ${lessonsWritten} native lessons)`);
const noThumb = Object.entries(thumbCache).filter(([, ok]) => !ok).map(([id]) => id);
if (noThumb.length) console.log(`YouTube videos without a thumbnail (private/deleted?): ${noThumb.join(", ")}`);
console.log(`Internal links rewritten: ${stats.internalLinks}`);
console.log(`Screenshots converted to code/output blocks: ${stats.convertedScreenshots}`);
console.log(`Formulas rendered with KaTeX: ${stats.formulas}`);
console.log(`Code blocks syntax-highlighted: ${stats.highlighted}`);
console.log(`Unavailable videos removed: ${stats.removedVideos}; comment/contact prompts removed: ${stats.removedPrompts}`);
const unusedMath = Object.keys(MATH).filter((k) => !stats.mathKeysUsed.has(k));
if (unusedMath.length) console.log(`Math map entries never matched (${unusedMath.length}):`, unusedMath);
console.log(`Images still remote (not downloaded): ${stats.missingImages.size}`);
console.log(`Non-YouTube iframes: ${stats.otherIframes.length}`, [...new Set(stats.otherIframes)].slice(0, 5));
