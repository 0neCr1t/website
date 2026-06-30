---
name: astro-implement
description: Implement a feature, page, component or change in THIS Astro project following its structure, conventions and best practices. Invoke as `/astro-implement <what to build>` (e.g. "/astro-implement a contact page with a form"). Use whenever adding or modifying anything in this codebase so the result stays consistent with the established stack and style.
argument-hint: what to implement (page, component, content collection, script, fix...)
---

# astro-implement

Implement whatever is described in the invocation **following this project's conventions**.
Do not introduce new patterns, libraries or styles when an existing one fits. When the request
is ambiguous about scope or behaviour, ask before building.

## Stack (do not deviate without being asked)

- **Astro** (latest stable) with TypeScript in `strict` mode (`astro/tsconfigs/strict`).
- **Tailwind CSS v4** via the `@tailwindcss/vite` plugin (no `tailwind.config.js`; theme lives in CSS).
- **astro-icon** for icons. Install the Iconify set you need (`npm i @iconify-json/<set>`) and use
  `<Icon name="set:icon" />`, or place local SVGs in `src/icons/`.
- **animejs** for animations (client-side, from `src/scripts/`).
- **Content Collections + Zod** for any structured/repeated content (`src/content.config.ts`).
- **@astrojs/node** adapter (standalone) for on-demand routes; **@astrojs/sitemap** for the sitemap.

## Rendering: choose static vs SSR per route

`astro.config.mjs` uses `output: "static"` (Astro 5+ model; `hybrid` no longer exists), so **every
route is prerendered at build time by default**.
Decide per page:

- **Static (default):** content known at build time (landing, about, docs, blog posts). Do nothing —
  it is already static. Prefer this; it is faster and cheaper.
- **On-demand / SSR:** depends on the request (auth, form POST handling, per-request data, search).
  Add `export const prerender = false;` at the top of that page or endpoint. The node adapter serves it.

Never flip the whole project to `output: "server"` for one dynamic page — opt that single route out instead.

## Project structure (place files accordingly)

```
src/
├── components/
│   ├── cards/      # small repeated display units
│   ├── sections/   # larger page sections / modals
│   ├── ui/         # base primitives (Button, Modal, Tabs...)
│   └── pages/      # per-page composition components (PageName.astro)
├── content/        # JSON/MD content for collections
├── content.config.ts
├── layouts/        # BaseLayout and any specialised layouts
├── lib/            # framework-agnostic TS helpers (seo.ts, ...)
├── pages/          # routes (.astro / endpoints)
├── scripts/        # client-side TS, entry point is main.ts (imported by BaseLayout)
└── styles/         # global.css (Tailwind import + theme tokens)
```

Conventions to mirror:
- Routes in `src/pages/` stay thin: import a `components/pages/*.astro` component and render it.
- Reuse `ui/` primitives instead of re-styling raw elements. Keep components small and focused.
- All pages render through `BaseLayout` so SEO/OG/JSON-LD stay centralised.

## Styling

- Tailwind utility classes first. Class ordering is handled by `prettier-plugin-tailwindcss` — run the formatter.
- Theme colours come from CSS custom properties in `src/styles/global.css` (`--bg-primary`, `--text-color`,
  light default + `body.dark` overrides). Reference them with Tailwind arbitrary values, e.g.
  `class="bg-(--bg-primary) text-(--text-color)"`. Add new tokens there rather than hard-coding hex values.

## Content

When content is data-like or repeated, model it as a Content Collection: add JSON under `src/content/<name>/`,
define the collection with a Zod schema and a loader in `src/content.config.ts`, and read it with
`getCollection` / `getEntry`. Do not hard-code lists that belong in content.

## SEO

Centralise structured data and site constants in `src/lib/seo.ts`. Pass `title`, `description`, optional
`ogImage`/`ogType`/`noindex`/`jsonLd` into `BaseLayout`. Keep canonical URLs and Open Graph consistent.

## Code style (Prettier — already configured)

4-space indent, double quotes, semicolons, `printWidth` 120, `trailingComma: all`, `arrowParens: avoid`,
`endOfLine: lf`. Comments are concise and explain the *why*, not the *what* — match the surrounding code.

## Definition of done

1. Code follows the structure and conventions above.
2. `npm run format` — apply Prettier (CI runs `format:check`).
3. `npm run build` — must pass (CI builds and runs `npm audit --audit-level=high`).
4. Update `TODO.md` if you resolved or introduced a follow-up.
