-- =====================================================================
-- Holiner CRM - database structure + security rules  (DRAFT)
-- Target: Supabase (PostgreSQL 15+)
-- How to use: Supabase dashboard -> SQL Editor -> paste this whole file -> Run.
-- Safe to re-run: every statement is "create if not exists" / "drop ... then create".
--
-- What this sets up:
--   * three tables: profiles (people), contacts, deals
--   * automatic profile creation the first time someone signs in
--   * row-level security so each broker sees ONLY their own rows,
--     and an admin (the CEO) can see everyone's.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1) PROFILES  - one row per person who signs in.
--    "role" decides what they can see:  broker = their own,  admin = all.
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  full_name  text,
  role       text not null default 'broker' check (role in ('broker','admin')),
  created_at timestamptz not null default now()
);

-- When a new person signs in with Microsoft for the first time, Supabase
-- creates their login automatically. This trigger mirrors that into a
-- profile row so we always have their name/email on hand.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name',
             new.raw_user_meta_data->>'name',
             new.email)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper used by the security rules below: "is the current user an admin?"
-- It is SECURITY DEFINER on purpose, which lets it read the profiles table
-- without tripping the row-level rules (avoids an infinite loop).
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;


-- ---------------------------------------------------------------------
-- 2) CONTACTS  - people/companies a broker is working. "owner" is the
--    broker who created it; it fills in automatically on insert.
-- ---------------------------------------------------------------------
create table if not exists public.contacts (
  id         uuid primary key default gen_random_uuid(),
  owner      uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  name       text not null,
  company    text,
  email      text,
  phone      text,
  type       text,          -- Buyer / Seller / Tenant / Landlord / Broker
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- 3) DEALS  - the core CRM record. Mirrors the fields the Deal Desk
--    already collects, so saving from the tool is a direct match.
-- ---------------------------------------------------------------------
create table if not exists public.deals (
  id               uuid primary key default gen_random_uuid(),
  owner            uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  deal_name        text not null,
  deal_type        text,        -- Tenant Rep / Landlord Rep / Buyer Rep / Seller Rep / Leasing Rep
  stage            text default 'Executed',
  asset_type       text,        -- Office / Retail / Industrial / Land / Multifamily
  property_address text,
  deal_value       numeric,
  commission_rate  text,        -- as written, e.g. "4%" or "$2.00/SF"
  commission_owed  numeric,
  invoice_status   text default 'Draft',
  close_date       date,
  contact_id       uuid references public.contacts(id) on delete set null,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists deals_owner_idx    on public.deals(owner);
create index if not exists contacts_owner_idx on public.contacts(owner);

-- keep "updated_at" current on every edit
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists deals_touch on public.deals;
create trigger deals_touch before update on public.deals
  for each row execute function public.touch_updated_at();

drop trigger if exists contacts_touch on public.contacts;
create trigger contacts_touch before update on public.contacts
  for each row execute function public.touch_updated_at();


-- ---------------------------------------------------------------------
-- 4) ROW-LEVEL SECURITY  - the wall between brokers.
--    Rules on the same table combine with OR, so:
--      * a broker matches "owner = me"      -> sees/edits their own
--      * an admin matches "is_admin()"       -> sees everyone's (read-only)
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.contacts enable row level security;
alter table public.deals    enable row level security;

-- PROFILES: see & edit your own; admins can see all.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update
  using (id = auth.uid());

-- CONTACTS: owner has full control; admin gets a read-only overview.
drop policy if exists contacts_owner_all on public.contacts;
create policy contacts_owner_all on public.contacts for all
  using (owner = auth.uid()) with check (owner = auth.uid());

drop policy if exists contacts_admin_read on public.contacts;
create policy contacts_admin_read on public.contacts for select
  using (public.is_admin());

-- DEALS: owner has full control; admin gets a read-only overview.
drop policy if exists deals_owner_all on public.deals;
create policy deals_owner_all on public.deals for all
  using (owner = auth.uid()) with check (owner = auth.uid());

drop policy if exists deals_admin_read on public.deals;
create policy deals_admin_read on public.deals for select
  using (public.is_admin());


-- ---------------------------------------------------------------------
-- 5) CONVENIENCE VIEW  - deals with the broker's name attached, for the
--    admin dashboard. "security_invoker" makes the view obey the same
--    row rules as whoever is looking (so brokers still see only theirs).
-- ---------------------------------------------------------------------
create or replace view public.deals_with_broker
  with (security_invoker = true) as
  select d.*, p.full_name as broker_name, p.email as broker_email
  from public.deals d
  join public.profiles p on p.id = d.owner;


-- ---------------------------------------------------------------------
-- 6) API ACCESS  - only signed-in users touch the data (never the public).
-- ---------------------------------------------------------------------
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.contacts to authenticated;
grant select, insert, update, delete on public.deals    to authenticated;
grant select, update                 on public.profiles to authenticated;
grant select                         on public.deals_with_broker to authenticated;


-- =====================================================================
-- AFTER David (CEO) signs in once, make him an admin by running this
-- ONE line (replace the email with his real Microsoft/Outlook address):
--
--   update public.profiles set role = 'admin' where email = 'david@holiner.com';
--
-- To add another admin later, run the same line with their email.
-- =====================================================================
