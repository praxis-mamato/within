-- Count gift checkouts and gifts bought in the opt-in usage numbers (no details).
alter table public.usage_events drop constraint if exists usage_events_event_check;
alter table public.usage_events add constraint usage_events_event_check check (event in (
  'app_opened', 'onboarding_step', 'onboarding_finished', 'reflection_opened', 'step_chosen',
  'follow_up_done', 'feedback_given', 'reading_opened', 'paywall_shown', 'checkout_started', 'today_finished',
  'astrologer_checkout', 'moon_calendar', 'oracle_asked', 'oracle_chat', 'gift_checkout', 'gift_bought'
));
