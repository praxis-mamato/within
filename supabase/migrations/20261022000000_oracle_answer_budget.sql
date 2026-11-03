-- Personal Oracle answers are written by AI for every question. These keep the cost predictable:
-- a daily spending cap for the whole app and a daily limit per person. No question or answer is stored.
create table if not exists public.ai_spend (
  day date primary key,
  micro_usd bigint not null default 0
);
create table if not exists public.ai_rate (
  day date not null,
  key text not null check (length(key) <= 80),
  count integer not null default 0,
  primary key (day, key)
);
alter table public.ai_spend enable row level security;
alter table public.ai_rate enable row level security;

-- Takes one answer from today's allowance for this person, if they and the app are both under their limits.
create or replace function public.ai_answer_take(p_key text, p_limit integer, p_cap_micro bigint)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare spent bigint; used integer;
begin
  select coalesce((select micro_usd from public.ai_spend where day = current_date), 0) into spent;
  if spent >= p_cap_micro then return false; end if;
  insert into public.ai_rate (day, key, count) values (current_date, p_key, 1)
    on conflict (day, key) do update set count = public.ai_rate.count + 1
    returning count into used;
  return used <= p_limit;
end;
$$;

-- Adds the cost of one answer to today's total.
create or replace function public.ai_spend_add(p_micro bigint)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.ai_spend (day, micro_usd) values (current_date, p_micro)
  on conflict (day) do update set micro_usd = public.ai_spend.micro_usd + excluded.micro_usd;
$$;

revoke all on function public.ai_answer_take(text, integer, bigint) from public, anon, authenticated;
revoke all on function public.ai_spend_add(bigint) from public, anon, authenticated;
grant execute on function public.ai_answer_take(text, integer, bigint) to service_role;
grant execute on function public.ai_spend_add(bigint) to service_role;
