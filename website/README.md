# Decoding Complexities website

Source for [pradeeppanga.com](https://www.pradeeppanga.com): machine learning, math, Python and IBM i posts.
Built with Next.js (App Router, Tailwind v4) and deployed to Cloudflare Workers with OpenNext.

## Run it

```bash
npm ci
npm run dev        # http://localhost:3000
npm run build      # production build, all pages are prerendered
npm run preview    # build and run in the Cloudflare Workers runtime
npm run deploy     # build and deploy with Wrangler
```

Needs Node.js 20 or newer.

## How content works

- Posts are files in `content/posts/*.json`. The site reads them at build time and every page is prerendered, so there is no database.
- `content/popularity.json` holds Search Console clicks per URL and drives the "Most read" lists.
- Courses, learning paths and reference hubs are configured in `src/lib/courses.ts`, `src/lib/paths.ts` and `src/lib/hubs.ts`.
- Sections (ML & Math, Python, IBM i) come from post labels in `src/lib/sections.ts`.

## Regenerating content

These scripts are authoring tools that run against a local workspace which holds the Blogger export and the lesson sources. They are not needed to build or deploy the site.

```bash
WORKSPACE_ROOT=/path/to/workspace node scripts/build-lessons.mjs     # run lesson code, write drafts and notebooks
WORKSPACE_ROOT=/path/to/workspace node scripts/migrate-blogger.mjs   # rebuild content/posts/*.json
```

`migrate-blogger.mjs` rewrites all of `content/posts`, so run it only from a workspace that has the Blogger export in `Blogger/Blogs/Decoding Complexities/feed.atom`.

## Companion code

Notebooks and scripts that the posts link to live in the repository root under `Content/` and `Projects/`.
