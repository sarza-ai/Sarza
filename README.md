# Sarza AI website

Static marketing site for Sarza AI. No build step — plain HTML/CSS/JS deployed on Vercel.

## Structure

| File | Purpose |
|------|---------|
| `index.html` | Home page (`/`) |
| `services.html` | Services page (`/services`) |
| `contact.html` | Contact / book-a-call page (`/contact`) |
| `blog.html` | Blog index (`/blog`) |
| `blog/*.html` | Individual blog posts (`/blog/<slug>`) |
| `404.html` | Not-found page |
| `styles.css` | Shared stylesheet (cached across pages) |
| `app.js` | Mobile nav toggle + contact form handling |
| `assets/scene-*.svg` | Futuristic-desert background art (3 variants) |
| `assets/og.png` | Social-share image (1200×630), rasterized from `scene-a` |
| `assets/generate-art.js` | Regenerates the scene SVGs |
| `favicon.svg` | Site icon |
| `site.webmanifest` | PWA / mobile metadata |
| `robots.txt` | Crawl rules (explicitly allows AI crawlers) |
| `sitemap.xml` | URL list for search engines |
| `llms.txt` | Plain-text business summary for AI assistants |
| `vercel.json` | Clean URLs + security/cache headers |

Clean URLs are enabled via `vercel.json`, so `services.html` serves at `/services`.

### Imagery

The site uses custom "desert high-tech futuristic" SVG art (a synthwave retro sun, perspective
tech grid, starfield, and dune horizon) instead of stock photos — lightweight (~7 KB each),
fully on-brand, and consistent. Edit the palette/sun positions in `assets/generate-art.js`
and run `node assets/generate-art.js` to regenerate the scene SVGs
(`scene-a/b/c/d/e.svg` plus the wide `scene-night.svg` panorama used as
the home-page band). To refresh the social
image after a change: `npx sharp-cli -i assets/scene-a.svg -o <dir> -f png resize 1200 630 --fit cover`
and save the result as `assets/og.png`.

## What to finish (manual steps)

1. **Contact form → real leads.** Out of the box the form opens a pre-filled email to
   `hello@sarza.ai`. To capture submissions automatically, create a free endpoint at
   [Formspree](https://formspree.io) and add it to the `<form>` in `contact.html`:
   `data-endpoint="https://formspree.io/f/yourid"`.
2. **Real testimonials.** A commented-out testimonials block is in `index.html`. Replace the
   placeholders with genuine, permission-given client quotes, then uncomment it. Once live,
   add `Review` / `AggregateRating` structured data for star ratings in search/AI results.
3. **Submit to search engines.** Add the domain to
   [Google Search Console](https://search.google.com/search-console) and
   [Bing Webmaster Tools](https://www.bing.com/webmasters), then submit `sitemap.xml`.
4. **Set up a Google Business Profile** and keep the name/email consistent with the site —
   this strengthens the entity signal that AI assistants rely on.
5. **(Optional) Add analytics.** Add privacy-friendly analytics (e.g. Plausible, Fathom)
   if you want traffic data.

## Adding a new blog post

The blog is the single biggest long-term lever for being found by search engines and cited
by AI assistants. To add a post:

1. **Copy an existing post** in `blog/` (e.g. `which-tasks-to-automate-first.html`) to a new
   file named after the URL slug, e.g. `blog/ai-for-real-estate-agents.html` → `/blog/ai-for-real-estate-agents`.
2. **Update**, in the new file: the `<title>`, meta description, `og:`/`twitter:` tags, the
   `canonical` URL, the JSON-LD (`BlogPosting` headline/description/dates/`mainEntityOfPage`
   and the breadcrumb), the visible `<h1>`, the date, and the article body.
3. **Add a card** for it at the top of the `.post-grid` in `blog.html`, and add the post to
   the `blogPost` array in `blog.html`'s JSON-LD.
4. **Add the URL** to `sitemap.xml` and to the "Articles" section of `llms.txt`.

Post ideas with strong buyer intent: industry-specific guides ("AI for [trade/industry]"),
"AI vs hiring", "best AI tools for [task]", and answers to the exact questions prospects ask
on discovery calls. Aim for one genuinely useful, self-contained answer per post — that is
what AI assistants quote.

## SEO / AI-SEO included

- Unique `<title>` + meta description + canonical per page
- Open Graph + Twitter cards (rich link previews)
- JSON-LD: Organization, WebSite, OfferCatalog/Service, FAQPage, ContactPage, BreadcrumbList
- `robots.txt` allowing GPTBot, ClaudeBot, PerplexityBot, Google-Extended, etc.
- `sitemap.xml` and `llms.txt`
- One `<h1>` per page, semantic headings, alt text on all images
- Accessible: skip link, focus styles, ARIA labels, real links, labelled form fields
- Performance: shared cached CSS/JS, lazy images with dimensions, hero image preload
