# TODO

Pending setup tasks for this fresh template. Delete each line once done.

## Follow-ups

- [ ] `/prueba-graph` is a throwaway demo of `NetworkDiagram` — remove it (page + `components/pages/PruebaGraph.astro`) once the diagram is integrated into a real page.
- [ ] The site is dark-themed by default via a hardcoded `dark` class on `<body>` (`BaseLayout.astro`) — replace with a proper theme toggle when one lands.

## Assets (not shipped with the template — create these)

- [ ] `public/imgs/favicon/favicon.ico`
- [ ] `public/imgs/favicon/favicon.png`
- [ ] `public/imgs/favicon/og-image.png` (Open Graph / Twitter card image)

## Configuration

- [ ] Set the real production URL in `astro.config.mjs` (`site`) and in `src/lib/seo.ts` (`SITE_URL`).
- [ ] Update the `Sitemap:` line in `public/robots.txt` with the production domain.
- [ ] Fill in `README.md`.

## Code

- [ ] Implement the home page (`src/pages/index.astro`).
- [ ] Implement the 404 page (`src/pages/404.astro`).
- [ ] Flesh out the SEO helpers (`src/lib/seo.ts`).
- [ ] Define your content collections (`src/content.config.ts`).
- [ ] Wire up client scripts (`src/scripts/main.ts`).

## Icons (when you need them)

`astro-icon` is installed but ships no icon data. For each Iconify set you use,
install its package, e.g. `npm i @iconify-json/bi`, then `<Icon name="bi:github" />`.
Alternatively drop local SVGs into `src/icons/` and use `<Icon name="my-icon" />`.
