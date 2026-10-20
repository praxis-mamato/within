# Launch kit: Microsoft Store + Product Hunt

Everything to paste is below. Images are in `docs/growth/launch/images/`.

Site: https://withinoracle.app/
Privacy: https://withinoracle.app/privacy/
Support email: privacy@praxisglobal.ai

---

## 1. Microsoft Store (about 30 minutes, free)

### A. Make the developer account
1. Go to **storedeveloper.microsoft.com** → **Get started** → sign in with a Microsoft account (make one with privacy@praxisglobal.ai if you don't have one).
2. Choose **Individual**. Publisher display name: **Within**.
3. Do the ID check (photo of your ID + selfie). No card, no phone needed. Approval can take a day or two.

### B. Reserve the app name
1. In **Partner Center** → **Apps and games** → **+ New product** → **MSIX or PWA app**.
2. Name: **Within: The Oracle**. If taken, try **Within Oracle Astrology**.
3. Open the app → **Product management** → **Product identity**. Keep this tab open; you need three lines from it:
   - Package/Identity/Name
   - Package/Identity/Publisher (starts `CN=`)
   - Package/Properties/PublisherDisplayName

### C. Make the Windows package
1. Go to **pwabuilder.com**, paste the site link, **Start** → **Package for stores** → **Windows** → **Generate package**.
2. Paste the three lines from step B into Package ID, Publisher ID and Publisher display name. App name: same as you reserved. Version: `1.0.0`.
3. Download the zip and unzip it. You'll upload the `.msixbundle` file (and the `.classic.appxbundle` if there is one).

### D. Fill in the submission (Partner Center → your app → Start submission)
- **Pricing and availability:** Free. All markets.
- **Properties:** Category **Lifestyle**. Privacy policy URL: the privacy link above. Website: the site link. Support contact: privacy@praxisglobal.ai. Leave the other boxes as they are.
- **Age ratings:** Answer the questionnaire honestly: no violence, no gambling, no user-to-user chat, and the app does sell digital goods. It usually comes out as 3+ or 7+.
- **Packages:** Upload the file(s) from step C.
- **Store listings → English:** paste the text below and upload the 4 images named `store-*.png`.
- **Submission options:** Leave the defaults. **Submit.**

Microsoft reviews it in 1–3 business days. You'll get an email when it's live.

### Store listing text

**Description**

Ask the Oracle anything, and the stars answer from your own birth chart.

Within reads your exact chart, to the minute and the place you were born, in two traditions at once: Western and Vedic. Ask about love, work, money, family, a decision or a date, and you get a plain answer with the reasons behind it and the days that matter for you.

What you can ask:
• When is a good day to ask for a raise?
• Should I reach out to them?
• What am I moving through this year?
• What is Uranus doing to my chart right now?

What's inside:
• Answers built from your own chart, not your sun sign
• Your transits, progressions, solar return and Vedic periods, with exact dates
• Your best and hardest days ahead
• Relationships: compare two charts
• A private journal to see your patterns over time
• Live readings with an astrologer, voice only for the first session

Accurate planet positions: Within matches Swiss Ephemeris, the professional standard, on 99.97% of checks.

Private by design: your birth details, chart, questions and journal stay on your device. We don't receive them, and nothing is used to train any model.

Free: 3 questions a day. Membership unlocks unlimited questions and the full reading behind every answer. Yearly includes 14 days free for new members. Cancel anytime in Account.

For reflection, not prediction. Not medical, legal, financial or mental health advice.

**Short description**

Ask the Oracle anything. Answers from your exact birth chart, Western and Vedic, with the dates that matter for you.

**Product features** (one per box)
- Ask anything and get an answer from your own birth chart
- Western and Vedic astrology in one reading
- Your transits, progressions, solar return and dasha periods with exact dates
- Best and hardest days ahead, planet by planet
- Compare two charts for relationships
- Private journal that stays on your device
- Live readings with an astrologer

**Search terms** (up to 7)
astrology, birth chart, horoscope, vedic astrology, transits, natal chart, zodiac

**Copyright:** © 2026 Within

---

## 2. Product Hunt (launch day: a Tuesday, 12:01am Pacific)

### Before launch day
1. Make a **personal** account at producthunt.com (Product Hunt doesn't allow brand accounts). Use your name and a photo; you're the maker.
2. For the week before, upvote and leave a real comment on 3–4 other launches. New accounts sometimes can't post right away, and activity helps.
3. **Pick the date:** Tuesday **Oct 27**. Click **Submit** (top right) → **Launch a product** → paste the site link → fill in the fields below → **Schedule** for Oct 27, 12:01am PT.

### Fields

**Name:** Within

**Tagline** (60 characters max):
Ask the Oracle anything. Answers from your own birth chart.

**Description** (260 characters max):
Within reads your exact birth chart, Western and Vedic, and answers any question with the reasons and the dates that matter for you. Your chart and questions stay on your device. 3 free questions a day.

**Topics:** type "astrology" and pick from what it suggests, plus Lifestyle

**Pricing:** Free options

**Thumbnail:** `images/ph-thumb.png`

**Gallery:** `images/ph-1.png` to `ph-4.png`, in order

**Links:** the site link

### First comment (post it the minute the launch goes live)

Hi Product Hunt 👋

I've spent five years studying astrology and giving readings, and I kept seeing the same gap. Horoscope apps read your sun sign, and chatbots guess. Nothing answered *your* question from *your* exact chart.

So I built Within. You enter your birth date, time and place, then ask anything: "When is a good day to ask for a raise?", "What am I moving through this year?" The Oracle reads your chart against the sky and answers with the reasons and the dates.

A few things I cared about:
• **Accuracy:** planet positions match Swiss Ephemeris on 99.97% of checks
• **Two traditions:** Western and Vedic in one reading
• **Privacy:** your birth details, chart and questions stay on your device; we never receive them

You get 3 free questions a day. I'd love to hear what you ask and whether the answer landed. I'm here all day to answer questions.

### On launch day
- Reply to every comment, the same day.
- Share the launch link on your Instagram story: "We're live on Product Hunt today."
- Don't ask anyone to upvote. It's against the rules and Product Hunt can hide the launch.

---

## 3. AlternativeTo (10 minutes, free)

Do this **after** the new domain is live, so the listing links to it.

1. Make an account at **alternativeto.net** (Sign up, top right).
2. Go to **alternativeto.net/software/new** (or the **+ Add app** button).
3. Fill in:

**Name:** Within

**Website:** the new domain

**Short description:**
Ask the Oracle anything and get an answer from your exact birth chart, Western and Vedic, with the dates that matter for you.

**Description:**
Within is an astrology app built around the Oracle: ask any question about love, work, money, family, timing or a decision, and it answers from your own birth chart, not your sun sign. Each answer comes with the reasons behind it and your dates: transits, progressions, solar return and Vedic dasha periods.

Planet positions match Swiss Ephemeris on 99.97% of checks. Your birth details, chart, questions and journal stay on your device. 3 free questions a day; a membership unlocks unlimited questions and the full reading. Live one-to-one readings with an astrologer are also available.

**License / pricing:** Freemium

**Platforms:** Online (web), Android (add Windows once it's in the Microsoft Store)

**Categories:** Lifestyle → Astrology (or Lifestyle if Astrology isn't offered)

**Tags:** astrology, birth-chart, horoscope, vedic-astrology, privacy-focused

**Alternative to:** Co–Star, The Pattern, CHANI, Sanctuary, TimePassages

**Screenshots:** `images/ph-1.png` to `ph-4.png`
**Logo:** `images/ph-thumb.png`

Listings are checked by moderators and usually appear in a few days.
