// Cloudflare Pages Function - POST /api/extract
// Hands-free AI extraction from uploaded documents. INERT until ANTHROPIC_API_KEY is set,
// so there is zero Claude spend until it's explicitly approved and the key is added.
// Body: { documents: [ { media_type: "application/pdf"|"image/*", data: "<base64>" } ] }
// Returns: { ok: true, fields: {...} }  - the same field names the Deal Desk form uses.

const EXTRACT_PROMPT =
  'You are helping a commercial real estate broker log a deal. From the attached document(s) ' +
  '(lease, LOI, commission agreement, exclusive, or lease abstract), extract the fields below and ' +
  'return ONLY a JSON object - no commentary. Use empty string "" for anything not stated; do not guess.\n\n' +
  '{\n' +
  '  "contact_name": "", "company": "", "email": "", "phone": "", "contact_type": "",\n' +
  '  "deal_name": "", "deal_type": "", "asset_type": "", "property_address": "",\n' +
  '  "deal_value": "", "commission_rate": "", "close_date": "", "notes": ""\n' +
  '}\n\n' +
  'contact_type is one of Buyer/Seller/Tenant/Landlord/Broker. deal_type is one of ' +
  'Tenant Rep/Landlord Rep/Buyer Rep/Seller Rep/Leasing Rep. deal_value is a number only (no $ or commas). ' +
  'commission_rate as written (e.g. "4%" or "$2.00/SF"). close_date as YYYY-MM-DD if present.';

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

function parseJson(text) {
  try { return JSON.parse(text); } catch (e) {}
  const a = text.indexOf('{'), b = text.lastIndexOf('}');
  if (a >= 0 && b > a) { try { return JSON.parse(text.slice(a, b + 1)); } catch (e) {} }
  return null;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.ANTHROPIC_API_KEY) {
    return json({ error: 'AI auto-extract is not enabled yet. Add ANTHROPIC_API_KEY on the server to turn it on.' }, 501);
  }
  try {
    const data = await request.json();
    const docs = (data.documents || []).slice(0, 8);
    const content = [];
    docs.forEach(function (doc) {
      if (doc.media_type === 'application/pdf') {
        content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: doc.data } });
      } else if (/^image\//.test(doc.media_type || '')) {
        content.push({ type: 'image', source: { type: 'base64', media_type: doc.media_type, data: doc.data } });
      }
    });
    content.push({ type: 'text', text: EXTRACT_PROMPT });

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: env.ANTHROPIC_MODEL || 'claude-opus-4-8',
        max_tokens: 2000,
        messages: [{ role: 'user', content: content }]
      })
    });
    const j = await r.json();
    if (!r.ok) return json({ error: (j.error && j.error.message) || ('Claude error ' + r.status) }, 500);
    const text = (j.content || []).filter(function (b) { return b.type === 'text'; }).map(function (b) { return b.text; }).join('');
    return json({ ok: true, fields: parseJson(text) || {}, raw: text });
  } catch (err) {
    return json({ error: err.message || 'Server error' }, 500);
  }
}
