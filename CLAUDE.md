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

**Do not push directly to `main`.** Open a pull request instead:

1. Branch, commit, open a PR.
2. `.github/workflows/build.yml` runs `bundle exec jekyll build` + html-proofer.
   A failed build means the change would silently never appear on the live site
   — GitHub Pages refuses to deploy a broken build and leaves the last good
   version up, so breakage looks like "nothing happened".
3. Review the preview URL on the PR (see below).
4. Merge → deploys to production.

### Preview

**https://staging.all-seasons-fitness.brittanyjelani.com**

Every pull request build is published there automatically — no local server needed.
Sign in with Google; access is limited to Drew and Brittany via Cloudflare Access.

It always shows the **most recent** PR build. With two PRs open at once the later
build wins, so check the PR's job log for that build's own permanent
`<hash>.all-seasons-preview.pages.dev` URL if you need to be sure which is which.

The staging site is a separate Cloudflare Pages project (`all-seasons-preview`) on a
different domain. It has no connection to `all-seasons-fitness.com`, whose DNS is not
in this Cloudflare account — nothing published to staging can reach production.

Reviewing locally instead requires `bundle exec jekyll serve` and Ruby 3.4.1
(see Local Development).

Rollback is `git revert` + push; GitHub Pages has no one-click rollback.

### What CI checks

`.github/workflows/build.yml` runs on every PR and **blocks the merge** on:

- `bundle exec jekyll build` (Ruby 3.4.1, `JEKYLL_ENV=production`, `PAGES_REPO_NWO` set --
  GitHub Pages injects that itself, a plain runner does not)
- `test/site_test.rb` -- homepage identity, every root `.md` declaring a permalink or being
  excluded, `/index.css` existing, page metadata, JSON-LD validity, and agreement between the
  schedule table and its structured data
- `html-proofer` over `_site` (internal links, images, scripts)

A separate non-blocking `visual` job builds the base branch and the PR, screenshots eight pages
at two widths, and diffs them. Artifacts land under `visual-diff`. Nothing is committed as a
baseline -- the comparison is against the base branch rendered in the same run.

`.github/workflows/canary.yml` runs every 15 minutes against the **live** site and opens a
labelled issue on failure. It is the only check that looks at what is served rather than what is
merged, so it also catches breakage that never went through CI.

The `staged_deploy` ruleset on `main` requires a PR and a passing `build`. `visual` is
deliberately not required.

### Preview-URL gotcha

`_config.yml` hardcodes `url: https://all-seasons-fitness.com`, which feeds the
canonical tag and the LocalBusiness JSON-LD in `_layouts/default.html`. A preview
build served from a different hostname will still emit production URLs there.
That is *desirable* for SEO — the canonical points at production, so the preview
will not compete for search rankings — but it means **any absolute link you click
in a preview navigates you to the live site**. Verify content on the preview;
distrust absolute links.

---

## Key External Links

- Booking/calendar: `https://allseasonsfitness.pushpress.com/landing/calendar`
- Free class signup: `https://allseasonsfitness.pushpress.com/landing/plans/plan_d52a452e820d40/login`
- Facebook community: `https://www.facebook.com/groups/721088668952518/`
- Mailchimp list: `https://all-seasons-fitness.us3.list-manage.com/subscribe/post?u=af30da5a7004758f9b2a0a65c&id=caad5066fd`

---

## Gotchas

- `_config.yml` changes require a server restart during local dev.
- **Every page needs an explicit `permalink` in its front matter.** `index.md` uses
  `permalink: /`; every other page names its own (`/schedule.html`, etc.).
  **Do not add a `permalink:` default back to `_config.yml`.** A site-wide
  `permalink: ""` makes every page claim the site root, so any root-level `.md`
  without front matter silently becomes the homepage — which is what `CLAUDE.md`
  did to the live site on 2026-09-17. The default was removed; CI now asserts that
  `_site/index.html` is the real homepage, because that failure builds green.
- `CLAUDE.md` and `README.md` are in `exclude:` so they are not built at all. Add any
  new root-level repo docs there too.
- `_posts/` is empty. It previously held Jekyll's scaffold "Welcome to Jekyll!" post,
  which **was** publicly reachable on the live site (with BlogPosting structured data
  attributing it to the business) despite an earlier note here claiming otherwise.
  Removed 2026-09-17. There is no blog; adding a file here publishes it.
- Bootstrap CSS is served as a local file (`assets/css/bootstrap.min.css`), not from a CDN.
- The site has no JavaScript framework — all interactivity is minimal and done inline or via included scripts.
