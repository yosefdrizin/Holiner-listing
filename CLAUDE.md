# Holiner Tools — Project Context

## What this is
A small collection of **self-contained static web tools** for **Holiner Commercial Real Estate**,
hosted on GitHub Pages. The repo is structured as a **home hub plus one file per tool**:

- **[index.html](index.html)** — the "Holiner Tools" **home page / hub**. A simple branded landing
  page with a grid of tool cards that link out to each tool.
- **[listing-agreement.html](listing-agreement.html)** — the first tool: the ~1MB listing-agreement
  generator (document preview + Word `.docx` export). This was the original app.
- Each additional tool is its own **self-contained `.html` file** in the repo root.

GitHub Pages serves every file directly (e.g. `/listing-agreement.html`), so each tool has its own URL.

## Adding a new tool
1. Create a new **self-contained** `.html` file in the repo root (all assets inline — see rule below).
2. Add a tool **card** to the grid in `index.html`. There's a comment in that file showing how: copy an
   `<a class="card">` block, set `href` to the new file, and update the badge letter, title, and
   description.
3. Commit and push — GitHub Pages auto-serves the new file and the updated home page.

## Architecture rule — applies to every tool file
Each tool `.html` must be **fully self-contained**: the app, fonts, and any libraries are **ALL inline**.
For `listing-agreement.html` specifically, the agreement-template code — `renderPreviewHtml` (the
document preview) and `buildDocxBlob` (the Word download) — is loaded at runtime via
**`window.AgreementTemplate`**, registered by a bundled inline script.

- **Never split code out into an external file (e.g. `./agreement-template.js`) and never reference one.**
  It will **404** and break the tool. (This already happened once: the listing page rendered blank and
  the Word download did nothing. The fix was restoring the fully-inline build.)
- **No external dependencies that could 404** — embed fonts/CSS/JS inline. (e.g. the home page embeds the
  Albert Sans brand font as a base64 `data:` URI rather than loading it from a CDN.)

## Brand
Cream background `#EDECE2`, green accent `#78A167`, tan `#AFA183`, black text, **Albert Sans** font.

## Hosting & deploy
- Hosted on **GitHub Pages**, served from the **`main`** branch.
- It **auto-deploys on every push** to `main`.
- To deploy a change: **commit and push to `main`.** That's the whole deploy process.

## Working agreements
- **Always show the diff and wait for approval before committing.** Do not commit without a go-ahead.
- This is a **live production tool used with clients.** Keep every edit **minimal and surgical.**
- **Do not refactor, reorganize, or "clean up" anything unless explicitly asked.**
