# Sarza AI website

Static marketing site for Sarza AI. No build step — plain HTML/CSS/JS deployed on Vercel.

## Structure

| File | Purpose |
|------|---------|
| `index.html` | Home page (`/`) |
| `services.html` | Services page (`/services`) |
| `contact.html` | Contact / book-a-call page (`/contact`) |
| `404.html` | Not-found page |
| `styles.css` | Shared stylesheet (cached across pages) |
| `app.js` | Mobile nav toggle + contact form handling |
| `favicon.svg` | Site icon |
| `site.webmanifest` | PWA / mobile metadata |
| `robots.txt` | Crawl rules (explicitly allows AI crawlers) |
| `sitemap.xml` | URL list for search engines |
| `llms.txt` | Plain-text business summary for AI assistants |
| `vercel.json` | Clean URLs + security/cache headers |

Clean URLs are enabled via `vercel.json`, so `services.html` serves at `/services`.

## What to finish (manual steps)

1. **Contact form → real leads.** Out of the box the form opens a pre-filled email to
   `hello@sarzaai.com`. To capture submissions automatically, create a free endpoint at
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
5. **(Optional) Self-host images & add analytics.** Images currently load from Unsplash's CDN.
   For full control, download and serve them from the repo. Add privacy-friendly analytics
   (e.g. Plausible, Fathom) if you want traffic data.
6. **Email consistency.** The site uses `hello@sarzaai.com` while the domain is `sarza.ai`.
   Confirm that's intentional, or align them.

## SEO / AI-SEO included

- Unique `<title>` + meta description + canonical per page
- Open Graph + Twitter cards (rich link previews)
- JSON-LD: Organization, WebSite, OfferCatalog/Service, FAQPage, ContactPage, BreadcrumbList
- `robots.txt` allowing GPTBot, ClaudeBot, PerplexityBot, Google-Extended, etc.
- `sitemap.xml` and `llms.txt`
- One `<h1>` per page, semantic headings, alt text on all images
- Accessible: skip link, focus styles, ARIA labels, real links, labelled form fields
- Performance: shared cached CSS/JS, lazy images with dimensions, hero image preload
