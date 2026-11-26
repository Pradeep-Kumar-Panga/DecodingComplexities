// Builds Python course lessons: runs every <run> block, writes the expanded _Draft.html and a notebook.
// Source: Content/PythonCourse/<Lesson>/blog/<Lesson>.src.html
// Usage: node scripts/build-lessons.mjs
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// The folder that holds Content/ and .venv; override when the site lives in a standalone repo.
const repo = path.resolve(process.env.WORKSPACE_ROOT ?? path.join(root, "../.."));
const python = path.join(repo, ".venv/bin/python");
const lessonsDir = path.join(repo, "Content/PythonCourse");
const GITHUB = "https://github.com/Pradeep-Kumar-Panga/DecodingComplexities/blob/main";

const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const attr = (attrs, name) => attrs.match(new RegExp(`${name}="([^"]*)"`))?.[1];
const TOKEN = /<run([^>]*)>\n?([\s\S]*?)<\/run>|<writefile name="([^"]+)"([^>]*)>\n?([\s\S]*?)<\/writefile>/g;

function build(folder) {
  const blogDir = path.join(lessonsDir, folder, "blog");
  const srcPath = path.join(blogDir, `${folder}.src.html`);
  if (!existsSync(srcPath)) return null;
  const src = readFileSync(srcPath, "utf8");

  const meta = JSON.parse(src.match(/^<!--\s*([\s\S]*?)\s*-->/)[1]);
  const body = src.replace(/^<!--[\s\S]*?-->\s*/, "");

  // <run> executes code; <writefile name="x"> creates a file the later blocks can use
  const blocks = [...body.matchAll(TOKEN)].map((m) => {
    if (m[3]) {
      const content = m[5].replace(/\s+$/, "") + "\n";
      return {
        file: { name: m[3], lang: attr(m[4], "lang") ?? "python", content },
        code: `with open(${JSON.stringify(m[3])}, "w") as f:\n    f.write(${JSON.stringify(content)})`,
      };
    }
    return {
      code: m[2].replace(/\s+$/, ""),
      stdin: attr(m[1], "stdin")?.replace(/\\n/g, "\n"),
      error: attr(m[1], "error"),
    };
  });

  let outputs = [];
  if (blocks.length) {
    const result = spawnSync(python, [path.join(root, "scripts/lessons/runner.py")], {
      input: JSON.stringify(blocks),
      encoding: "utf8",
    });
    if (result.status !== 0) {
      console.error(`FAILED ${folder}\n${result.stderr}`);
      process.exitCode = 1;
      return null;
    }
    outputs = JSON.parse(result.stdout);
  }

  let i = 0;
  let html = body.replace(TOKEN, () => {
    const k = i++;
    if (blocks[k].file) {
      const { name, lang, content } = blocks[k].file;
      return `<p><b>${name}</b></p>\n<pre data-role="code" data-lang="${lang}"><code>${escapeHtml(content.replace(/\s+$/, ""))}</code></pre>`;
    }
    const code = `<pre data-role="code" data-lang="python"><code>${escapeHtml(blocks[k].code)}</code></pre>`;
    const out = outputs[k].replace(/\s+$/, "");
    return out ? `${code}\n<pre data-role="output"><code>${escapeHtml(out)}</code></pre>` : code;
  });

  html = html.replace(/<codeblock lang="([^"]*)">\n?([\s\S]*?)<\/codeblock>/g, (_, lang, code) =>
    `<pre data-role="code" data-lang="${lang}"><code>${escapeHtml(code.replace(/\s+$/, ""))}</code></pre>`);

  const notebookPath = `Content/PythonCourse/${folder}/notebook/${folder}.ipynb`;
  const getCode = `<h2>Get the Code</h2>\n<p>Every example in this lesson, with its output, is in a notebook on GitHub: <a href="${GITHUB}/${notebookPath}">${folder}.ipynb</a>.</p>\n`;
  const summaryAt = html.lastIndexOf("<h2>Summary</h2>");
  html = summaryAt >= 0 ? html.slice(0, summaryAt) + getCode + html.slice(summaryAt) : html + getCode;

  const header = `<!-- ${JSON.stringify(meta)} -->\n`;
  writeFileSync(path.join(blogDir, `${folder}_Draft.html`), header + html);

  // Notebook: one markdown cell per heading, one code cell per run block
  const cells = [];
  let n = 0;
  const parts = body.split(/(<h2>[\s\S]*?<\/h2>|<run[\s\S]*?<\/run>|<writefile[\s\S]*?<\/writefile>)/g).filter(Boolean);
  for (const part of parts) {
    if (part.startsWith("<h2>")) {
      cells.push({ cell_type: "markdown", metadata: {}, source: [`## ${part.replace(/<[^>]+>/g, "")}`] });
    } else if (part.startsWith("<run") || part.startsWith("<writefile")) {
      const k = n++;
      const file = blocks[k].file;
      const out = file ? `Writing ${file.name}\n` : outputs[k];
      const code = file ? `%%writefile ${file.name}\n${file.content.replace(/\s+$/, "")}` : blocks[k].code;
      cells.push({
        cell_type: "code",
        execution_count: k + 1,
        metadata: {},
        source: code.split("\n").map((l, idx, a) => (idx < a.length - 1 ? `${l}\n` : l)),
        outputs: out ? [{ output_type: "stream", name: "stdout", text: out.split(/(?<=\n)/) }] : [],
      });
    }
  }
  mkdirSync(path.join(lessonsDir, folder, "notebook"), { recursive: true });
  writeFileSync(
    path.join(lessonsDir, folder, "notebook", `${folder}.ipynb`),
    JSON.stringify({
      cells,
      metadata: { kernelspec: { display_name: "Python 3", language: "python", name: "python3" }, language_info: { name: "python" } },
      nbformat: 4,
      nbformat_minor: 5,
    }, null, 1),
  );
  return { folder, blocks: blocks.length, words: body.replace(TOKEN, "").replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length };
}

if (!existsSync(lessonsDir)) {
  console.log("No lessons found");
} else {
  const only = process.argv[2];
  for (const folder of readdirSync(lessonsDir).sort()) {
    if (only && folder !== only) continue;
    const r = build(folder);
    if (r) console.log(`${r.folder}: ${r.blocks} runnable blocks, ~${r.words} words of prose`);
  }
}
