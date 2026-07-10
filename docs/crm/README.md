# Holiner CRM - foundation (DRAFT for review)

This is the secure database behind the toolkit: **Microsoft sign-in**, each broker sees
**only their own** deals and contacts, and the **CEO (admin)** can overview everyone's.
It's built on **Supabase** (a hosted PostgreSQL database + login system), free at our size.

Two files:
- **`schema.sql`** - the actual database structure + security rules. You paste it into
  Supabase once and it builds everything.
- **this README** - plain-language explanation + the click-by-click setup.

---

## What's in the database

Three tables:

| Table | What it holds | Who can see a given row |
|---|---|---|
| **profiles** | one row per person who signs in (name, email, role) | the person themselves; admins see all |
| **contacts** | people/companies a broker is working | the broker who owns it; admins read-only |
| **deals** | the core CRM record (value, commission, stage, close date, etc.) | the broker who owns it; admins read-only |

Every contact and deal has an **owner** (the broker who created it), filled in automatically.
The "wall" between brokers is enforced **inside the database** (Postgres "row-level security"),
not just hidden on the screen - so it's real security, not a curtain.

**Admin = read-only overview by default.** The CEO can *see* every broker's deals but not edit
them. That's a deliberate choice; if you'd rather admins also edit, it's a one-line change.

**Contacts are private per broker by default.** (This answers the open question from planning.)
If you'd rather the whole team share a common contact pool - so two brokers don't cold-call the
same prospect - that's a small rule change we can make. Flag your preference.

**The deal fields match the Deal Desk exactly**, so "Save to CRM" maps straight across with no
rework, and the future Outlook button writes to the same place.

---

## One-time setup (when we're ready to build)

You don't need to understand the SQL - just create the accounts and paste. I'll be with you.

### A. Create the Supabase project (you - ~5 min)
1. Go to **supabase.com** -> sign up (use the Holiner account/email so the company owns it).
2. **New project** -> name it `holiner-crm` -> pick a strong database password (save it) ->
   region: pick the closest US region.
3. When it finishes, open **SQL Editor** -> **New query** -> paste all of `schema.sql` -> **Run**.
   It should say success. That's the whole database built.
4. From **Project Settings -> API**, copy two things and send them to me:
   - the **Project URL** (looks like `https://xxxx.supabase.co`)
   - the **anon public** key (a long string - safe to share; it only works with the security rules on)

### B. Turn on "Sign in with Microsoft" (needs a Microsoft 365 admin - David or IT)
This is the one step that needs company Microsoft admin rights. ~10 min, free, one time.
1. **portal.azure.com** -> **Microsoft Entra ID** -> **App registrations** -> **New registration**.
2. Name: `Holiner Toolkit`. Accounts: **this organizational directory only**.
   Redirect URI: choose **Web** and paste `https://<your-project-url>.supabase.co/auth/v1/callback`
   (the Project URL from step A).
3. **Register**, then copy the **Application (client) ID** and **Directory (tenant) ID**.
4. **Certificates & secrets** -> **New client secret** -> copy the **Value** immediately.
   > IMPORTANT: this secret **expires** (pick the longest option, e.g. 24 months) and must be
   > renewed before it lapses, or Microsoft login stops working. We'll put a calendar reminder.
5. **API permissions** -> ensure **email, openid, profile, User.Read** (Microsoft Graph, delegated)
   are present -> **Grant admin consent**.
6. Send me the **client ID**, **tenant ID**, and **secret value**.

### C. Connect them (me)
I plug B's values into Supabase (Authentication -> Providers -> Azure) and wire the login into the
toolkit. Then a test link for you + David to try.

### D. Make David an admin (one line, after he signs in once)
David signs in to the test link once (this creates his profile). Then in Supabase SQL Editor:
```sql
update public.profiles set role = 'admin' where email = 'david@holiner.com';
```
(use his real Microsoft/Outlook address). Done - he now sees everyone's deals.

---

## If Microsoft admin access is a problem
Everything above stays the same except step B. We swap Microsoft sign-in for **magic email links**
(enter email -> click the link we send -> you're in). No IT approval, no passwords. We can even
start on magic-links to launch fast and switch to Microsoft later without losing any data.

---

## How this grows later (nothing here blocks it)
- **Outlook button** - a one-click add-in that reads an email and creates a contact/deal in *this*
  same database. Rides on the same Microsoft app registration from step B.
- **AI auto-extract** - drag an LOI/lease in and it fills the fields. Stays off (zero cost) until
  approved; the copy-a-prompt-into-Claude workflow keeps working in the meantime.
- **More fields / tables** (tasks, activity log, attached documents) - added incrementally, never
  a rebuild.

---

## Status
**DRAFT - not deployed, no accounts created yet.** Reviewing the design before building.
