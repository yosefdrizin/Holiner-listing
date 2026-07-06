# Deal Desk — Setup & Cutover

The Deal Desk is a brand-matched page (`deal-desk.html`) plus two Cloudflare Pages Functions
(`functions/api/logDeal.js`, `functions/api/extract.js`). It writes deals into the existing
**Holiner | CRM** Notion databases. It runs **free** — the only paid piece (AI auto-extract) stays
off until an `ANTHROPIC_API_KEY` is added.

## What runs where
- **`deal-desk.html`** — the tool. Static; works on any host. "Save to CRM" and "Auto-extract"
  call the two functions below, which only run on a functions-capable host (Cloudflare Pages).
- **`functions/api/logDeal.js`** — creates a Contact + Deal in Notion and links them.
- **`functions/api/extract.js`** — hands-free AI extraction; returns 501 until a key is set.

## One-time setup (you)
1. **Cloudflare account** — dash.cloudflare.com → Workers & Pages → Create → Pages →
   Connect to Git → authorize the `Holiner-listing` repo. Build command: *(empty)*. Output dir: `/`.
2. **Notion integration token** — notion.so/my-integrations → New integration "Holiner Deals" →
   capabilities Read + Insert + Update → copy the secret (`ntn_…`). Then **share the databases with it**:
   open each of these in Notion → ⋯ menu → Connections → add "Holiner Deals":
   - 🧪 Deal Desk — SANDBOX (Contacts + Deals) — for testing
   - Holiner | CRM (Contacts + Deals) — for cutover
3. **Cloudflare env vars** — Pages project → Settings → Environment variables → add:
   - `NOTION_TOKEN` = the `ntn_…` secret  *(required)*
   - *(optional now)* leave `NOTION_DEALS_DB` / `NOTION_CONTACTS_DB` unset → defaults to SANDBOX.

## Database IDs
| Purpose | Deals DB | Contacts DB |
|---|---|---|
| **Sandbox** (default; testing) | `7b1d7a80-61a3-41fc-b8e1-8319bc3a0855` | `836ae868-a333-459d-955c-fd71d365e0df` |
| **Live CRM** (cutover) | `3552fd80-1640-808f-a36c-f348f7ec1f16` | `3162fd80-1640-8184-a3f0-e2f18ddfc08c` |

## Cutover to the live CRM (after the demo is approved)
In Cloudflare env vars, set:
- `NOTION_DEALS_DB` = `3552fd80-1640-808f-a36c-f348f7ec1f16`
- `NOTION_CONTACTS_DB` = `3162fd80-1640-8184-a3f0-e2f18ddfc08c`
- `TARGET_LABEL` = `CRM`

Then redeploy. No code change. (Before cutover, remove the stray empty second data source on the
live **Contacts** database so `database_id` resolves unambiguously.)

## Turning on hands-free AI extraction (later, needs approval — costs money)
Add `NOTION`-style: `ANTHROPIC_API_KEY` = your Anthropic key (console.anthropic.com, billing on;
set a spend cap). Optionally `ANTHROPIC_MODEL` (defaults to `claude-opus-4-8`). The "Auto-extract"
button in the UI gets wired on at that point.

## The no-cost workflow (until AI is approved)
In the tool: **Copy prompt for Claude** → paste into claude.ai with the document (your subscription,
no API cost) → paste Claude's JSON answer back → **Fill fields from paste** → review → **Save to CRM**.
