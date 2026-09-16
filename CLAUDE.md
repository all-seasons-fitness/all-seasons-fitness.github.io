# CLAUDE.md — All Seasons Fitness Website

Business website for All Seasons Fitness, a group strength & conditioning gym in Edmonds and Mountlake Terrace, WA. Coaches: Brittany (owner/founder) and Kristina.

---

## Stack

- **Framework:** Jekyll 3.10 (via `github-pages` gem)
- **Theme:** `jekyll-theme-cayman` 0.2.0 (heavily customized via `_layouts/default.html`)
- **CSS:** Bootstrap + custom SCSS at `assets/css/style.scss`
- **Fonts:** Open Sans (body), Signika (headings) via Google Fonts
- **Analytics:** Google Analytics (GA4, tag `G-MDN18LXJYB`)
- **Booking:** PushPress (`allseasonsfitness.pushpress.com`)
- **Email list:** Mailchimp
- **Deployment:** GitHub Pages (pushes to `main` deploy automatically)

---

## Local Development

```bash
bundle exec jekyll serve
```

Visit `http://localhost:4000`. Note: `_config.yml` is not hot-reloaded — restart the server after changing it.

To build without serving:
```bash
bundle exec jekyll build
```

---

## Directory Structure

```
/
├── _config.yml           # Site-wide config (title, URL, plugins, sass, defaults)
├── _layouts/
│   └── default.html      # Single layout used by all pages; contains nav, header, footer,
│                         # Google Analytics, and LocalBusiness JSON-LD structured data
├── _includes/
│   ├── nav.html          # Top navigation bar
│   ├── head-custom.html  # Extra <head> tags (favicon, custom CSS links)
│   └── js.html           # Footer scripts
├── _data/
│   └── navigation.yml    # Nav link list (drives nav.html)
├── assets/
│   ├── css/
│   │   ├── style.scss    # Primary custom styles (compiled by Jekyll)
│   │   └── bootstrap.min.css
│   └── images/           # All site images (.webp preferred, .jpg/.png fallbacks)
├── index.md              # Home page (short_name: home → triggers hero header layout)
├── schedule.md           # Class schedule (Markdown table)
├── workouts.md           # Classes/workouts detail page
├── coaches.md            # Coaches bios (Brittany + Kristina)
├── memberships.md        # Pricing and membership options
├── first-class.md        # What to expect / first class info
├── reviews.md            # Member testimonials
├── faq.md                # FAQ page
├── 404.md                # Custom 404 page
├── CNAME                 # Custom domain: all-seasons-fitness.com
├── Gemfile               # Ruby dependencies
└── .ruby-version         # Ruby version pin
```

---

## Page Front Matter

Every page uses `layout: default`. Key front matter fields:

| Field | Purpose |
|---|---|
| `title` | Page title (fallback for `html_title` and `band_title`) |
| `html_title` | Full `<title>` tag string (SEO-optimized) |
| `description` | Meta description |
| `band_title` | Text shown in the page-band header (non-home pages) |
| `short_name` | Used for `body` class (`page-<short_name>`) and home page detection |
| `permalink` | Output URL (e.g., `/schedule.html`) |

The home page uses `short_name: home` which triggers the hero header (with tagline + CTA). All other pages get the `page-band` header.

---

## Schedule — Important: Two Places to Update

When schedule times change, update **both**:

1. **`schedule.md`** — the visible Markdown table
2. **`_layouts/default.html`** — the `openingHoursSpecification` array in the JSON-LD structured data block (used by Google for local search)

Current schedule (as of update):
- Monday: 10am (Brittany), 5:30pm (Kristina)
- Wednesday: 10am (Kristina), 5:30pm (Brittany)
- Friday: 6am (Brittany), 10am (Brittany)
- Saturday: 8am (Brittany/Kristina), 9:15am (Brittany/Kristina)
- Sunday: 9:15am (Brittany/Kristina)

---

## Images

- Prefer `.webp` format for performance; `.jpg`/`.png` originals kept alongside as fallbacks
- All images live in `assets/images/`
- Use `loading="lazy"` on all non-hero images
- Include descriptive `alt` text on every image

---

## Navigation

Edit `_data/navigation.yml` to add/remove/reorder nav links. Links with `cta: true` render as a button. Links with `external: true` open in a new tab.

---

## Deployment

Push to `main` → GitHub Pages builds and deploys automatically (usually within ~1 minute). The live domain is `all-seasons-fitness.com` (set via `CNAME`).

---

## Key External Links

- Booking/calendar: `https://allseasonsfitness.pushpress.com/landing/calendar`
- Free class signup: `https://allseasonsfitness.pushpress.com/landing/plans/plan_d52a452e820d40/login`
- Facebook community: `https://www.facebook.com/groups/721088668952518/`
- Mailchimp list: `https://all-seasons-fitness.us3.list-manage.com/subscribe/post?u=af30da5a7004758f9b2a0a65c&id=caad5066fd`

---

## Gotchas

- `_config.yml` changes require a server restart during local dev.
- `CLAUDE.md` is excluded from Jekyll processing (it's in the root and not a `.md` page with front matter, so Jekyll ignores it).
- The `_posts/` directory contains a sample Jekyll post — it is unused and does not appear on the site.
- Bootstrap CSS is served as a local file (`assets/css/bootstrap.min.css`), not from a CDN.
- The site has no JavaScript framework — all interactivity is minimal and done inline or via included scripts.
