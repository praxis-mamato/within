# Setting up sign-in and payments (test mode)

The app already runs in **demo mode** at https://praxis-mamato.github.io/within/: Apple and Google sign-in, the email-link check, the $9.99/month and $100/year plans, and cancel/delete all work there, simulated on your device. This guide switches it to **live test mode**: real Apple and Google sign-in and real Stripe checkout with test cards (no money moves).

**Who does what**

| Step | Who | Time |
|---|---|---|
| 1. Supabase settings | Claude, once the Supabase connector is on (or you, in the dashboard) | 10 min |
| 2. Stripe test products, webhook, portal | Claude, once the Stripe connector is on (or you) | 10 min |
| 3. Google sign-in credentials | **You** (Google Cloud Console; no connector exists) | 10 min |
| 4. Apple sign-in credentials | **You** (needs an Apple Developer Program membership, $99/year) | 20 min |
| 5. Turn live mode on for everyone | Claude (one line in `app/.env.production`) | 1 min |

To let Claude do steps 1–2: connect **Supabase** and **Stripe** at https://claude.ai/customize/connectors, then start a new session (connectors load when a session starts).

Throughout, `<ref>` is your Supabase project reference: **`lykmusmsfwvaeqxtsbrc`**.

---

## Status (Oct 6, 2026)

Done through the Supabase connector, project `lykmusmsfwvaeqxtsbrc` ("praxis-mamato's Project", us-east-1):
- `entitlements` table with row-level security (one policy: people read their own row). Security advisor: clean apart from an empty test table, `within_ping`, which is locked down; delete it in the Table Editor.
- Edge functions deployed and active: `create-checkout`, `stripe-webhook` (signature-checked, no JWT), `billing-portal`, `delete-account`.
- The web app has the project URL and publishable key (`app/.env.production`).
- **Live mode is off for everyone** (`VITE_LIVE=false`). Open https://praxis-mamato.github.io/within/?live=1 to use live mode in your own browser; `?live=0` switches back.

Still needed: the Supabase dashboard settings in step 1 (URL configuration, providers, secrets; the connector can't change these), Stripe (step 2), Google (step 3), Apple (step 4). Then set `VITE_LIVE=true`.

## 1. Supabase

Your Supabase project is connected to this GitHub repo, so the `supabase/` folder deploys from git:

- `supabase/migrations/20261006000000_entitlements.sql`: the one table we keep (subscription status), readable only by its owner.
- `supabase/functions/`: `create-checkout`, `stripe-webhook`, `billing-portal`, `delete-account`.
- `supabase/config.toml`: auth settings and the webhook's signature-only access.

In the Supabase dashboard:

1. **Integrations → GitHub:** confirm the repo is `praxis-mamato/within`, the working directory is `.` (the repo root, which contains `supabase/`), and the production branch is the one you deploy from (currently `claude/epic-gates-6t5iqb`). Turn on automatic deploys to production. If edge functions don't appear under **Edge Functions** after a push, deploy them once with the Supabase CLI: `supabase functions deploy --project-ref <ref>`.
2. **Authentication → URL Configuration:** Site URL `https://praxis-mamato.github.io/within/`. Redirect URLs: `https://praxis-mamato.github.io/within/`, `http://localhost:5173/`.
3. **Authentication → Sign In / Providers:**
   - **Email:** on, with sign-ups off. It's used only for the email-link check, never to create accounts.
   - **Google** and **Apple:** fill in from steps 3 and 4.
4. **Edge Functions → Secrets:** add

   | Name | Value |
   |---|---|
   | `STRIPE_SECRET_KEY` | `sk_test_…` (step 2) |
   | `STRIPE_PRICE_MONTHLY` | `price_…` for $9.99/month |
   | `STRIPE_PRICE_YEARLY` | `price_…` for $100/year |
   | `STRIPE_WEBHOOK_SECRET` | `whsec_…` (step 2) |
   | `SITE_URLS` | `https://praxis-mamato.github.io/within/,http://localhost:5173/` |

5. **Project Settings → API:** copy the **Project URL** and the **anon / publishable key** for step 5. (These two are public by design: row-level security limits what they can read. Never share the `service_role` key.)

**Email delivery:** Supabase's built-in email sender allows only a few emails an hour, which is fine for testing. Before launch, add your own SMTP sender (for example Resend or Postmark) under **Authentication → Emails → SMTP**.

## 2. Stripe (test mode)

1. Turn on **Test mode** (top right of the dashboard).
2. **Product catalog → Add product:** name "Within", with two prices:
   - $9.99 USD, recurring, monthly
   - $100.00 USD, recurring, yearly

   Copy both price IDs into the Supabase secrets.
3. **Developers → API keys:** copy the secret key (`sk_test_…`) into `STRIPE_SECRET_KEY`.
4. **Developers → Webhooks → Add endpoint:**
   - URL: `https://<ref>.supabase.co/functions/v1/stripe-webhook`
   - Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`

   Copy the signing secret (`whsec_…`) into `STRIPE_WEBHOOK_SECRET`.
5. **Settings → Billing → Customer portal:** allow canceling, updating the payment method, and switching between the two prices.

## 3. Google sign-in

1. https://console.cloud.google.com → create a project named "Within".
2. **APIs & Services → OAuth consent screen (Google Auth Platform):** External; app name "Within"; your support email; authorized domain `supabase.co`. Leave it in **Testing** and add the Google accounts that will test it.
3. **Clients → Create client → Web application:**
   - Authorized JavaScript origins: `https://praxis-mamato.github.io`
   - Authorized redirect URI: `https://<ref>.supabase.co/auth/v1/callback`
4. Paste the Client ID and Client secret into Supabase → Google provider.

## 4. Apple sign-in

Requires an Apple Developer Program membership. At https://developer.apple.com/account → **Certificates, Identifiers & Profiles**:

1. **Identifiers → App IDs → +:** `com.within.app` (or your own reverse domain), with **Sign in with Apple** checked. The iOS app will use this later.
2. **Identifiers → Services IDs → +:** `com.within.web`. Enable Sign in with Apple, then **Configure**:
   - Primary App ID: the one above
   - Domains: `<ref>.supabase.co`
   - Return URLs: `https://<ref>.supabase.co/auth/v1/callback`
3. **Keys → +:** enable Sign in with Apple, linked to the App ID. Download the `.p8` file (only once). Note the **Key ID** and your **Team ID**.
4. Supabase → Apple provider: Client IDs `com.within.web`. For the secret key, use Supabase's Apple secret generator (linked from the provider panel) with the Team ID, Key ID, Services ID, and `.p8`. **This secret expires every 6 months**; set a reminder.
5. **Account deletion revokes Apple's token** (App Store 5.1.1(v)). In Supabase → Edge Functions → Secrets, add `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_CLIENT_ID` (`com.within.web` for the website; the iOS app's bundle ID once it exists), and `APPLE_PRIVATE_KEY` (the whole `.p8` file). Without them, deletion still works but the token isn't revoked.
6. So the email-link check reaches people who hid their email with Apple: **Services → Sign in with Apple for Email Communication**, register the address Supabase sends from.

## 5. Switch the public site to live test mode

The Supabase URL and publishable key are already in `app/.env.production`. When steps 1–4 are done, change `VITE_LIVE=false` to `VITE_LIVE=true` there (or ask Claude to) and push; the site rebuilds in about a minute. Before that, test live mode in your own browser with `?live=1`. The demo-mode note disappears from the Account screen when live mode is on.

---

## Test plan

Use Stripe test cards with any future expiry date, any CVC, and any postcode.

| # | Do this | Expect |
|---|---|---|
| 1 | Open the site signed out, finish onboarding | Everything up to the first reflection works with no account |
| 2 | Open Your Reading, scroll past the first section | Paywall with $100/year (preselected) and $9.99/month |
| 3 | Continue with Google | Google consent screen, then back in the app, signed in |
| 4 | Account → Email me a link → open it on the same device | "This device: confirmed" |
| 5 | Subscribe, monthly, card `4242 4242 4242 4242` | Stripe Checkout, then back; within a few seconds the reading unlocks |
| 6 | Stripe dashboard → Customers | One customer with an active $9.99 subscription |
| 7 | Account → Manage or cancel → cancel | Account shows "ends …, won’t renew"; content stays unlocked until then |
| 8 | Repeat with Apple and the yearly plan, card `4000 0025 0000 3155` | Extra authentication step, then active yearly |
| 9 | Try card `4000 0000 0000 9995` | Payment declined in Checkout; nothing unlocks |
| 10 | Sign in on a second browser | Must pass the email link before subscribing or deleting |
| 11 | Write something that raises a safety flag in the journal, then open a locked reflection | A calm "part of a subscription" note, **no** subscribe button |
| 12 | Account → Delete my account | Subscription canceled in Stripe, user gone from Supabase, device erased |
| 13 | Repeat 12 with an Apple account, then check appleid.apple.com → Sign in with Apple | Within no longer listed; the function returned `appleRevoked: true` |

## Still to do before real customers

- In-app purchase for the iOS and Android apps (Apple and Google require it for subscriptions sold in-app; RevenueCat plan in `docs/next-features.md` B2).
- Add the Apple secrets in step 4.5 so account deletion revokes Apple's token.
- Your own SMTP sender, privacy policy, Stripe live mode, and template approval.
