import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Per-page user-facing content. One JSON file per route, keyed by file name
// (`src/content/pages/<route>.json` → entry id `<route>`). Pages call
// `getEntry("pages", "<route>")` and pass the validated fields to `BaseLayout`,
// so when i18n lands we only need to swap the loader / add a locale dimension
// here — pages stay untouched.
const pages = defineCollection({
    loader: glob({ pattern: "**/*.json", base: "./src/content/pages" }),
    schema: z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        heading: z.string().min(1).optional(),
        noindex: z.boolean().optional().default(false),
        // Links the page offers as shortcuts to other routes (labels are copy,
        // so they live here rather than in the component).
        shortcuts: z
            .array(
                z.object({
                    href: z.string().min(1),
                    label: z.string().min(1),
                }),
            )
            .default([]),
    }),
});

export const collections = { pages };
