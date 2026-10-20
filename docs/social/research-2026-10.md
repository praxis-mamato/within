# Instagram research, October 2026 (for docs/social/PLAN.md)

Sources were read through search extracts; Meta's developer pages were not reachable directly, so API facts marked "reported" should be checked against the live API.

## Ranking
- Top signals: watch time, likes, sends; sends weigh more for non-followers (Mosseri, Jan 2025). https://searchenginejournal.com/instagram-algorithm-shift-why-sends-matter-more-than-ever/521389
- Every eligible original post is shown to a small non-follower audience first. https://creators.instagram.com/recommendations-and-Originality
- Trial Reels: shown to non-followers only, then shared or archived; eligibility reported as professional accounts (some say 1,000+ followers); schedulable. https://www.socialmediatoday.com/news/instagram-expands-access-trial-reels/752895/
- Hashtags capped at 5 per post (Dec 2025); they help search, not reach. https://www.mymobileindia.com/instagram-limits-hashtags-to-five-per-post-and-reel-heres-key-changes-creators-should-know/
- Search reads captions, on-screen text, alt text and spoken words; ~125 caption characters show before "more". https://www.sendible.com/insights/instagram-character-limit
- Authenticity over polish; AI content to be labelled (Mosseri, Dec 2025). https://om.co/2026/01/01/what-is-instagrams-adam-mosseri-really-saying-in-his-year-end-memo/
- Hook in the first 1–3 seconds; captions on screen (muted viewing). https://www.opus.pro/blog/instagram-reels-hook-formulas
- Best US times: Tue–Thu around midday, Mon/Tue afternoons; weekends and Fridays weaker (Sprout Social, Mar 2026). https://sproutsocial.com/insights/best-times-to-post-on-instagram/
- Organic reach falling overall; no reliable data on new-account growth rates.

## Interactive formats and policy
- Story stickers (poll, quiz, question, Add Yours, link) can only be added in the app. https://www.shopify.com/blog/instagram-stickers
- Single-word comment prompts ("comment YES") can reduce reach as engagement bait; asking people to share/send is fine. https://www.socialmediatoday.com/news/instagram-certain-ctas-impact-post-reach/717732/
- Tag-baiting and comment-baiting are demoted. https://techcrunch.com/2017/12/18/facebook-engagement-bait/
- Originality rule extended to photos and carousels (Apr 2026); watermarks and reposts lose recommendations. https://petapixel.com/2026/04/30/new-instagram-policies-target-reposted-content/
- Comment-to-DM (Private Replies): one message per comment within 7 days; follow-ups only inside a 24-hour window after the person replies. https://developers.facebook.com/documentation/business-messaging/instagram-messaging/features/private-replies.md

## API (Instagram Login)
- Reels: media_type=REELS, MP4/MOV, H.264 + AAC, 9:16, 3 s–15 min, ≤1 GB; cover_url, thumb_offset, share_to_feed, collaborators (up to 3), alt_text, audio_name. https://developers.facebook.com/docs/instagram-platform/content-publishing
- Carousels: media_type=CAROUSEL, up to 10 children; counts as one post.
- Stories: media_type=STORIES (image or video), reported to work for Business accounts only; no stickers, no caption.
- Not possible by API: stickers, licensed music, filters, editing after publishing, Trial Reels (no confirmed parameter).
- Limit: reported 100 (older docs 50) API posts per 24 hours; check /{ig-user-id}/content_publishing_limit.
