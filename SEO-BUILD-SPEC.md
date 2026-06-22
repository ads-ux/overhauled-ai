# Overhauled.ai — Local Lead-Gen Site Build Spec

**Purpose:** Paste this whole document into the AI when generating a new Guelph-style local site (or fixing an existing one). Every rule here exists because Ahrefs flagged a real issue on a live site. Follow it exactly and the site ships SEO-clean with zero of the recurring errors (long titles, missing/long metas, canonical mismatches, orphan pages, missing OG/Twitter, oversized images).

Treat the **Non-negotiables** as hard requirements and run the **Pre-publish QA checklist** before committing.

---

## 0. The recurring problems this spec eliminates

| Past Ahrefs error | Root cause | Rule that fixes it |
|---|---|---|
| Title too long | Title + brand suffix > 60 chars | §2 Titles |
| Meta description too long / too short / missing | Templated meta over 160, or empty on privacy/blog | §3 Meta descriptions |
| Canonical URL has no incoming internal links | Canonical used `.html`, links used clean URLs | §4 URLs & canonicals |
| Indexable page not in sitemap | Blog posts / city pages omitted from sitemap | §5 Sitemap |
| Open Graph / Twitter card missing | Tags only on homepage | §6 Social tags |
| Image file size too large | Full-res PNG photos (1–2 MB) | §7 Images |
| Structured data validation error | Malformed JSON-LD | §8 Structured data |

---

## 1. Non-negotiables (every page, no exceptions)

Every HTML page MUST contain, in `<head>`:

1. `<meta charset="utf-8">` and `<meta name="viewport" content="width=device-width, initial-scale=1">`
2. A `<title>` ≤ **60 characters** (see §2)
3. A `<meta name="description">` of **120–155 characters** (see §3) — **never empty, never missing**, on *every* page including privacy, contact, blog index, and 404
4. A `<link rel="canonical">` in **clean (extensionless) absolute** form (see §4)
5. Open Graph tags **and** Twitter Card tags (see §6)
6. Exactly **one `<h1>`** in the body

Every page MUST be reachable by at least one internal link (no orphans — see §4).

---

## 2. Titles (≤ 60 characters)

Count characters; if over 60, shorten. Drop the brand suffix before truncating the keyword.

- **Homepage:** `[Primary service] in [City] | [domain]` — e.g. `Garage Door Repair & Installation in Guelph` (drop the domain if needed to fit 60).
- **City pages:** `[Service] in [City], ON` — **no** `| [Brand]` suffix (that suffix is what pushed these over 60).
- **Blog index:** `[Service] Tips & Guides for [City] Homeowners` — no brand suffix.
- **Blog posts:** the question/topic only, no brand suffix — e.g. `How Much Does Appliance Repair Cost in Guelph?`
- **Contact / Privacy:** `Contact [Brand]` / `Privacy Policy | [Brand]` (these are naturally short).

Rule of thumb: the locality keyword goes in the title; the brand does **not** need to be in `<title>` (it's in OG and the logo). Brand suffix only if the whole title still fits ≤ 60.

---

## 3. Meta descriptions (120–155 characters, on every page)

- Target **120–155 characters**. Never exceed 160. Never under ~110. Never empty.
- Include the service + city + a call to action.
- **Every** page needs its own: homepage, each city page, blog index, **each blog post**, contact, privacy, 404.
- City-page descriptions must be written per city and kept ≤155 — do **not** reuse one long templated sentence that tips over 160 once the city name is inserted.

Examples (length in parens):
- Contact: `Contact [Brand] for fast [service] in [City]. Call [phone] or request a free quote online.` (~110–140)
- Privacy: `Privacy policy for [Brand] — how we collect, use, and protect the information you provide when contacting us or using our website.` (~130)

---

## 4. URLs, canonicals & internal linking (the canonical-mismatch killer)

The site is served on Netlify with **pretty/extensionless URLs** (`/blog`, `/contact`, `/junk-removal-cambridge`). Everything must agree on that one form:

- **Internal links:** always link the clean form — `href="/blog"`, not `href="/blog.html"`. Homepage = `/`.
- **Canonical:** must be the **absolute clean** URL and must match the link form exactly:
  - Page `blog.html` → `<link rel="canonical" href="https://[domain]/blog">`
  - Page `junk-removal-cambridge.html` → `…/junk-removal-cambridge`
  - Homepage → `https://[domain]/`
  - **Never** put `.html` in a canonical.
- **og:url** must equal the canonical.
- **No orphan pages:** every generated page must be linked from somewhere crawlable:
  - The **blog index lists and links every blog post.**
  - City pages are linked from the homepage (an "Areas we serve" list) and/or footer.
  - The footer/nav is identical on every page and links Home, Services, Blog, Contact.

---

## 5. sitemap.xml

- Include **every indexable page** — homepage, all city pages, blog index, **all blog posts**, contact, privacy. (Exclude 404 and thank-you.)
- Use the **clean URL form** (no `.html`), absolute.
- Reference it in `robots.txt`: `Sitemap: https://[domain]/sitemap.xml`.

Template:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://[domain]/</loc></url>
  <url><loc>https://[domain]/blog</loc></url>
  <url><loc>https://[domain]/contact</loc></url>
  <url><loc>https://[domain]/privacy</loc></url>
  <!-- one <url> per city page and per blog post, clean URLs -->
</urlset>
```

---

## 6. Social tags (Open Graph + Twitter) — on EVERY page

Build from that page's own title and description. Image = the site's cover image (WebP).

```html
<meta property="og:type" content="website">
<meta property="og:url" content="https://[domain]/[clean-path]">
<meta property="og:title" content="[page title]">
<meta property="og:description" content="[page meta description]">
<meta property="og:image" content="https://[domain]/images/cover.webp">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="[page title]">
<meta name="twitter:description" content="[page meta description]">
<meta name="twitter:image" content="https://[domain]/images/cover.webp">
```

---

## 7. Images (the "file size too large" killer)

- **Format:** WebP for all photos (not PNG). PNG only for logos/transparency, and keep small.
- **Dimensions:** heroes ≤ ~1600px wide (1100–1200 is plenty); thumbnails sized to display. Never ship a 1408×768 photo as a 2 MB PNG.
- **File size:** **every image ≤ 100 KB.** Heroes target 80–98 KB at WebP quality ~70–80; cards 50–80 KB.
- Add `width` and `height` attributes, descriptive `alt` text (with city/service), and `loading="lazy"` on below-the-fold images.
- Reference images by their real path/format in HTML, OG, and Twitter (`cover.webp`, not `cover.png`).

Optimization recipe (Python/Pillow): resize to target width, save as WebP, step quality down from 80 until ≤95 KB.

---

## 8. Structured data (JSON-LD)

- Homepage: one valid `LocalBusiness` (or specific subtype) block. Validate against schema.org — no missing required fields, no trailing commas, correct types. (A malformed block triggered Ahrefs' "schema.org validation error.")
- Blog posts: optional `BlogPosting` with `headline`, `datePublished`, `author`, `publisher`. Keep `headline` ≤ 110 chars and matching the visible title.

---

## 9. netlify.toml (baseline for every site)

```toml
[build]
publish = "."

# Pretty URLs are handled by Netlify automatically (serves /blog from blog.html).
# Redirect the bare .netlify.app domain to the primary domain:
[[redirects]]
from = "https://[site]-netlify-name.netlify.app/*"
to = "https://[domain]/:splat"
status = 301
force = true

[[headers]]
for = "/*"
[headers.values]
X-Frame-Options = "DENY"
X-Content-Type-Options = "nosniff"
Referrer-Policy = "strict-origin-when-cross-origin"
```

**Deployment:** connect the site to its GitHub repo for **continuous deployment** (do NOT use one-off "Netlify Drop" — those don't auto-update from commits and silently go stale). Branch `main`, publish `.`.

---

## 10. Gold-standard `<head>` template (copy for every page)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <title>{{TITLE ≤60 chars}}</title>
  <meta name="description" content="{{DESCRIPTION 120–155 chars}}">
  <link rel="canonical" href="https://{{domain}}/{{clean-path}}">

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://{{domain}}/{{clean-path}}">
  <meta property="og:title" content="{{TITLE}}">
  <meta property="og:description" content="{{DESCRIPTION}}">
  <meta property="og:image" content="https://{{domain}}/images/cover.webp">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{{TITLE}}">
  <meta name="twitter:description" content="{{DESCRIPTION}}">
  <meta name="twitter:image" content="https://{{domain}}/images/cover.webp">

  <link rel="icon" href="/images/favicon.ico">
  <link rel="stylesheet" href="/css/style.css">
  <!-- Homepage only: one valid LocalBusiness JSON-LD block -->
</head>
```

---

## 11. Pre-publish QA checklist (run before every commit)

- [ ] Every page `<title>` ≤ 60 chars
- [ ] Every page has a `<meta name="description">` between 120–155 chars (incl. privacy, contact, blog, 404)
- [ ] Every canonical is absolute, clean (no `.html`), and equals og:url
- [ ] Every internal link uses the clean URL form
- [ ] Blog index links to **every** blog post; every city page linked from home/footer (no orphans)
- [ ] sitemap.xml lists every indexable page in clean form; robots.txt points to it
- [ ] OG + Twitter tags present on **every** page
- [ ] Every image is WebP and ≤ 100 KB, with alt text and width/height
- [ ] Homepage JSON-LD validates (schema.org)
- [ ] Site is connected to GitHub continuous deployment (not Netlify Drop)

A 2-minute automated check (run against the live site or repo): fetch each page, assert `title.length<=60`, `150>=metaDescLength>=110`, canonical has no `.html`, `og:title`/`twitter:card` present, and each image response ≤ 100 KB.
