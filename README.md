# huwmandesign.com

Portfolio site for Huw Maitland-Jones, Senior Product Designer.

Plain HTML/CSS, no build step. Open `index.html` in a browser to preview.

- `index.html` – homepage
- `styles.css` – all styles, with design tokens at the top (from the Figma file)
- `assets/` – images exported from Figma

## Hosting

Hosted on Cloudflare Workers (static assets), deployed automatically from GitHub.

- `main` → huwmandesign.com
- `preview` → Cloudflare preview URL, for checking changes before they go live
- `wrangler.jsonc` – Cloudflare config
- `worker/` – password lock for the Apple Pay case study (page and images).
  The password is the `CASE_STUDY_PASSWORD` secret in Cloudflare, never in this repo.
