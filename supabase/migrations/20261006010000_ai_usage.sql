-- Monthly AI deep-reading counts per person (for the monthly limit and cost tracking).
-- No reading content is stored.
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  period text not null check (period ~ '^\d{4}-\d{2}$'),
  count integer not null default 0,
  input_tokens bigint not null default 0,
  output_tokens bigint not null default 0,
  primary key (user_id, period)
);
alter table public.ai_usage enable row level security;
create policy "read own ai usage" on public.ai_usage
  for select to authenticated using ((select auth.uid()) = user_id);

-- Atomic increment, callable only by the server (service role).
create or replace function public.record_ai_usage(p_user uuid, p_period text, p_in bigint, p_out bigint)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.ai_usage (user_id, period, count, input_tokens, output_tokens)
  values (p_user, p_period, 1, p_in, p_out)
  on conflict (user_id, period) do update
    set count = public.ai_usage.count + 1,
        input_tokens = public.ai_usage.input_tokens + excluded.input_tokens,
        output_tokens = public.ai_usage.output_tokens + excluded.output_tokens;
$$;
revoke all on function public.record_ai_usage(uuid, text, bigint, bigint) from public, anon, authenticated;
grant execute on function public.record_ai_usage(uuid, text, bigint, bigint) to service_role;
