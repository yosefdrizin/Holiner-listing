# Holiner Listing Launchpad — Project Context

## What this is
A single, self-contained **static web app** for **Holiner Commercial Real Estate**, hosted on GitHub
Pages: **[index.html](index.html)** (~1MB). It's the "Holiner Listing Launchpad" — a broker workspace
that opens to a **"Choose a representation"** hub (Tenant / Landlord / Buyer / Seller). All navigation is
internal React `view` state inside this one file — there is no URL routing and no separate pages.

Currently built out — **Landlord Rep** has three working tools:
- **Lease Listing** (`view: 'form'`) — the marketing-brief form.
- **Exclusive Agreement** (`view: 'agreement'`) — document preview + Word `.docx` export.
- **Letter of Intent ▸ Office** (`view: 'loi'`) — the Office LOI builder (preview + Word `.docx`).

Other reps, document types, and LOI asset classes (Medical / Retail / Industrial) show a "coming soon"
state. The entire site is this one file. (History: we briefly split the app into an outer hub —
`index.html` cards plus `landlord-rep.html` — but it duplicated the app's built-in hub and caused a
confusing loop, so it was removed; `listing-agreement.html`, an identical copy, was removed too.)

## Navigation pattern: Rep → Document Type → (Asset Class) → Builder
Navigation is internal `view` state. The levels:
1. **Representation** — the home "Choose a representation" hub (Tenant / Landlord / Buyer / Seller).
2. **Document Type** — a rep's `subs` list (e.g. Landlord: `Lease Listing`, `Exclusive Agreement`,
   `Letter of Intent`). Clicking one calls **`openSub(key, label)`**.
3. **Asset Class** *(LOI so far)* — `openSub('landlord','Letter of Intent')` opens the asset-class picker
   (`view: 'loiAsset'`). Office → **`openLoiAsset('Office')`** → the builder.
4. **Builder** — form + live preview + Word download (e.g. `view: 'agreement'`, `view: 'loi'`).

`goBack()` walks back up one level. Unmatched options show a `'<label> — coming soon'` toast. To activate
a "coming soon" item, add its case to `openSub` (or the relevant opener) and build its view — all inside
`index.html`, kept minimal and surgical. Build other reps' document-type menus the same way.

## Document tools & their doc-modules
Each builder has a **doc-module**: a `buildBlocks → renderPreviewHtml(data)` + `buildDocxBlob(data, opts)`
trio. One block model feeds both preview and Word so they never diverge; both use the global
`window.docx` library plus shared letterhead / page-number / Times-New-Roman idioms. Each registers on
`window`:
- **`window.AgreementTemplate`** — Exclusive Agreement (a bundled asset, loaded via a blob `<script src>`).
- **`window.LoiTemplate`** — Office LOI. Defined in `index.html` as the component method
  **`_defineLoiTemplate()`**, called from `componentDidMount`.

### ⚠️ Gotcha — define new doc-modules INSIDE the component, NOT as inline `<helmet>` scripts
The DC framework **transforms inline `<helmet>` `<script>` tags**. That transform corrupts module code and
**breaks the boot** — a stray `Unexpected token` halts the whole script chain and the page renders
blank/partial. (`window.AgreementTemplate` gets away with being a script only because it's a separate
**blob `src=`** asset, fetched raw and never transformed.) So for any **new** doc-module:
- **Do NOT** add a new inline `<script>...window.XTemplate = ...</script>` inside `<helmet>`.
- **DO** define it inside the component class as a **`_defineXTemplate()`** method that sets
  `window.XTemplate = { buildBlocks, renderPreviewHtml, buildDocxBlob }`, call it from `componentDidMount`,
  and poll for it like `agMod` / `loiMod`. Follow the `window.AgreementTemplate` / `window.LoiTemplate`
  shape.

## Architecture rule
`index.html` is **fully bundled and self-contained**: app, fonts, CSS, and all doc-modules are inline.
- **Never split code out into an external file (e.g. `./agreement-template.js`) and never reference one.**
  It will **404** and break the tool. (Happened once: page rendered blank and the Word download did
  nothing; the fix was restoring the fully-inline build.)
- **No external dependencies that could 404** — keep everything inline (fonts/CSS/JS as inline or `data:` URIs).

## Editing the bundle (how `index.html` stores the app)
The whole app is a **JSON-encoded string** inside `<script type="__bundler/template">`. To edit safely:
decode it (`JSON.parse`), edit the readable source, then re-encode — standard JSON-string-escaping
**plus** escape every closing-tag slash (each `</` is written as its unicode `\uXXXX` form) so the string
can't break out of the `<script>`. Gate any re-encode with a **byte-for-byte round-trip test** on the
untouched template before trusting it.

## Build specs
Reference build sheets live in **[docs/](docs/)** — e.g.
**[docs/office-loi-spec.md](docs/office-loi-spec.md)** (the Office LOI build spec).

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
