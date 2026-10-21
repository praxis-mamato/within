-- "Talk to the Oracle" messages per person per month (for the monthly limit and cost tracking).
-- No conversation content is stored.
alter table public.ai_usage add column if not exists chat_count integer not null default 0;

create or replace function public.record_chat_usage(p_user uuid, p_period text, p_in bigint, p_out bigint)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.ai_usage (user_id, period, chat_count, input_tokens, output_tokens)
  values (p_user, p_period, 1, p_in, p_out)
  on conflict (user_id, period) do update
    set chat_count = public.ai_usage.chat_count + 1,
        input_tokens = public.ai_usage.input_tokens + excluded.input_tokens,
        output_tokens = public.ai_usage.output_tokens + excluded.output_tokens;
$$;
revoke all on function public.record_chat_usage(uuid, text, bigint, bigint) from public, anon, authenticated;
grant execute on function public.record_chat_usage(uuid, text, bigint, bigint) to service_role;

-- Count conversations in the opt-in usage numbers (a turn number only, never what was said).
alter table public.usage_events drop constraint if exists usage_events_event_check;
alter table public.usage_events add constraint usage_events_event_check check (event in (
  'app_opened', 'onboarding_step', 'onboarding_finished', 'reflection_opened', 'step_chosen',
  'follow_up_done', 'feedback_given', 'reading_opened', 'paywall_shown', 'checkout_started', 'today_finished',
  'astrologer_checkout', 'moon_calendar', 'oracle_asked', 'oracle_chat'
));
