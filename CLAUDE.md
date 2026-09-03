# Holiner Listing Launchpad - Project Context

## What this is
A single, self-contained **static web app** for **Holiner Commercial Real Estate**, hosted on GitHub
Pages: **[index.html](index.html)** (~1MB). It's the "Holiner Listing Launchpad" - a broker workspace
that opens to a **"Choose a representation"** hub (Tenant / Landlord / Buyer / Seller). All navigation is
internal React `view` state inside this one file - there is no URL routing and no separate pages.

**All four reps are built out** (13 working tools):
- **Landlord Rep** - Lease Listing (`view: 'form'`, the original multi-step marketing brief), Exclusive
  Agreement (`view: 'agreement'`), Letter of Intent (`view: 'loiAsset'` → `'loi'`, all four asset classes).
- **Tenant Rep** - Client Intake / Requirement Builder (intake engine), Letter of Intent (same LOI builder
  with `side: 'tenant'`), Exclusive Agreement + Commission Agreement (doc engine).
- **Buyer Rep** - Client Intake (intake engine), Buyer Representative Agreement, Offer to Purchase
  (buyer-favorable purchase LOI), Commission Agreement (all doc engine).
- **Seller Rep** - Client Intake + Sale Listing brief (intake engine), Seller Exclusive Agreement, Offer to
  Purchase (seller-favorable), Commission Agreement (doc engine).

The entire site is this one file. (History: we briefly split the app into an outer hub -
`index.html` cards plus `landlord-rep.html` - but it duplicated the app's built-in hub and caused a
confusing loop, so it was removed; `listing-agreement.html`, an identical copy, was removed too.)

## The two generic engines (how 10 of the 13 tools work)
Most tools are **configs, not bespoke code**. To change a tool's fields, sections, or wording, edit its
config in the component constructor - the views and Word export follow automatically.
- **Intake engine** (`view: 'intake'`): schema-driven form → composed email brief (Copy / mailto "Send to
  team"). Configs live in **`this.INTAKES`** (`tenantIntake`, `buyerIntake`, `sellerIntake`, `saleListing`).
  Each config is `{crumb, title, intro, heading, subjectPrefix, subjectField, recipient, fields}` where
  `fields` mixes header rows `{hdr, sub}` and field rows `{k, label, ph, area?}`. Only filled fields are
  included in the email. Drafts save to `localStorage` per config key (`holiner_intake_<key>_v1`).
  Field row types: `opts` (single-select pills), `multi` (multi-select checkboxes, comma-joined),
  `sel` (Have it / Need it / N/A), `suites` (suite table), `map` (the satellite pin map, see below),
  `req` (essential: asterisk + green border), `inherit: 'otherKey'`, `meta` (wizard-only, not emailed),
  `listWhen`. Header rows take `showIf: {k, v}` or `showIf: {k, vIn: [...]}` for multiple values.

**Careful with the render's binding object** - it is one enormous object literal shared by every view, so
a key added for one tool silently overwrites the same key added for another (a duplicate
`signAttachStyle` did exactly that). Prefix new keys per view (`intakeAttachStyle` vs `signAttachStyle`).
- **Doc engine** (`view: 'doc'`): schema-driven document builder → live preview + Word `.docx` via
  **`window.RepDocTemplate`** (defined in `_defineRepDocTemplate()`). Configs live in **`this.DOCS`**
  (`tenantRep`, `tenantCommission`, `buyerRep`, `buyerOffer`, `buyerCommission`, `sellerExclusive`,
  `sellerOffer`, `sellerCommission`). Two styles: **`'agreement'`** (titled, numbered sections, dual
  signature blocks) and **`'letter'`** (LOI-style letter with the two-column clause table and an
  acceptance block). Fields carry `tok: ['[Token]']` lists - a filled field auto-replaces its tokens in
  every section; unresolved `[tokens]` trigger the placeholder warning. Sections are editable/removable
  in the edit view and reorderable (arrows + drag) in the preview. Empty sections are omitted and
  numbering re-flows. Drafts: `holiner_doc_<key>_v1`.

## The lease LOI is side-aware
`loi.side` is `'landlord'` or `'tenant'` (set by which rep opened it; separate drafts:
`holiner_office_loi_draft_v1` vs `holiner_tenant_loi_draft_v1`). `buildLoiBlocks` flips the opening
paragraph, brokerage recognition, agency disclosure, and the acceptance block by side. Tenant-favorable
clauses (ids 200+, `side: 'tenant'` in `this.LIB`) and the "Tenant-Favorable" tier chip appear only on
the tenant side.

## Navigation pattern: Rep → Document Type → (Asset Class) → Builder
Navigation is internal `view` state. The levels:
1. **Representation** - the home "Choose a representation" hub (Tenant / Landlord / Buyer / Seller).
2. **Document Type** - a rep's `subs` list (e.g. Landlord: `Lease Listing`, `Exclusive Agreement`,
   `Letter of Intent`). Clicking one calls **`openSub(key, label)`**.
3. **Asset Class** *(LOI so far)* - `openSub('landlord','Letter of Intent')` opens the asset-class picker
   (`view: 'loiAsset'`). Office → **`openLoiAsset('Office')`** → the builder.
4. **Builder** - form + live preview + Word download (e.g. `view: 'agreement'`, `view: 'loi'`).

`goBack()` walks back up one level. Unmatched options show a `'<label> - coming soon'` toast. To activate
a "coming soon" item, add its case to `openSub` (or the relevant opener) and build its view - all inside
`index.html`, kept minimal and surgical. Build other reps' document-type menus the same way.

## Document tools & their doc-modules
Each builder has a **doc-module**: a `buildBlocks → renderPreviewHtml(data)` + `buildDocxBlob(data, opts)`
trio. One block model feeds both preview and Word so they never diverge; both use the global
`window.docx` library plus shared letterhead / page-number / Times-New-Roman idioms. Each registers on
`window`:
- **`window.AgreementTemplate`** - Exclusive Agreement (a bundled asset, loaded via a blob `<script src>`).
- **`window.LoiTemplate`** - the lease LOI (both sides). Defined in `index.html` as the component method
  **`_defineLoiTemplate()`**, called from `componentDidMount`.
- **`window.RepDocTemplate`** - the generic doc engine (all rep agreements, commission agreements, and
  offers to purchase). Defined as **`_defineRepDocTemplate()`**, called from `componentDidMount`.
- **`window.SignReqTemplate`** - the Sign Requisition Form (mirrors the paper form, embeds the placement
  map as a JPEG). Defined as **`_defineSignReqTemplate()`**; driven by `downloadSignReq()`.
  **`mailto:` cannot carry an attachment** - that is a limit of the protocol, not of this app, so no
  amount of work here will auto-attach the form. The two actions are deliberately **kept separate on the
  review screen only**: an Attachment panel with **Download Sign Requisition Form**, and the existing
  **Send to team / Send to Marketing** which just opens the draft. The broker downloads, sends, and drags
  the file in. Do not re-add a download button to the wizard steps or bolt the download onto the send
  button - that was tried and the extra prompts were the problem. Real auto-attach needs the Outlook
  add-in or Graph `sendMail`, both of which wait on the Entra app registration.

### ⚠️ Gotcha - define new doc-modules INSIDE the component, NOT as inline `<helmet>` scripts
The DC framework **transforms inline `<helmet>` `<script>` tags**. That transform corrupts module code and
**breaks the boot** - a stray `Unexpected token` halts the whole script chain and the page renders
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
- **No external dependencies that could 404** - keep everything inline (fonts/CSS/JS as inline or `data:` URIs).

### The one deliberate exception: the sign placement map
`window.HolinerSignMap` (defined in **`_defineSignMap()`**) is a ~200-line hand-rolled slippy map - **not a
library** - so no script can 404 and halt the boot. It is the only part of the app that calls out to the
network, and only for **image tiles and a geocode lookup**, both from Esri and both **keyless**:
- Tiles: `server.arcgisonline.com/.../World_Imagery/MapServer/tile/{z}/{y}/{x}` (sends
  `Access-Control-Allow-Origin: *`, which is what lets the canvas export stay untainted).
- Geocode: `geocode.arcgis.com/.../findAddressCandidates` for the "Find the property" button.
- Attribution ("Imagery: Esri, Maxar, Earthstar Geographics") is drawn on the map **and** burned into the
  exported image. Keep it.

If either call fails the map degrades quietly - the step still works, the broker can pan manually or the
coordinates carry alone, and **nothing else on the page is affected.** Values are stored on a normal
string field as `"lat,lon,zoom"`. `raster(value, w, h)` returns a JPEG data URI used by both the Word form
and the rich clipboard paste; `_prepSignMapImage()` pre-renders it when the email/brief view opens so the
clipboard write stays inside the user gesture.

The map mounts imperatively: the template emits `<div data-signmap="<fieldKey>">` and **`_mountSignMap()`**
(called from `componentDidMount` **and `componentDidUpdate`**) picks the node that is both bound and
visible - the intake template emits one per row, so selecting by id would grab a hidden one. Sign fields
live in the **intake store** for the Sale Listing and the **form store** for the Lease Listing;
everything routes through **`_signData()` / `_signSet()`**, which switch on `this.state.view`.

## Editing the bundle (how `index.html` stores the app)
The whole app is a **JSON-encoded string** inside `<script type="__bundler/template">`. To edit safely:
decode it (`JSON.parse`), edit the readable source, then re-encode - standard JSON-string-escaping
**plus** escape every closing-tag slash (each `</` is written as its unicode `\uXXXX` form) so the string
can't break out of the `<script>`.

**A byte-for-byte re-encode is impossible** and you should not chase it: the original text mixes escaping
styles (`·` is written `·` while `—` and `×` sit raw), because it was written by different passes
over time. The correct gate is **semantic**: assert that `JSON.parse(encode(src)) === src` and that the
encoded text contains no raw `</`, then write the file and **re-decode what landed on disk** to confirm it
still matches your source. Escaping every non-ASCII char as `\uXXXX` is the safe encoder. The template is
one enormous single line, so any edit shows up as a one-line diff no matter how surgical it is - **verify
behavior in a browser, not by reading the diff.**

## Build specs
Reference build sheets live in **[docs/](docs/)** - e.g.
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
