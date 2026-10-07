/**
 * Interpretation library for progressions, solar arcs, slow transits, and the solar return.
 * Draft text for the approver (next-features A1). Possibilities, not predictions: every line
 * passes the content lint in src/content/lint.ts.
 */

export const PROGRESSION_INTRO =
  'Secondary progressions are one of the oldest Western timing methods: each day after your birth stands for one year of your life. The progressed chart describes slow inner development, the way you are growing, rather than outside events.';

export const SOLAR_ARC_INTRO =
  'Solar arc directions move every point in your birth chart forward by the same amount the progressed Sun has moved, about one degree a year. When a directed point reaches a natal point, astrologers read a period when that part of life may come into focus. Only the close, hard contacts (conjunction, square, opposition) are listed, as tradition favors.';

export const YEAR_AHEAD_INTRO =
  'The slow planets, Jupiter through Pluto, set the longer themes of a year. A contact can stay within one degree for weeks or months, and a retrograde loop can bring it back up to three times. The dates show when each one is closest.';

export const SOLAR_RETURN_INTRO =
  'Your solar return is the moment each year when the Sun comes back to the exact degree it held at your birth. A chart cast for that moment is read as a sketch of the year from one birthday to the next. It is cast here for your birthplace; many astrologers use the place you were in on your birthday, which can shift the houses.';

/** The progressed Moon spends about two and a half years in each sign: a chapter of emotional life. */
export const PROGRESSED_MOON_SIGN: Record<string, string> = {
  Aries: 'A chapter that may start something new. Feelings can run quicker and more direct, and you may want to act on what you need instead of waiting for it.',
  Taurus: 'A chapter for steadiness. You may want comfort, security, and a slower pace, and you may find calm by building something that lasts.',
  Gemini: 'A curious, busy chapter. You may want more conversation, learning, and variety, and talking things through can help you understand what you feel.',
  Cancer: 'A chapter that turns toward home, family, and belonging. Emotional needs may feel closer to the surface, and caring for yourself and others can come first.',
  Leo: 'A chapter for warmth and self-expression. You may want to be seen, to create, and to bring more play and generosity into your days.',
  Virgo: 'A chapter for sorting and improving. You may feel drawn to routines, health habits, and useful work, and to tidying what feels unsettled.',
  Libra: 'A chapter focused on relationships and balance. Partnership, fairness, and beauty may matter more, and you may learn about yourself through other people.',
  Scorpio: 'A deep, searching chapter. Feelings may run strong and private, and you may want honesty, closeness, and to change what no longer feels true.',
  Sagittarius: 'An expansive chapter. You may want room, travel, study, or a bigger sense of meaning, and optimism can help you take a wider view.',
  Capricorn: 'A chapter of effort and structure. You may feel more serious about goals and responsibilities, and steady work can feel satisfying.',
  Aquarius: 'A chapter that values freedom and friendship. You may want space to be different, new circles, and to rethink how you belong.',
  Pisces: 'A reflective, sensitive chapter that closes the cycle of signs. You may want rest, imagination, compassion, and time to let old things settle before a new start.',
};

/** The house the progressed Moon moves through: where attention may gather for the chapter. */
export const PROGRESSED_MOON_HOUSE: Record<number, string> = {
  1: 'Attention may turn to yourself: your body, your appearance, and how you want to begin again.',
  2: 'Attention may turn to money, belongings, and what you value, and to feeling secure in your own worth.',
  3: 'Attention may turn to conversations, learning, siblings or neighbors, and the rhythm of daily life.',
  4: 'Attention may turn inward to home, family, and roots. This is often read as a quieter, private stretch.',
  5: 'Attention may turn to creativity, pleasure, romance, and children, or to whatever helps you play.',
  6: 'Attention may turn to work routines, health habits, and the practical tasks that keep life running.',
  7: 'Attention may turn to partners and close one-to-one relationships, and to what you need from them.',
  8: 'Attention may turn to intimacy, shared resources, and the kinds of change that go deep.',
  9: 'Attention may turn to travel, study, beliefs, and the search for a bigger picture.',
  10: 'Attention may turn to career, reputation, and your place in the world. This is often read as a more public stretch.',
  11: 'Attention may turn to friends, groups, and hopes for the future.',
  12: 'Attention may turn to rest, solitude, and endings that make room for something new. This is often read as a time to recharge.',
};

/** The progressed Sun changes sign about every thirty years: a long shift in emphasis. */
export const PROGRESSED_SUN_SIGN: Record<string, string> = {
  Aries: 'Your sense of purpose may take on more initiative and courage, with a wish to start things and stand on your own.',
  Taurus: 'Your sense of purpose may slow and settle, with more weight on stability, the body, and what you can build.',
  Gemini: 'Your sense of purpose may grow more curious and talkative, with more weight on ideas, learning, and connection.',
  Cancer: 'Your sense of purpose may turn toward care, home, and emotional security.',
  Leo: 'Your sense of purpose may grow warmer and more visible, with a wish to create and to be recognized.',
  Virgo: 'Your sense of purpose may grow practical and precise, with more weight on skill, service, and health.',
  Libra: 'Your sense of purpose may turn toward relationships, fairness, and harmony.',
  Scorpio: 'Your sense of purpose may deepen, with more weight on intensity, honesty, and transformation.',
  Sagittarius: 'Your sense of purpose may widen, with more weight on meaning, freedom, and exploration.',
  Capricorn: 'Your sense of purpose may grow more ambitious and structured, with more weight on responsibility and long-term goals.',
  Aquarius: 'Your sense of purpose may turn toward independence, community, and new ideas.',
  Pisces: 'Your sense of purpose may soften, with more weight on compassion, imagination, and spiritual life.',
};

/** What a progressed planet changing sign may describe. */
export const PROGRESSED_PLANET_INGRESS: Record<string, string> = {
  Sun: 'A progressed Sun ingress is read as a gradual change of emphasis in identity that unfolds over the following decades.',
  Mercury: 'A progressed Mercury ingress is read as a change in how you think, learn, and talk, often noticed only looking back.',
  Venus: 'A progressed Venus ingress is read as a change in what you find beautiful and what you want from love and friendship.',
  Mars: 'A progressed Mars ingress is read as a change in how you go after things and where your energy goes.',
};

/** The progressed lunation cycle (Dane Rudhyar): about thirty years from one progressed New Moon to the next. */
export const PROGRESSED_PHASE: Record<string, string> = {
  'New Moon': 'The first years of a roughly thirty-year cycle. Tradition reads this as a time of new beginnings that may not have clear shape yet: acting on instinct and seeing what grows.',
  Crescent: 'The cycle is pushing forward. Tradition reads this as a time of effort: the new direction meets old habits, and persistence matters.',
  'First Quarter': 'A turning point in the cycle. Tradition reads this as a time of decisions and action, when structures are built for what began at the New Moon.',
  Gibbous: 'The cycle is refining itself. Tradition reads this as a time to study, adjust, and improve, getting ready for things to come to light.',
  'Full Moon': 'The peak of the cycle. Tradition reads this as a time when what was started becomes visible, often through relationships, and you may see your path more clearly.',
  Disseminating: 'The cycle turns to sharing. Tradition reads this as a time to pass on what you have learned and to give back.',
  'Last Quarter': 'A second turning point. Tradition reads this as a time of reorientation: questioning old structures and letting go of what no longer fits.',
  Balsamic: 'The closing years of the cycle. Tradition reads this as a time to rest, reflect, and release, preparing the ground for the next progressed New Moon.',
};

/** How a progressed or directed contact is read, by aspect. */
export const CONTACT_HOW: Record<string, string> = {
  conjunct: 'merges with and activates',
  sextile: 'opens a cooperative channel to',
  square: 'creates a productive tension with',
  trine: 'flows easily into',
  opposite: 'faces and asks for balance with',
};

/** The slow planets in transit, by aspect to a natal point. {target} is the natal theme. */
export const SLOW_TRANSIT: Record<string, Record<string, string>> = {
  Jupiter: {
    conjunct: 'Jupiter meeting {target} is a classic sign of growth: a time when this part of life may expand, open up, or feel more hopeful. Overdoing it is the usual caution.',
    sextile: 'Jupiter supporting {target} can bring small openings: a helpful contact, a lucky timing, or encouragement that is worth acting on.',
    square: 'Jupiter squaring {target} can stretch things: the wish for more may run ahead of the practical limits. It is often a good time to grow, as long as you keep a sense of proportion.',
    trine: 'Jupiter trining {target} is read as an easy, generous influence: confidence and goodwill may come more readily around this part of life.',
    opposite: 'Jupiter opposing {target} may bring growth through other people: offers, opinions, or invitations that ask you to weigh your own needs against what is on offer.',
  },
  Saturn: {
    conjunct: 'Saturn meeting {target} is read as a time of serious work: this part of life may ask for commitment, patience, and clear boundaries. What you build now is meant to last.',
    sextile: 'Saturn supporting {target} can make steady effort pay off. Structure, planning, and help from experienced people may come more easily.',
    square: 'Saturn squaring {target} can feel like friction or delay. Tradition reads it as a test of what is solid: a time to repair foundations rather than push harder.',
    trine: 'Saturn trining {target} is read as quiet support for discipline and maturity: a good time to make something more stable.',
    opposite: 'Saturn opposing {target} may bring responsibilities through other people or commitments. It is often read as a checkpoint: reviewing what is working and what needs to change.',
  },
  Uranus: {
    conjunct: 'Uranus meeting {target} is read as a time of awakening: a wish for freedom, change, or a fresh start in this part of life, sometimes arriving suddenly.',
    sextile: 'Uranus supporting {target} can bring welcome surprises and new ideas, and a chance to try something different.',
    square: 'Uranus squaring {target} can unsettle routines. Tradition reads it as restlessness that points to where more freedom or honesty is needed.',
    trine: 'Uranus trining {target} is read as an easy opening for change: experiments may go well and new people or ideas may refresh you.',
    opposite: 'Uranus opposing {target} may bring change through other people or outside events, asking you to adapt and to notice where you want more independence.',
  },
  Neptune: {
    conjunct: 'Neptune meeting {target} is read as a time of softening: imagination, compassion, and spiritual interest may grow, and boundaries can blur. Checking facts helps.',
    sextile: 'Neptune supporting {target} can bring inspiration, intuition, and gentler feelings that are easy to put into creative or caring work.',
    square: 'Neptune squaring {target} can bring confusion or idealism. Tradition reads it as a time to go slowly with big decisions and to look again at what seems too good or too unclear.',
    trine: 'Neptune trining {target} is read as quiet inspiration: art, music, spiritual practice, and kindness may come more easily.',
    opposite: 'Neptune opposing {target} may bring uncertainty through other people. It can help to be clear about what you see and what you hope.',
  },
  Pluto: {
    conjunct: 'Pluto meeting {target} is read as deep, slow transformation: something in this part of life may end so that something more honest can grow.',
    sextile: 'Pluto supporting {target} can give you more focus and resolve, and a chance to make a meaningful change by choice.',
    square: 'Pluto squaring {target} can bring pressure and questions of control. Tradition reads it as a time to face what you have outgrown.',
    trine: 'Pluto trining {target} is read as steady empowerment: change can come from within and feel like a natural next step.',
    opposite: 'Pluto opposing {target} may bring intensity through other people, and questions about power and trust in close ties.',
  },
};

/** The solar return Ascendant: the tone of the year. */
export const SR_ASCENDANT: Record<string, string> = {
  Aries: 'The year may have a quick, self-starting tone: a time to take initiative and act on your own.',
  Taurus: 'The year may have a steady, grounded tone: a time to build security and enjoy simple pleasures.',
  Gemini: 'The year may have a busy, curious tone: learning, short trips, and many conversations.',
  Cancer: 'The year may have a caring, home-centered tone: family, roots, and emotional security.',
  Leo: 'The year may have a warm, expressive tone: creativity, visibility, and generosity.',
  Virgo: 'The year may have a practical tone: work, health routines, and getting things in order.',
  Libra: 'The year may have a relational tone: partnership, cooperation, and balance.',
  Scorpio: 'The year may have an intense, private tone: depth, commitment, and change from within.',
  Sagittarius: 'The year may have an expansive tone: travel, study, and a search for meaning.',
  Capricorn: 'The year may have a serious, goal-driven tone: responsibility, ambition, and long-term plans.',
  Aquarius: 'The year may have an independent tone: friends, groups, and fresh ideas.',
  Pisces: 'The year may have a gentle, reflective tone: imagination, compassion, and rest.',
};

/** The house the Sun falls in at the solar return: the area of focus for the year. */
export const SR_SUN_HOUSE: Record<number, string> = {
  1: 'Focus may be on yourself: your health, your appearance, and a personal fresh start.',
  2: 'Focus may be on money, possessions, and what you value.',
  3: 'Focus may be on communication, learning, and your local world.',
  4: 'Focus may be on home, family, and private life.',
  5: 'Focus may be on creativity, romance, children, and joy.',
  6: 'Focus may be on work, daily routines, and health habits.',
  7: 'Focus may be on partners and close one-to-one relationships.',
  8: 'Focus may be on intimacy, shared resources, and deep change.',
  9: 'Focus may be on travel, education, and beliefs.',
  10: 'Focus may be on career, reputation, and public life.',
  11: 'Focus may be on friendships, community, and future hopes.',
  12: 'Focus may be on rest, reflection, and what happens behind the scenes.',
};
