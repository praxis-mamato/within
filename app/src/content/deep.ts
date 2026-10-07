/**
 * Subscriber depth library (docs/readings-engine.md, Route A). DRAFT pending approval.
 * Same rules as every library: possibility language, no predictions of events, nothing about
 * what another person thinks, no scores or stay/leave advice. Enforced by deep.test.ts.
 */

/** Planets in houses, hand-written for the five planets read most often. */
export const PLANET_IN_HOUSE: Record<string, Record<number, string>> = {
  Sun: {
    1: 'Your sense of self is visible and direct; people may notice you before you speak, and you may grow by leading with who you are.',
    2: 'Identity may be bound up with what you build and earn; self-worth can grow as you learn what you truly value.',
    3: 'You may come alive through words, learning, and your local world; siblings or neighbors can shape your sense of self.',
    4: 'Home and family may sit at the center of your identity; your roots, and the home you make, can be where you shine most.',
    5: 'Creativity, romance, and play may be where you feel most yourself; you may need outlets that let you be seen enjoying life.',
    6: 'You may find yourself through work, skill, and daily routines; being useful and well can matter to your sense of purpose.',
    7: 'You may come to know yourself through close partnership; relationships can act as a mirror for who you are becoming.',
    8: 'Identity may deepen through intensity, intimacy, and change; you may be drawn to what lies beneath the surface.',
    9: 'You may grow through travel, study, and belief; a philosophy of life can be central to your sense of self.',
    10: 'Career and public life may be where you shine; you may want your life’s work to reflect who you are.',
    11: 'Friends, groups, and shared causes may shape your identity; you may feel most yourself among people who share your hopes.',
    12: 'Your sense of self may be private and inward; solitude, reflection, or quiet service can be where you recharge.',
  },
  Moon: {
    1: 'Your feelings may show on your face; you may need to feel emotionally safe before you can meet the world with ease.',
    2: 'Emotional security may come through stability, comfort, and resources you can count on.',
    3: 'You may process feelings by talking and writing; conversation can be how you settle.',
    4: 'Home and family may be your deepest emotional anchor; you may need a private, comfortable base.',
    5: 'Feelings may flow through creativity, play, romance, or children; joy can be an emotional need, not a luxury.',
    6: 'You may feel settled through routines and being useful; your mood can be closely tied to your health and daily rhythm.',
    7: 'You may need close partnership to feel emotionally whole, and can be sensitive to the moods of those closest to you.',
    8: 'Feelings may run deep and private; trust is earned slowly and, once given, can be intense and lasting.',
    9: 'You may feel most at ease when exploring, learning, or traveling; meaning can be an emotional need.',
    10: 'Your feelings may be more public than you’d like; recognition and a sense of direction can matter emotionally.',
    11: 'You may find emotional security in friendship and community; belonging to a group can feel like home.',
    12: 'Feelings may be private, even hidden from yourself; quiet time alone can be essential for emotional balance.',
  },
  Venus: {
    1: 'Charm and warmth may be part of how you meet the world; you may draw people in easily.',
    2: 'You may show love through comfort, gifts, and stability; you can value beauty you can touch.',
    3: 'Affection may be expressed in words, messages, and shared ideas; good conversation can feel romantic.',
    4: 'You may love by making a home; family warmth and a beautiful space can matter deeply.',
    5: 'Romance, flirtation, and creative pleasure may come naturally; you may want love to feel playful.',
    6: 'You may show love through everyday care and helpfulness; relationships can grow out of shared work or routine.',
    7: 'Partnership may be central to your life; you may seek harmony, fairness, and a true companion.',
    8: 'Love may be intense and transformative; you may want depth, trust, and emotional honesty.',
    9: 'You may be drawn to people from other places or with different beliefs; love can feel like an adventure.',
    10: 'Your values and charm may show in your public life; you may be attracted to ambition or meet partners through work.',
    11: 'Friendship may be the doorway to love; you may want a partner who is also your friend.',
    12: 'Love may be private, idealistic, or self-giving; you may need to protect your own needs in relationships.',
  },
  Mars: {
    1: 'Energy and directness may be visible in how you meet the world; you may act first and reflect later.',
    2: 'You may put energy into earning and building security; you can defend what you value fiercely.',
    3: 'You may assert yourself through words; debate and quick decisions can come easily, and so can sharp remarks.',
    4: 'Energy may go into home and family; tension at home can run high when needs go unspoken.',
    5: 'You may pursue romance, creativity, and fun with enthusiasm; competition can be playful for you.',
    6: 'You may pour energy into work and routines; frustration can show up as stress in the body.',
    7: 'You may be drawn to strong, direct partners; conflict in close relationships can be a place to learn how you assert yourself.',
    8: 'Drive may run deep and private; you may have great stamina for intense situations and transformation.',
    9: 'You may fight for your beliefs; travel and study can be outlets for restless energy.',
    10: 'Ambition and drive may show in your career; you may want to lead and be recognized for your effort.',
    11: 'You may channel energy into groups and causes; friendships can be lively, sometimes competitive.',
    12: 'Anger may be held inside; quiet, solitary outlets for energy can help you avoid frustration building up.',
  },
  Saturn: {
    1: 'You may come across as serious or self-contained; confidence can grow steadily with age and experience.',
    2: 'Security may feel hard-won; you may build resources slowly and value what lasts.',
    3: 'You may think carefully before speaking; learning can feel like effort that pays off over time.',
    4: 'Home and family may carry responsibility or early limits; building a secure base can be a life project.',
    5: 'Joy and self-expression may take practice; creativity can deepen with discipline.',
    6: 'You may be dedicated and dutiful at work; learning to rest can be part of the lesson.',
    7: 'Commitment may be taken very seriously; partnerships can mature slowly and last.',
    8: 'Trust and intimacy may feel guarded; letting others in can be a slow, rewarding process.',
    9: 'You may build a philosophy carefully; belief can be tested and then held firmly.',
    10: 'Career may involve responsibility and slow, steady achievement; you may earn authority over time.',
    11: 'You may prefer a few loyal friends; long-term goals can be built patiently with others.',
    12: 'Old fears may sit beneath the surface; solitude and reflection can turn them into strength.',
  },
};

export const PATTERN_TEXT: Record<string, string> = {
  Stellium: 'Three or more planets in one sign concentrate your energy there. This sign’s style may color much of how you think, love, and act.',
  'Grand trine': 'Three planets in mutual trine form a closed circuit of ease. These talents may come so naturally that you take them for granted; using them on purpose can make them a real strength.',
  'T-square': 'Two planets in opposition, both squaring a third (the apex), create a driving tension. The apex planet may be where you feel pressure, and where you may achieve the most when you work with it.',
  'Grand cross': 'Four planets in two oppositions and four squares pull in every direction. You may feel stretched between demands, and develop unusual resilience and balance.',
  Yod: 'Two planets in sextile both quincunx a third, the apex. Older texts gave it a dramatic nickname; here it is read as a sense of a particular calling that asks for repeated adjustment.',
};

export const LUNATION_TEXT = {
  'New Moon': 'a natural time to begin something, set an intention, or plant a seed',
  'Full Moon': 'a time of culmination and clarity, when feelings and results come to light',
  eclipse: 'Eclipses are traditionally read as amplified lunations that can mark turning points; treat this as a theme to notice, not an event to expect.',
};

export const STATION_TEXT: Record<string, Record<'retrograde' | 'direct', string>> = {
  Mercury: {
    retrograde: 'a traditional time to review, re-read, and revisit conversations before starting new ones',
    direct: 'plans and conversations that stalled may start moving again',
  },
  Venus: {
    retrograde: 'a time to reflect on what you value and on past relationships, rather than to rush new commitments',
    direct: 'clarity about love and values may return',
  },
  Mars: {
    retrograde: 'energy may turn inward; a time to rethink how you assert yourself',
    direct: 'drive and momentum may return',
  },
  Jupiter: {
    retrograde: 'growth turns inward; a time to reflect on beliefs and plans',
    direct: 'opportunities and outward growth may pick up',
  },
  Saturn: {
    retrograde: 'a time to review commitments and structures you have built',
    direct: 'responsibilities may move forward again with more clarity',
  },
};

export const NAVAMSA_INTRO =
  'The navamsa (D9) divides each sign into nine parts. Jyotish reads it as the chart of inner strength, maturity, and partnership: the fruit of the birth chart.';
export const VARGOTTAMA_TEXT = 'is vargottama: in the same sign in the birth chart and the navamsa, which tradition reads as a strong, consistent expression of that graha.';
export const DASHAMSA_INTRO = 'The dashamsa (D10) divides each sign into ten parts and is read for career, work, and public standing.';

export const DRISHTI_TEXT: Record<string, string> = {
  Sun: 'adds confidence and visibility, sometimes pride',
  Moon: 'adds sensitivity and care',
  Mars: 'adds energy and drive, sometimes friction',
  Mercury: 'adds thoughtfulness and communication',
  Jupiter: 'is classically protective, adding wisdom and optimism',
  Venus: 'adds harmony, grace, and pleasure',
  Saturn: 'adds seriousness, patience, and sometimes delay or pressure',
};

export const LORDSHIP_TEXT: Record<string, string> = {
  Raja: 'A Raja yoga joins a lord of a kendra (houses of action: 1, 4, 7, 10) with a lord of a trikona (houses of fortune: 1, 5, 9). Classically linked with recognition and the ability to rise through your own effort.',
  Dhana: 'A Dhana yoga joins lords of wealth houses (2nd, 11th) with lords of fortune (5th, 9th). Classically linked with resourcefulness and the ability to build material security.',
  'Viparita Raja': 'A Viparita Raja yoga places the lord of a difficult house in another difficult house. Tradition reads it as strength that grows out of challenges.',
  'Neecha Bhanga Raja': 'Neecha Bhanga means “cancellation of debilitation”. A weak graha is supported by its sign lord or exaltation lord in a kendra; tradition reads this as a weakness that can turn into a distinctive strength.',
};

export const OVERLAY_TEXT = {
  theirsInMine: 'Their {planet} falls in your {house}, so their {role} may touch your {area}.',
  mineInTheirs: 'Your {planet} falls in their {house}, so your {role} may touch their {area}.',
};

export const COMPOSITE_INTRO = 'The composite chart takes the midpoint of each pair of planets and is read as a portrait of the relationship itself, apart from either person.';
