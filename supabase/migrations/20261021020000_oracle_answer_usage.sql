-- Oracle answers written by Claude: a daily count per person (signed in) or per network (a salted hash of the
-- address, for people who aren't signed in), plus a daily total across all free answers to cap cost.
-- No question or answer text is stored.
create table if not exists public.oracle_answer_usage (
  key text not null,
  day date not null,
  count integer not null default 0,
  input_tokens bigint not null default 0,
  output_tokens bigint not null default 0,
  primary key (key, day)
);
alter table public.oracle_answer_usage enable row level security;

-- Takes one answer if the key is under its limit for the day: returns the new count, or -1 when the limit is reached.
create or replace function public.take_oracle_answer(p_key text, p_day date, p_limit integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare n integer;
begin
  insert into public.oracle_answer_usage (key, day, count) values (p_key, p_day, 1)
  on conflict (key, day) do update set count = public.oracle_answer_usage.count + 1
    where public.oracle_answer_usage.count < p_limit
  returning count into n;
  return coalesce(n, -1);
end;
$$;

create or replace function public.record_oracle_answer_tokens(p_key text, p_day date, p_in bigint, p_out bigint)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.oracle_answer_usage set input_tokens = input_tokens + p_in, output_tokens = output_tokens + p_out
  where key = p_key and day = p_day;
$$;

revoke all on function public.take_oracle_answer(text, date, integer) from public, anon, authenticated;
revoke all on function public.record_oracle_answer_tokens(text, date, bigint, bigint) from public, anon, authenticated;
grant execute on function public.take_oracle_answer(text, date, integer) to service_role;
grant execute on function public.record_oracle_answer_tokens(text, date, bigint, bigint) to service_role;

alter table public.usage_events drop constraint if exists usage_events_event_check;
alter table public.usage_events add constraint usage_events_event_check check (event in (
  'app_opened', 'onboarding_step', 'onboarding_finished', 'reflection_opened', 'step_chosen',
  'follow_up_done', 'feedback_given', 'reading_opened', 'paywall_shown', 'checkout_started', 'today_finished',
  'astrologer_checkout', 'moon_calendar', 'oracle_asked', 'oracle_chat', 'oracle_answer'
));
