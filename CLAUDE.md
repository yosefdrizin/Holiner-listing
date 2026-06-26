# Holiner Listing Launchpad — Project Context

## What this is
A single, self-contained **static web app** for **Holiner Commercial Real Estate**, hosted on GitHub
Pages: **[index.html](index.html)** (~1MB). It's the "Holiner Listing Launchpad" — a broker workspace
that opens to a **"Choose a representation"** hub (Tenant / Landlord / Buyer / Seller); each rep leads to
its own set of document tools. All navigation is internal React `view` state inside this one file —
there is no URL routing and no separate pages.

Currently built out: **Landlord Rep** has two working tools — **Lease Listing** (form) and **Exclusive
Agreement** (document preview + Word `.docx` export). Other reps/tools show a "coming soon" toast.

The entire site is this one file. (We briefly had a separate outer hub — an `index.html` of cards plus a
`landlord-rep.html` category page — but it duplicated the app's own built-in hub and caused a confusing
loop back to a second "Choose a representation" screen, so it was removed in favor of the app being the
single entry point. `listing-agreement.html` was an identical copy of the app and was also removed.)

## Architecture rule
`index.html` is **fully bundled and self-contained**: app, fonts, CSS, and the agreement-template code
are **ALL inline**. The agreement-template code — `renderPreviewHtml` (preview) and `buildDocxBlob` (Word
download) — is loaded at runtime via **`window.AgreementTemplate`**, registered by a bundled inline script.

- **Never split code out into an external file (e.g. `./agreement-template.js`) and never reference one.**
  It will **404** and break the tool. (This already happened once: the page rendered blank and the Word
  download did nothing. The fix was restoring the fully-inline build.)
- **No external dependencies that could 404** — keep everything inline (fonts/CSS/JS as inline or `data:` URIs).

## How navigation works (wiring up a tool)
- Reps and their options are defined in a list in the app: each rep has `key`, `name`, and `subs: [...]`.
- Clicking an option calls `openSub(key, label)`: matched options set a `view` (e.g. `'form'`,
  `'agreement'`); unmatched options show a `'<label> — coming soon'` toast.
- To make a "coming soon" option real, add its `(key, label)` case in `openSub` to a new `view` and build
  that view. This is an edit **inside `index.html`** (the bundled app), kept minimal and surgical.

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
