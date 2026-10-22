# Maggie's to-do list

Kept by Claude. Things only Maggie can do (account-owner steps), most urgent first.

## Urgent
1. **Instagram token (posting is paused until this is done, ~3 min, on a computer).** developers.facebook.com → My Apps → Within publisher → Instagram → API setup with Instagram login → Generate token (log in as withintheoracle, allow; accept the tester invite in Instagram if asked) → copy it → Supabase → Edge Functions → Secrets → replace `INSTAGRAM_TOKEN`. Then tell Claude "done". Never paste the token in chat.
2. **Google sign-in address (~2 min, on a computer).** console.cloud.google.com → APIs & Services → Credentials → the OAuth client starting `910611896205-fm4fq…` → Authorized JavaScript origins: add `https://withinoracle.app` and `https://www.withinoracle.app` → Save. Then tell Claude, who switches on Google's own button (people will see withinoracle.app instead of the Supabase address).

## This week
3. **Google branding.** Same console → Google Auth Platform → Branding: app name Within, crystal ball logo, home page https://withinoracle.app, privacy https://withinoracle.app/privacy/, authorized domain withinoracle.app → Submit for verification (free, a few days).
4. **Approve the readings.** withinoracle.app/#/review: 0 approved so far.
5. **App stores.** Answer: is there a registered company (e.g. Praxis Global)? Start the Android rebuild and iPhone app? Join the Apple Developer Program ($99/yr).
6. **Shannon.** Open the old link once (moves her data), delete the old icon, add withinoracle.app to the home screen, sign in with the email she paid with.

## When there's time
7. Microsoft Store, Product Hunt (Tue Oct 27) and AlternativeTo: steps in `docs/growth/launch/LAUNCH-KIT.md`.
8. Ads: yes or no on a $100–150 test around Nov 3.
9. Safety: check the in-app emergency numbers; decide out-of-hours cover for safety flags.
10. Within for Claude: Cloudflare Workers Paid + `CLOUDFLARE_API_TOKEN`; Supabase → Authentication → OAuth Server on (path `/oauth/consent`, dynamic registration). After readings are approved.
11. Two-factor authentication on Instagram.
12. Decide on "About me" personalization (Claude's proposal: who you are, who's in your life, what you're facing) and say what "public project" meant.
