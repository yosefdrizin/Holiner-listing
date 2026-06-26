# Build Spec — Landlord Rep ▸ Letter of Intent ▸ Office LOI Builder

This is a build sheet for Claude Code. Build it INTO the existing `index.html` app, matching the
existing Exclusive Agreement tool's structure, branding, navigation pattern, and Word-download
mechanism. Do not refactor anything else. Do not touch the Exclusive Agreement tool.

---

## 0. Rules (read first)

- Read `index.html` and `CLAUDE.md` before building. Reuse the existing patterns: the same
  `openSub`-style view navigation, the same brand tokens (green #78A167, tan #AFA183, black #22241F,
  cream #EDECE2, Albert Sans), the same card style, and the SAME Word `.docx` generation approach the
  Exclusive Agreement tool already uses (`buildDocxBlob` / `window.AgreementTemplate` pattern).
- Keep everything inline and self-contained. No new external files that could 404.
- The app must keep working exactly as it does now. The Exclusive Agreement tool is untouched.
- Show me a written plan and the diff. Do NOT commit or push until I approve.

---

## 1. Navigation changes (build to scale)

Generalize the nav so it supports: Representation → Document Type → (Asset Class) → Builder.

**Landing ("Choose a representation"):** keep the four reps (Tenant / Landlord / Buyer / Seller).
Clicking **Landlord Rep** now opens a **Document-Type menu**, not the agreement directly.

**Landlord Rep → Document-Type menu** (cards):
- **Exclusive Agreement** → the existing tool (rewire the current entry point to land here).
- **Letter of Intent** → the Asset-Class picker (below).
- Leave room for more document-type cards later.

Build the structure so the other reps (Tenant/Buyer/Seller) can later get their own document-type
menus including LOI, without re-architecting. Tenant/Buyer/Seller can stay "coming soon" for now.

**Landlord Rep → Letter of Intent → Asset-Class picker** (cards):
- **Office** → active, opens the Office LOI Builder.
- **Medical**, **Retail**, **Industrial** → present but "coming soon" (not clickable, clean look).

Every sub-page has a "← Back" link to the level above. Match the existing back-link pattern.

---

## 2. Office LOI Builder — form fields

Same UI pattern as the Exclusive Agreement tool: form on one side, live preview, Download button.
Group the fields with these section headers. Every clause's standard language (Section 3) is the
DEFAULT, pre-filled and editable. Required fields marked *.

**Header**
- LOI Date* (default = today)
- Recipient Name*, Recipient Company, Recipient Email
- Tenant has broker? (toggle; if off, address tenant directly)

**Parties & Property**
- Landlord Legal Name*
- Tenant Legal Name*, Tenant DBA
- Include Property Management? (toggle) + note
- RSF*, Suite*, Floor/Building, Exhibit ref (default "Exhibit A")
- Building Description (free text, 1–3 sentences; this is the sales pitch)

**Term & Dates**
- Term (years)* (default 3)
- Estimated delivery (days after execution)* (default 30)
- Rent Commencement basis (default: on delivery, as-is)

**Economics**
- Rent basis (default NNN)
- Base Rent schedule: rows of {period, $/RSF}* (default 3 rows; supports add/remove rows)
- Annual escalation %* (default 3)
- Rent Abatement months (default 0; if >0 show abatement clause, base-rent-only)
- Operating Expense (NNN/CAM/Tax/Ins) estimate $/RSF/yr* + year
- Electricity estimate $/RSF/yr (optional)
- HVAC: landlord-maintained (default), building hours (default "Mon–Fri 8AM–6PM")

**Construction / Delivery**
- TI structure (default: As-is, tenant-funded). Option: Allowance $/RSF (if chosen, show TI clause +
  force Financial Review on).
- Delivery condition (default: As-is)

**Occupancy**
- Parking ratio (per 1,000 RSF)*, covered/gated? (toggle), reserved rate $/space/mo (optional)
- Signage (default: directory + suite)
- 24/7 Access (toggle, default on), after-hours method (default security card)

**Deposits**
- Security Deposit (default: last month Base Rent + NNN; subject to financial review)
- Prepaid Rent? (toggle, default off for office)

**Options**
- Renewal options count (default 1), renewal term years (default 3), rate basis (default FMV),
  notice window: no later than (default 9 mo), no earlier than (default 15 mo)

**Use & Credit**
- Permitted Use* (free text)
- Assignment standard (default: consent not unreasonably withheld)
- Guaranty? (toggle, default off). If on: personal/corporate, guarantor name, cap months, burn-off yrs.
- Financial Review? (toggle; auto-on if TI allowance or Guaranty on)

**Closing**
- Brokerage: Holiner paid per separate agreement (default text). Co-broke recognition auto-shows if
  "Tenant has broker" is on.
- Agency disclosure: state (default TX → TREC language)
- Offer expiration date*
- Disclaimer version (default: Extended non-binding)
- Signature block: Holiner team members (default: David Holiner, Yosef Drizin, Michele Kornbluth
  SIOR CCIM), tenant acceptance block

---

## 3. Default clause language (merge-field templates)

Pre-fill these as editable defaults. `{{field}}` = merge from the form. Optional clauses only render
when their toggle/condition is met.

- **RE line:** `RE: Letter of Intent ("LOI") for {{tenant}} to lease office space at {{address}}.`
- **Opening:** `On behalf of {{landlord}} ("Landlord"), we are pleased to present this Letter of Intent to {{tenant}} ("Tenant"). {{building_description}}`
- **Premises:** `Approximately {{rsf}} rentable square feet ("RSF") located in Suite {{suite}}, {{floor}}, as outlined on {{exhibit}}.`
- **Lease/Rent Commencement:** `Upon Landlord's delivery of possession of the Premises in its as-is condition, estimated to be {{delivery_days}} days after Lease execution.`
- **Term:** `{{term_years}} years.`
- **Base Rent:** render the schedule as a table (Period | $/RSF | Additional Expenses), footnote `{{esc}}% annual escalations` and `NNN to be further defined below`.
- **Rent Abatement (if months>0):** `Landlord shall provide {{abatement_months}} months of Base Rent abatement at the beginning of the Term. Abatement applies to Base Rent only; Tenant remains responsible for NNN during the abated period.`
- **CAM, Taxes & Insurance:** `Tenant will reimburse Landlord for Tenant's proportionate share of the actual cost, estimated to be {{opex}}/RSF/yr for {{opex_year}}.`
- **Renewal Option:** `Tenant shall have {{count}} option(s) to renew the Term for an additional {{renewal_years}} years at the prevailing fair market rental rate for comparable Class A office in the same submarket, exercised by written notice no later than {{notice_late}} months and no earlier than {{notice_early}} months prior to expiration.`
- **Electricity/Utilities:** `Estimated at {{electric}}/RSF/yr for {{opex_year}}. Tenant shall be responsible for its pro rata share of electrical consumption.`
- **HVAC:** `Landlord is responsible for repair, replacement, and maintenance of the base-building HVAC systems. HVAC service coincides with Building hours ({{building_hours}}).`
- **Delivery / Tenant Improvements (as-is default):** `Premises delivered in as-is condition. Any improvements desired by Tenant shall be at Tenant's sole cost, subject to Landlord's prior written approval of plans and contractors.`
- **TI Allowance (if chosen):** `Subject to review and approval of Tenant's financials, Landlord shall provide a Tenant Improvement Allowance of {{ti_psf}}/RSF, payable upon completion of Tenant's work, delivery of the certificate of occupancy, and final lien waivers. The allowance is for improvements only and not for trade fixtures, equipment, inventory, signage, moving costs, or rent.`
- **Parking:** `Tenant parking is at a ratio of {{ratio}}/1,000 RSF{{, free, covered, gated, and secured if toggled}}. Reserved parking is available at {{reserved_rate}}/space/month, subject to availability.`
- **Signage:** `At Landlord's expense, Tenant may add its name to the lobby directory. Suite signage is available at Tenant's sole cost with Landlord's prior approval.`
- **Access:** `Tenant shall have access 24 hours a day, 7 days a week. Building hours are {{building_hours}}. After-hours access is by Building security card.`
- **Security Deposit:** `A Security Deposit equal to the last month's Base Rent plus NNN shall accompany Tenant's execution of the Lease, subject to Landlord's review of Tenant's financials.`
- **Prepaid Rent (if on):** `Tenant shall pay the first month's Base Rent plus NNN upon Lease execution as Prepaid Rent.`
- **Use:** `The Premises shall be used for {{use}} and no other use without Landlord's prior written consent. Use to be further defined in the Lease.`
- **Assignment & Subletting:** `Tenant shall not assign the Lease or sublet the Premises without Landlord's prior written consent, not to be unreasonably withheld, conditioned, or delayed. Tenant shall remain liable following any transfer.`
- **Guaranty (if on):** `{{guarantor}} shall provide a {{personal/corporate}} guaranty of the Lease{{, capped at {{cap}} months, burning off after {{burnoff}} years of no default}}. Please provide financials.`
- **Financial Review (if on):** `Tenant shall provide current financial statements for Landlord's review. The TI allowance, Security Deposit, and Guaranty are subject to Landlord's review and approval of Tenant's financials.`
- **Brokerage:** `Landlord shall pay Holiner a commission pursuant to a separate written agreement.` + if tenant broker: `Landlord recognizes that {{tenant_broker}} represents Tenant and agrees to pay a commission related to such representation pursuant to a separate agreement.`
- **Agency Disclosure (TX default):** `Enclosed is an agency disclosure form promulgated by the Texas Real Estate Commission explaining that Holiner Holdings, LLC, represents the Landlord in this transaction.`
- **Offer Expiration:** `This offer is valid through end of day {{expiration}}.`
- **Disclaimer (Extended):** `This Letter of Intent is not intended to be a legally binding agreement. Nothing herein shall be used or relied upon by either party in any evidentiary manner to demonstrate that the parties have entered into a binding agreement or for any other purpose. No binding agreement shall exist unless and until a formal lease has been negotiated, drafted, approved by the parties and their counsel, and executed and delivered. While the parties may continue negotiations, each party reserves the right to terminate such negotiations at any time, with or without cause, without liability.`
- **Signature block:** `Sincerely,` / Holiner / {{team members}} — then `Agreed and accepted on behalf of Tenant:` By / Name / Title / Date.

---

## 4. Output order (assembled LOI)

Date → Recipient → RE → Salutation → Opening+Building → BUILDING → LANDLORD → [PROPERTY MANAGEMENT]
→ PREMISES → LEASE/RENT COMMENCEMENT → TERM → BASE RENT (table) → [RENT ABATEMENT] → CAM/TAXES/INSURANCE
→ RENEWAL OPTION → ELECTRICITY/UTILITIES → HVAC → DELIVERY/TI → PARKING → SIGNAGE → ACCESS →
SECURITY DEPOSIT → [PREPAID RENT] → USE → ASSIGNMENT & SUBLETTING → [GUARANTY] → [FINANCIAL REVIEW]
→ BROKERAGE → DISCLAIMER → OFFER EXPIRATION → Sincerely/signatures → Tenant acceptance block.

---

## 5. Word (.docx) download

Use the same `.docx` generation mechanism the Exclusive Agreement tool already uses. Output a clean,
Holiner-branded LOI in the order above, labeled term headings in bold, base rent as a table. Button
label: **"Download Word .docx"**. Live preview mirrors the output as the broker edits the form.

---

## 6. AI Refine button (place but disable)

Add an **"✨ AI Refine"** button next to the Download button, visibly disabled, tooltip/label:
**"Coming soon"**. No API call, no key, no network. It is a placeholder for the next phase (a
Cloudflare Pages Function will power it later). Do not implement any API call now.

---

## 7. Do NOT

- Do not modify or break the Exclusive Agreement tool.
- Do not split into external files or refactor unrelated code.
- Do not add any API key or network/AI call.
- Do not commit or push until I approve the plan and diff.
