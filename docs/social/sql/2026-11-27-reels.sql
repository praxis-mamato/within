insert into social_posts (scheduled_at, media_type, video_url, cover_url, caption, image_url, status) values
('2026-11-26 16:30:00+00','REELS','https://withinoracle.app/social/reels/2026-11-26.mp4','https://withinoracle.app/social/reels/2026-11-26-cover.jpg',$q$Mars is in Virgo, where drive goes into detail, lists and repairs. ♂

It entered Virgo on Nov 25 and squares Uranus at 3°18' on Dec 4, so plan for surprises. Ask the Oracle which house Virgo fills in your chart: link in bio.

What's moving today: withinoracle.app/astrology-today

#mars #virgo #astrology #transits #happythanksgiving$q$,NULL,'queued'),
('2026-11-27 16:30:00+00','REELS','https://withinoracle.app/social/reels/2026-11-27.mp4','https://withinoracle.app/social/reels/2026-11-27-cover.jpg',$q$Venus sextiles Jupiter on Nov 28, exact at 26°40' (Venus in Libra, Jupiter in Leo). ♀

A friendly angle for gifts, warmth and saying thank you. Air and fire support each other: charm meets confidence.

Ask the Oracle which houses Libra and Leo fill in your chart: link in bio.

What's moving today: withinoracle.app/astrology-today

#venus #jupiter #astrology #transits #libra$q$,NULL,'queued'),
('2026-12-02 16:30:00+00','REELS','https://withinoracle.app/social/reels/2026-12-02.mp4','https://withinoracle.app/social/reels/2026-12-02-cover.jpg',$q$Mercury squares Jupiter on Friday, Dec 4, exact at 26°53' (Mercury in Scorpio, Jupiter in Leo). ☿

Jupiter inflates whatever it touches, so promises can outrun the details. A good habit that day: put numbers and dates in writing.

Ask the Oracle which houses Scorpio and Leo fill in your chart: link in bio.

What's moving today: withinoracle.app/astrology-today

#mercury #jupiter #astrology #transits #scorpio$q$,NULL,'queued'),
('2026-12-05 16:30:00+00','REELS','https://withinoracle.app/social/reels/2026-12-05.mp4','https://withinoracle.app/social/reels/2026-12-05-cover.jpg',$q$Mercury enters Sagittarius on Dec 6. ☿

Sagittarius is Mercury's detriment: big ideas, loose details. Worth reading messages twice before sending, since the tone can run bigger than meant.

Ask the Oracle which house Sagittarius fills in your chart: link in bio.

What's moving today: withinoracle.app/astrology-today

#mercury #sagittarius #astrology #transits #communication$q$,NULL,'queued'),
('2026-12-06 16:30:00+00','REELS','https://withinoracle.app/social/reels/2026-12-06.mp4','https://withinoracle.app/social/reels/2026-12-06-cover.jpg',$q$Mercury trines Neptune on Monday, Dec 7, exact at 1°37' (Mercury in Sagittarius, Neptune in Aries). ✦

Intuition and words line up, which suits writing, music and brainstorming. Neptune blurs facts, so keep the details clear on paper.

Ask the Oracle which houses Sagittarius and Aries fill in your chart: link in bio.

What's moving today: withinoracle.app/astrology-today

#mercury #neptune #astrology #transits #sagittarius$q$,NULL,'queued'),
('2026-12-07 16:30:00+00','REELS','https://withinoracle.app/social/reels/2026-12-07.mp4','https://withinoracle.app/social/reels/2026-12-07-cover.jpg',$q$New Moon in Sagittarius: Dec 8 in the evening for the US (Dec 9, 00:52 UTC), at 16°57'. 🌑

Whole-sign houses from your Sun sign show where it lands, so read your rising sign too. Pause on yours.

What's moving today: withinoracle.app/astrology-today

#newmoon #sagittarius #astrology #houses #moonphases$q$,NULL,'queued'),
('2026-12-08 16:30:00+00','REELS','https://withinoracle.app/social/reels/2026-12-08.mp4','https://withinoracle.app/social/reels/2026-12-08-cover.jpg',$q$Tonight (Dec 8 in the US, 00:52 UTC on Dec 9): New Moon at 16°57' Sagittarius, plus Mercury square Mars (4°53') and Venus square Pluto (3°45') on Dec 9. 🌑

A fresh start with some friction: sharp words and strong pulls in love and money. Write the intention, then pause before you send the hard message.

Ask the Oracle which houses are lit for you: link in bio.

What's moving today: withinoracle.app/astrology-today

#newmoon #sagittarius #astrology #transits #intentions$q$,NULL,'queued'),
('2026-12-09 16:30:00+00','REELS','https://withinoracle.app/social/reels/2026-12-09.mp4','https://withinoracle.app/social/reels/2026-12-09-cover.jpg',$q$Saturn stations direct on Dec 10 at 7°55' Aries, after 137 days retrograde. 🪐

At a station a planet looks still from Earth, and its themes can feel loudest. Commitments you reviewed since July may start to move forward.

Ask the Oracle which house Aries fills in your chart: link in bio.

What's moving today: withinoracle.app/astrology-today

#saturn #saturndirect #astrology #aries #transits$q$,NULL,'queued'),
('2026-12-10 16:30:00+00','REELS','https://withinoracle.app/social/reels/2026-12-10.mp4','https://withinoracle.app/social/reels/2026-12-10-cover.jpg',$q$Saturn turns direct today, Dec 10, at 7°55' Aries. 🪐

In the Vedic zodiac Saturn sits in Pisces, in Uttara Bhadrapada nakshatra. A simple use of the day: pick one commitment from this year and give it a steady schedule.

Ask the Oracle which house Aries fills in your chart: link in bio.

What's moving today: withinoracle.app/astrology-today

#saturn #saturndirect #vedicastrology #astrology #aries$q$,NULL,'queued')
on conflict do nothing returning id, scheduled_at::date d, media_type;
