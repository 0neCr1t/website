import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";

// Astro rendering model (Astro 5+, no more `hybrid`):
//   - `output: "static"` (default): every route is prerendered at build time.
//     Opt a single route INTO on-demand/SSR with `export const prerender = false`.
//   - `output: "server"`: every route is server-rendered; opt a route OUT with
//     `export const prerender = true`.
// We keep "static" so the site is fast by default and only the routes that need
// it become dynamic. The node adapter is what makes those on-demand routes work.
export default defineConfig({
    // TODO: set the production URL (used for canonical URLs and the sitemap).
    site: "https://example.com",
    output: "static",
    adapter: node({
        mode: "standalone",
    }),
    integrations: [
        icon(),
        sitemap({
            filter: page => !page.endsWith("/404/"),
        }),
    ],
    vite: {
        plugins: [tailwindcss()],
    },
});
