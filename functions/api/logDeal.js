// Cloudflare Pages Function — POST /api/logDeal
// Creates a Contact (if named) + a Deal in Notion and links them.
// Secrets/vars (set in Cloudflare dashboard → Settings → Environment variables):
//   NOTION_TOKEN       (required)  — the Notion internal integration secret
//   NOTION_DEALS_DB    (optional)  — Deals database id; defaults to the SANDBOX Deals DB
//   NOTION_CONTACTS_DB (optional)  — Contacts database id; defaults to the SANDBOX Contacts DB
//   TARGET_LABEL       (optional)  — label shown back to the UI (e.g. "Sandbox" / "CRM")
// At cutover, point NOTION_DEALS_DB / NOTION_CONTACTS_DB at the live databases and set TARGET_LABEL=CRM.

const NOTION_VERSION = '2022-06-28';
const SANDBOX_DEALS = '7b1d7a80-61a3-41fc-b8e1-8319bc3a0855';
const SANDBOX_CONTACTS = '836ae868-a333-459d-955c-fd71d365e0df';

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
function clip(v) { return String(v == null ? '' : v).slice(0, 2000); }
function title(v) { return { title: [{ text: { content: clip(v) } }] }; }
function rt(v) { return { rich_text: v ? [{ text: { content: clip(v) } }] : [] }; }
function sel(v) { return v ? { select: { name: String(v) } } : { select: null }; }
function msel(v) { return { multi_select: v ? [{ name: String(v) }] : [] }; }
function numf(v) {
  if (typeof v === 'number') return { number: isFinite(v) ? v : null };
  const n = parseFloat(String(v || '').replace(/[^0-9.\-]/g, ''));
  return { number: isFinite(n) ? n : null };
}
function dt(v) { return v ? { date: { start: v } } : { date: null }; }

async function notionCreatePage(env, body) {
  const r = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + env.NOTION_TOKEN,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.message || ('Notion error ' + r.status));
  return j;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    if (!env.NOTION_TOKEN) {
      return json({ error: 'The Notion key is not set on the server yet (NOTION_TOKEN).' }, 500);
    }
    const dealsDb = env.NOTION_DEALS_DB || SANDBOX_DEALS;
    const contactsDb = env.NOTION_CONTACTS_DB || SANDBOX_CONTACTS;
    const target = env.TARGET_LABEL || 'Sandbox';

    const data = await request.json();
    const c = data.contact || {};
    const d = data.deal || {};

    // 1) Contact (only when a name is provided)
    let contactId = null, contactUrl = null;
    if (c.name) {
      const cp = await notionCreatePage(env, {
        parent: { database_id: contactsDb },
        properties: {
          'Contact': title(c.name),
          'Company': rt(c.company),
          'Email': c.email ? { email: c.email } : { email: null },
          'Phone': c.phone ? { phone_number: c.phone } : { phone_number: null },
          'Type': msel(c.type)
        }
      });
      contactId = cp.id;
      contactUrl = cp.url;
    }

    // 2) Deal
    let notes = d.notes || '';
    if (d.address) notes = (notes ? notes + '\n' : '') + 'Property: ' + d.address;

    const props = {
      'Deal Name': title(d.name || 'Untitled deal'),
      'Deal Type': msel(d.type),
      'Stage': sel(d.stage || 'Executed'),
      'Asset Type': msel(d.asset),
      'Deal Value': numf(d.value),
      'Commission Rate': rt(d.rate),
      'Commission Owed': numf(d.commission),
      'Invoice Status': sel(d.invoice || 'Draft'),
      'Broker': sel(d.broker),
      'Close Date': dt(d.close),
      'Notes': rt(notes)
    };
    if (contactId) props['Contacts'] = { relation: [{ id: contactId }] };

    const dp = await notionCreatePage(env, {
      parent: { database_id: dealsDb },
      properties: props
    });

    return json({ ok: true, target: target, dealUrl: dp.url, contactUrl: contactUrl });
  } catch (err) {
    return json({ error: err.message || 'Server error' }, 500);
  }
}
