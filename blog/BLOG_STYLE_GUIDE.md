# sarza.ai blog: structure and voice

Reference for writing any new blog post (manual or automated). Model new posts after `blog/top-github-repos-this-week.html` for exact HTML structure (head, header, nav, article-wrap, breadcrumbs, article-head, article-feature, article-body, footer, scripts).

## Voice

- Direct, no hype, business-focused. Written for company decision-makers, not developers.
- No dashes or hyphens used as punctuation in prose. Replace with commas, spaces, or periods.

## Required elements

- Published date: today's date, YYYY-MM-DD.
- Canonical URL: `https://sarza.ai/blog/[slug]`.
- Scene image: alternate between `/assets/scene-a.svg`, `/assets/scene-b.svg`, `/assets/scene-c.svg`, whichever wasn't used most recently.
- CTA block near the end links to `/ai-assessment` with text "Take the AI Assessment".
- "Keep reading" link at the bottom points to whatever post is currently first in `blog.html`'s `.post-grid` (the most recent prior post), using that post's real title. Do not hardcode a specific past post.
- `styles.css?v=` and `app.js?v=` numbers must match whatever is currently live on `index.html`, not a fixed number from a template.

## Publishing checklist

1. Write the post HTML in `blog/[slug].html`.
2. Add a `<a class="post-row">` entry at the TOP of `.post-grid` in `blog.html`, plus a matching `BlogPosting` entry at the top of the JSON-LD `blogPost` array.
3. Add a `<url>` entry to `sitemap.xml` (today's date, `changefreq: weekly`, `priority: 0.7`).
4. Commit and push all three files together.
5. Verify: poll the live URL until it 200s and shows the new title, don't consider the post published until this passes.
