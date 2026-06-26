# Holiner Listing — Project Context

## What this is
A single, self-contained **static website**: one file, [index.html](index.html) (~1MB). It is a
document/listing-generation tool for **Holiner Commercial Real Estate** (generates a listing document
preview and a downloadable Word `.docx`).

## Architecture — read before editing
`index.html` is **fully bundled and self-contained**. The application code, fonts, and the
agreement-template code are **ALL inline** in this one file:

- The agreement-template code — including `renderPreviewHtml` (the document preview) and
  `buildDocxBlob` (the Word download) — is loaded at runtime via **`window.AgreementTemplate`**,
  which a bundled inline script registers.
- **Never split code out into an external `./agreement-template.js` file, and never reference one.**
  An external `agreement-template.js` will **404** and break **both** the document preview and the
  Word `.docx` download. (This already happened once — the page rendered blank and the download did
  nothing. The fix was restoring the fully-inline build.)

## Hosting & deploy
- Hosted on **GitHub Pages**, served from the **`main`** branch.
- It **auto-deploys on every push** to `main`.
- To deploy a change: **commit and push to `main`.** That's the whole deploy process.

## Working agreements
- **Always show the diff and wait for approval before committing.** Do not commit without a go-ahead.
- This is a **live production tool used with clients.** Keep every edit **minimal and surgical.**
- **Do not refactor, reorganize, or "clean up" anything unless explicitly asked.**
