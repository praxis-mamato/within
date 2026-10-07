-- Opt-in usage counts and crash reports (docs/next-features.md B5). The app sends rows here only
-- after the person turns sharing on, and only allowlisted enums and numbers (app/src/services/telemetry.ts).
-- Anyone may insert; nobody but the service role may read. Columns are bounded so free text can't fit.

create table if not exists public.usage_events (
  id bigint generated always as identity primary key,
  install_id uuid not null,
  event text not null check (event in (
    'app_opened', 'onboarding_step', 'onboarding_finished', 'reflection_opened', 'step_chosen',
    'follow_up_done', 'feedback_given', 'reading_opened', 'paywall_shown', 'checkout_started', 'today_finished'
  )),
  props jsonb not null default '{}'::jsonb check (jsonb_typeof(props) = 'object' and octet_length(props::text) <= 256),
  app_version text not null check (app_version ~ '^[0-9]+\.[0-9]+\.[0-9]+$'),
  created_at timestamptz not null default now()
);

create table if not exists public.crash_reports (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('error', 'unhandled_rejection', 'render')),
  name text not null check (name ~ '^[A-Za-z]{1,40}$'),
  frames text[] not null default '{}' check (cardinality(frames) <= 8 and octet_length(array_to_string(frames, ',')) <= 800),
  route text not null check (route ~ '^[a-z0-9/:-]{1,80}$'),
  app_version text not null check (app_version ~ '^[0-9]+\.[0-9]+\.[0-9]+$'),
  created_at timestamptz not null default now()
);

alter table public.usage_events enable row level security;
alter table public.crash_reports enable row level security;

create policy "anyone may add a usage event" on public.usage_events for insert to anon, authenticated with check (true);
create policy "anyone may add a crash report" on public.crash_reports for insert to anon, authenticated with check (true);
-- No select, update, or delete policies: rows are read only with the service role (dashboard, SQL editor).

create index if not exists usage_events_event_time on public.usage_events (event, created_at);
create index if not exists usage_events_install on public.usage_events (install_id, created_at);
create index if not exists crash_reports_time on public.crash_reports (created_at);

comment on table public.usage_events is 'Opt-in usage counts. Enums and numbers only, never text or personal details.';
comment on table public.crash_reports is 'Opt-in crash reports: error type, code locations, and route pattern. Never error messages.';

-- Funnel and return views for the pilot measures (PRD §3, §11). Readable only with the service role.
create or replace view public.weekly_funnel with (security_invoker = true) as
select
  date_trunc('week', created_at) as week,
  count(distinct install_id) filter (where event = 'onboarding_step' and props->>'step' = '1') as started,
  count(distinct install_id) filter (where event = 'onboarding_finished') as finished_onboarding,
  count(distinct install_id) filter (where event = 'step_chosen') as chose_step_or_pause,
  count(distinct install_id) filter (where event = 'follow_up_done') as followed_up,
  count(distinct install_id) filter (where event = 'paywall_shown') as saw_paywall,
  count(distinct install_id) filter (where event = 'checkout_started') as started_checkout
from public.usage_events
group by 1;

revoke all on public.weekly_funnel from anon, authenticated;
