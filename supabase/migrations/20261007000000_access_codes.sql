-- Tester access codes: full access without payment, for testing and comps.
-- Only a SHA-256 hash of each code is stored. Codes are redeemed by a signed-in person
-- through the redeem-code function; nothing here is readable from the app.
create table if not exists public.access_codes (
  code_hash text primary key,
  label text not null,
  days integer not null default 90 check (days between 1 and 366),
  max_uses integer not null default 5 check (max_uses > 0),
  uses integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.access_codes enable row level security;

create table if not exists public.access_code_redemptions (
  code_hash text not null references public.access_codes (code_hash) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  primary key (code_hash, user_id)
);
alter table public.access_code_redemptions enable row level security;

alter table public.entitlements drop constraint if exists entitlements_source_check;
alter table public.entitlements add constraint entitlements_source_check check (source in ('stripe', 'app_store', 'play_store', 'comp'));

-- Redeems a code for a person, atomically. Returns 'ok', 'invalid', 'used_up', 'already', or 'subscribed'.
create or replace function public.redeem_access_code(p_user uuid, p_hash text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.access_codes%rowtype;
  e public.entitlements%rowtype;
begin
  select * into c from public.access_codes where code_hash = p_hash and active for update;
  if not found then return 'invalid'; end if;
  if exists (select 1 from public.access_code_redemptions where code_hash = p_hash and user_id = p_user) then return 'already'; end if;
  if c.uses >= c.max_uses then return 'used_up'; end if;
  select * into e from public.entitlements where user_id = p_user;
  if found and e.status in ('active', 'trialing') and e.source is distinct from 'comp' then return 'subscribed'; end if;
  insert into public.access_code_redemptions (code_hash, user_id) values (p_hash, p_user);
  update public.access_codes set uses = uses + 1 where code_hash = p_hash;
  insert into public.entitlements (user_id, status, plan, source, current_period_end, cancel_at_period_end, updated_at)
  values (p_user, 'active', null, 'comp', now() + make_interval(days => c.days), true, now())
  on conflict (user_id) do update
    set status = 'active', source = 'comp', plan = null,
        current_period_end = now() + make_interval(days => c.days), cancel_at_period_end = true, updated_at = now();
  return 'ok';
end;
$$;
revoke all on function public.redeem_access_code(uuid, text) from public, anon, authenticated;
grant execute on function public.redeem_access_code(uuid, text) to service_role;
