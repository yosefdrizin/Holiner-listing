# Holiner Tools — Project Context

## What this is
A collection of **self-contained static web tools** for **Holiner Commercial Real Estate**, hosted on
GitHub Pages, organized in a **two-level structure**:

- **[index.html](index.html)** — the **home hub**. Shows four representation categories as cards:
  **Tenant Rep, Landlord Rep, Buyer Rep, Seller Rep.** Each rep links to its own category page.
  (Reps without a page yet show a "Coming soon" tag and are non-clickable.)
- **Category pages** — one per rep (e.g. **[landlord-rep.html](landlord-rep.html)**). Each shows that
  rep's tools as cards and has a "← Back to Holiner Tools" link.
- **Tool pages** — one self-contained `.html` file per tool (e.g.
  **[listing-agreement.html](listing-agreement.html)**, the listing-agreement generator with document
  preview + Word `.docx` export, linked from Landlord Rep's "Agreements" card).

GitHub Pages serves every file directly, so each page/tool has its own URL.

## File naming convention
- **Category (rep) pages:** `{rep}-rep.html` — e.g. `landlord-rep.html`, `tenant-rep.html`.
- **Tool pages:** `{rep}-{tool}.html` — e.g. `landlord-loi.html`, `landlord-building.html`.
- **Exception:** the existing **`listing-agreement.html`** keeps its original name.

## Adding a rep page or tool
1. Create a new **self-contained** `.html` file in the repo root, named per the convention above
   (all assets inline — see rule below). Reuse the shared header/branding and card markup.
2. Wire it up by turning the matching "Coming soon" card into a link — on the home page (for a rep page)
   or on the rep's category page (for a tool). Each file has a comment showing exactly how.
3. Commit and push — GitHub Pages auto-serves the new file and the updated cards.

## Architecture rule — applies to every file
Each `.html` must be **fully self-contained**: app, fonts, CSS, and any libraries are **ALL inline**.
For `listing-agreement.html`, the agreement-template code — `renderPreviewHtml` (preview) and
`buildDocxBlob` (Word download) — is loaded at runtime via **`window.AgreementTemplate`**, registered by
a bundled inline script.

- **Never split code out into an external file (e.g. `./agreement-template.js`) and never reference one.**
  It will **404** and break the tool. (This already happened once: the listing page rendered blank and
  the Word download did nothing. The fix was restoring the fully-inline build.)
- **No external dependencies that could 404** — embed fonts/CSS/JS inline. (The hub and category pages
  embed the Albert Sans brand font as a base64 `data:` URI rather than loading it from a CDN.)

## Brand
Cream background `#EDECE2`, green accent `#78A167`, tan `#AFA183`, black text, **Albert Sans** font.
Card look: tan border that turns green and lifts on hover; "Coming soon" cards are muted (tan badge +
pill) and non-clickable.

## Hosting & deploy
- Hosted on **GitHub Pages**, served from the **`main`** branch.
- It **auto-deploys on every push** to `main`.
- To deploy a change: **commit and push to `main`.** That's the whole deploy process.

## Working agreements
- **Always show the diff and wait for approval before committing.** Do not commit without a go-ahead.
- This is a **live production tool used with clients.** Keep every edit **minimal and surgical.**
- **Do not refactor, reorganize, or "clean up" anything unless explicitly asked.**
