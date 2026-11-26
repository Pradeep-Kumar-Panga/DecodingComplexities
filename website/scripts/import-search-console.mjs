// Turns a Search Console "Pages.csv" export into content/popularity.json (path -> clicks, impressions).
// Usage: node scripts/import-search-console.mjs [path/to/Pages.csv]
import { readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const csvPath =
  process.argv[2] ?? path.join(os.homedir(), "Downloads/pradeeppanga.com-Performance-on-Search-2026-11-25/Pages.csv");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
      } else {
        cell += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += c;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

const [, ...rows] = parseCsv(readFileSync(csvPath, "utf8"));
const popularity = {};
for (const [url, clicks, impressions] of rows) {
  if (!url) continue;
  // ?m=1 and ?showComment=... are the same post
  const p = new URL(url).pathname;
  if (!/^\/\d{4}\/\d{2}\/.+\.html$/.test(p)) continue;
  const entry = (popularity[p] ??= { clicks: 0, impressions: 0 });
  entry.clicks += Number(clicks);
  entry.impressions += Number(impressions);
}
writeFileSync(path.join(root, "content/popularity.json"), JSON.stringify(popularity, null, 1));
console.log(`${Object.keys(popularity).length} posts with search data written to content/popularity.json`);
