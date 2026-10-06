/**
 * Western (tropical) interpretation library. DRAFT pending approval (build spec §3.5).
 * Drawn from the traditional meanings of planets, signs, houses, and aspects as they appear
 * across classical and modern Western astrology. Phrased as possibilities, never predictions.
 */

export const PLANET_FUNCTION: Record<string, string> = {
  Sun: 'your core identity and what gives you vitality',
  Moon: 'your emotional needs and what makes you feel safe',
  Mercury: 'how you think, listen, and talk',
  Venus: 'how you love, what you value, and what you find beautiful',
  Mars: 'how you act, assert yourself, and handle anger',
  Jupiter: 'where you grow, trust, and find meaning',
  Saturn: 'where you build structure, meet limits, and mature slowly',
  Uranus: 'where you want freedom and change',
  Neptune: 'where you idealize, imagine, and blur boundaries',
  Pluto: 'where you meet intensity, power, and deep change',
  Node: 'a direction of growth that can feel unfamiliar',
};

/** Personal planets in each sign: the core of a Western natal reading. */
export const PLANET_IN_SIGN: Record<string, Record<string, string>> = {
  Sun: {
    Aries: 'Identity grows through initiative, courage, and being first to try. You may feel most alive when starting something.',
    Taurus: 'Identity grows through steadiness, building, and enjoying what is real and lasting. You may thrive on patience others lack.',
    Gemini: 'Identity grows through curiosity, conversation, and variety. You may feel most yourself when learning and connecting ideas.',
    Cancer: 'Identity grows through care, belonging, and protecting what matters. Home and close bonds may sit at the center of your life.',
    Leo: 'Identity grows through creativity, generosity, and being seen. You may light up when you can express yourself wholeheartedly.',
    Virgo: 'Identity grows through skill, service, and improving things. You may find meaning in doing something well and being useful.',
    Libra: 'Identity grows through relationship, fairness, and beauty. You may come to know yourself best in partnership with others.',
    Scorpio: 'Identity grows through depth, loyalty, and transformation. You may be drawn to what is hidden and to bonds that go all the way.',
    Sagittarius: 'Identity grows through exploration, honesty, and a search for meaning. Freedom and a bigger picture may matter deeply to you.',
    Capricorn: 'Identity grows through responsibility, ambition, and steady effort. You may respect what is earned over time.',
    Aquarius: 'Identity grows through independence, ideas, and community. You may feel most yourself when free to be different.',
    Pisces: 'Identity grows through compassion, imagination, and connection to something larger. You may sense moods others miss.',
  },
  Moon: {
    Aries: 'Feelings arrive fast and move fast. You may need room to react honestly, then let it go, and space to act rather than wait.',
    Taurus: 'Feelings settle through comfort, routine, and the senses. Traditionally the Moon is exalted here: steady, loyal, and slow to be shaken.',
    Gemini: 'Feelings are processed by talking and thinking them through. You may need conversation, variety, and someone who listens.',
    Cancer: 'The Moon rules this sign: feelings run deep and protective. You may need a sense of home, belonging, and being cared for in return.',
    Leo: 'Feelings want warmth and recognition. You may need to feel appreciated and to give generously to those you love.',
    Virgo: 'Feelings settle through order and being useful. You may show care through practical help and worry when things feel messy.',
    Libra: 'Feelings seek harmony and fairness. You may need peace in close relationships and find conflict especially draining.',
    Scorpio: 'Traditionally the Moon is in its fall here: feelings are intense, private, and slow to release. Trust is earned, then held fiercely.',
    Sagittarius: 'Feelings need space and optimism. You may recover through movement, humor, and a sense that life is going somewhere.',
    Capricorn: 'Traditionally the Moon is in detriment here: feelings are handled with self-control. You may show care through reliability more than words.',
    Aquarius: 'Feelings are processed with some distance. You may need friendship within love and room to be your own person.',
    Pisces: 'Feelings are porous and empathetic. You may absorb others’ moods and need quiet time to come back to yourself.',
  },
  Mercury: {
    Aries: 'You may think fast and speak directly, deciding quickly and saying it plainly.',
    Taurus: 'You may think slowly and thoroughly, preferring practical ideas and firm conclusions.',
    Gemini: 'Mercury rules this sign: a quick, curious, versatile mind that loves exchange.',
    Cancer: 'You may think through feeling and memory, remembering how things were said as much as what.',
    Leo: 'You may speak with warmth and conviction, and like ideas you can stand behind.',
    Virgo: 'Mercury rules and is exalted here: precise, analytical, and attentive to detail.',
    Libra: 'You may weigh both sides before speaking and choose words that keep the peace.',
    Scorpio: 'You may think strategically and notice what goes unsaid; you may keep your own counsel.',
    Sagittarius: 'Traditionally Mercury is in detriment here: big-picture and frank, sometimes skipping the details.',
    Capricorn: 'You may think practically and speak to the point, valuing what is useful.',
    Aquarius: 'You may think independently and enjoy unusual ideas and systems.',
    Pisces: 'Traditionally Mercury is in fall here: intuitive, imaginative thinking that may leave things unsaid.',
  },
  Venus: {
    Aries: 'Traditionally Venus is in detriment here: love is direct, eager, and spontaneous; you may like the chase.',
    Taurus: 'Venus rules this sign: love is loyal, sensual, and steady; you may show care through comfort and presence.',
    Gemini: 'Love grows through conversation, play, and curiosity; you may need a partner who is also a friend to talk with.',
    Cancer: 'Love is nurturing and protective; you may need emotional safety before you open up.',
    Leo: 'Love is warm, generous, and loyal; you may want romance and to be adored as much as you adore.',
    Virgo: 'Traditionally Venus is in fall here: love is shown through practical care and attention to detail, sometimes more than words.',
    Libra: 'Venus rules this sign: love seeks harmony, fairness, and beauty; partnership may feel central.',
    Scorpio: 'Traditionally Venus is in detriment here: love is intense and all-or-nothing; trust and loyalty may matter above all.',
    Sagittarius: 'Love needs freedom, honesty, and shared adventure; you may bond through growing together.',
    Capricorn: 'Love is committed and serious; you may show it through reliability and building something lasting.',
    Aquarius: 'Love grows through friendship and space; you may need a partner who respects your independence.',
    Pisces: 'Venus is exalted here: love is devoted, compassionate, and romantic; you may need to protect your own boundaries.',
  },
  Mars: {
    Aries: 'Mars rules this sign: action is quick and courageous; anger may flare and fade fast.',
    Taurus: 'Traditionally Mars is in detriment here: you may act slowly and steadily, and dig in when pushed.',
    Gemini: 'You may assert yourself through words and arguments, and juggle many projects.',
    Cancer: 'Traditionally Mars is in fall here: you may act to protect, and express anger indirectly.',
    Leo: 'You may act with pride and generosity, and need your efforts to be recognized.',
    Virgo: 'You may channel energy into work and improvement; frustration may show as criticism.',
    Libra: 'Traditionally Mars is in detriment here: you may assert yourself diplomatically, sometimes avoiding direct conflict.',
    Scorpio: 'Mars has traditional rulership here: you may act with focus, resolve, and strategy.',
    Sagittarius: 'You may act on conviction and enthusiasm, and speak your mind bluntly.',
    Capricorn: 'Mars is exalted here: you may act with discipline, patience, and long-term aims.',
    Aquarius: 'You may act on principle and resist being told what to do.',
    Pisces: 'You may act on intuition and avoid confrontation, going with the flow until you can’t.',
  },
  Jupiter: {
    Aries: 'Growth through courage and initiative.', Taurus: 'Growth through patience, comfort, and building resources.',
    Gemini: 'Growth through learning and conversation (Jupiter is traditionally in detriment here).', Cancer: 'Growth through family and care (Jupiter is exalted here).',
    Leo: 'Growth through creativity and generosity.', Virgo: 'Growth through service and skill (traditionally in detriment).',
    Libra: 'Growth through partnership and fairness.', Scorpio: 'Growth through depth and shared resources.',
    Sagittarius: 'Jupiter rules this sign: growth through travel, study, and belief.', Capricorn: 'Growth through discipline and structure (traditionally in fall).',
    Aquarius: 'Growth through community and ideas.', Pisces: 'Jupiter has traditional rulership here: growth through compassion and faith.',
  },
  Saturn: {
    Aries: 'Lessons around patience with your own impulses (Saturn is in fall here).', Taurus: 'Lessons around security and what you truly need to own.',
    Gemini: 'Lessons around focus and taking your own ideas seriously.', Cancer: 'Lessons around emotional security and family (traditionally in detriment).',
    Leo: 'Lessons around self-expression and being seen (traditionally in detriment).', Virgo: 'Lessons around perfectionism and healthy routine.',
    Libra: 'Saturn is exalted here: lessons around fairness, commitment, and balance in relationships.', Scorpio: 'Lessons around trust, control, and letting go.',
    Sagittarius: 'Lessons around belief and committing to a path.', Capricorn: 'Saturn rules this sign: lessons around responsibility and earned authority.',
    Aquarius: 'Saturn has traditional rulership here: lessons around belonging while staying yourself.', Pisces: 'Lessons around boundaries and structure for the imagination.',
  },
};

export const SIGN_KEYWORD: Record<string, string> = {
  Aries: 'courage and new starts', Taurus: 'stability and values', Gemini: 'ideas and communication', Cancer: 'home and feeling',
  Leo: 'self-expression', Virgo: 'service and health', Libra: 'relationships and fairness', Scorpio: 'depth and transformation',
  Sagittarius: 'beliefs and freedom', Capricorn: 'structure and ambition', Aquarius: 'community and innovation', Pisces: 'compassion and imagination',
};

/** The twelve houses, as life areas. */
export const HOUSE: Record<number, { name: string; area: string }> = {
  1: { name: 'First house', area: 'self, body, and how you meet the world' },
  2: { name: 'Second house', area: 'money, possessions, and self-worth' },
  3: { name: 'Third house', area: 'communication, siblings, and daily surroundings' },
  4: { name: 'Fourth house', area: 'home, family, and roots' },
  5: { name: 'Fifth house', area: 'romance, creativity, play, and children' },
  6: { name: 'Sixth house', area: 'work, health, and daily routines' },
  7: { name: 'Seventh house', area: 'partnership and close one-to-one relationships' },
  8: { name: 'Eighth house', area: 'intimacy, shared resources, and transformation' },
  9: { name: 'Ninth house', area: 'beliefs, study, and travel' },
  10: { name: 'Tenth house', area: 'career, reputation, and public life' },
  11: { name: 'Eleventh house', area: 'friends, groups, and hopes for the future' },
  12: { name: 'Twelfth house', area: 'solitude, the unconscious, and what happens behind the scenes' },
};

/** Traditional sign rulers (modern co-rulers noted where they differ). */
export const RULER: Record<string, string> = {
  Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon', Leo: 'Sun', Virgo: 'Mercury',
  Libra: 'Venus', Scorpio: 'Mars', Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter',
};
export const MODERN_RULER: Record<string, string> = { Scorpio: 'Pluto', Aquarius: 'Uranus', Pisces: 'Neptune' };

export const RISING: Record<string, string> = {
  Aries: 'You may meet the world directly and energetically, and come across as quick and brave.',
  Taurus: 'You may meet the world calmly and steadily, and come across as grounded and warm.',
  Gemini: 'You may meet the world with curiosity and talk, and come across as lively and quick.',
  Cancer: 'You may meet the world carefully, protecting yourself at first, and come across as caring.',
  Leo: 'You may meet the world with warmth and presence, and come across as confident.',
  Virgo: 'You may meet the world attentively and modestly, and come across as capable.',
  Libra: 'You may meet the world gracefully and diplomatically, and come across as easy to be with.',
  Scorpio: 'You may meet the world guardedly and perceptively, and come across as intense.',
  Sagittarius: 'You may meet the world openly and optimistically, and come across as frank and adventurous.',
  Capricorn: 'You may meet the world seriously and responsibly, and come across as composed.',
  Aquarius: 'You may meet the world in your own way, and come across as friendly but independent.',
  Pisces: 'You may meet the world gently and receptively, and come across as kind and dreamy.',
};

export const ASPECT_MEANING: Record<string, string> = {
  conjunction: 'blend and act as one, intensifying each other',
  sextile: 'cooperate easily when you make the effort',
  square: 'create friction that pushes you to grow',
  trine: 'flow together naturally, a gift that can be taken for granted',
  opposition: 'pull in opposite directions, asking for balance (often noticed through other people)',
};

/** Hand-written readings for the planet pairs that matter most in relationships. Keyed "A-B" in BODIES order. */
export const PAIR: Record<string, string> = {
  'Sun-Moon': 'what you want and what you need',
  'Moon-Venus': 'your emotional needs and your way of loving',
  'Venus-Mars': 'attraction and desire: how you love and how you pursue',
  'Moon-Mars': 'feelings and reactions; how quickly emotion turns to action',
  'Moon-Saturn': 'feelings and self-control; comfort and responsibility',
  'Venus-Saturn': 'love and commitment; affection and caution',
  'Sun-Saturn': 'identity and responsibility; confidence built over time',
  'Mercury-Mars': 'thinking and asserting; how sharply you argue',
  'Mercury-Venus': 'words and affection; how gently you speak',
  'Sun-Mars': 'determination and drive',
  'Sun-Venus': 'identity and affection',
  'Moon-Mercury': 'feeling and thinking; how you talk about emotions',
  'Sun-Mercury': 'identity and expression',
  'Venus-Jupiter': 'generosity in love and a taste for abundance',
  'Moon-Jupiter': 'emotional openness and optimism',
  'Mars-Saturn': 'drive and restraint; starting and stopping',
};

/** The eight lunar phases (Dane Rudhyar's widely used scheme), by Sun–Moon angle. */
export const LUNAR_PHASE: { from: number; name: string; meaning: string }[] = [
  { from: 0, name: 'New Moon', meaning: 'instinctive and fresh; you may act on impulse and learn by doing' },
  { from: 45, name: 'Crescent', meaning: 'pushing forward against old habits; effort and persistence' },
  { from: 90, name: 'First Quarter', meaning: 'decisive and active; you may thrive on challenges' },
  { from: 135, name: 'Gibbous', meaning: 'refining and improving; you may analyze in order to grow' },
  { from: 180, name: 'Full Moon', meaning: 'aware of others; relationships may be a mirror for you' },
  { from: 225, name: 'Disseminating', meaning: 'sharing what you know; you may want to teach or pass things on' },
  { from: 270, name: 'Last Quarter', meaning: 'questioning and reorienting; letting go of what no longer fits' },
  { from: 315, name: 'Balsamic', meaning: 'reflective and future-minded; endings that prepare new beginnings' },
];

export const ELEMENT_BALANCE: Record<string, { strong: string; weak: string }> = {
  fire: { strong: 'enthusiasm, courage, and acting on instinct', weak: 'spontaneity may take more effort; you may wait for certainty' },
  earth: { strong: 'practicality, patience, and attention to what is real', weak: 'routines and practical details may take more effort' },
  air: { strong: 'ideas, talk, and perspective', weak: 'stepping back to talk things through may take more effort' },
  water: { strong: 'feeling, empathy, and intuition', weak: 'naming feelings may take more effort, though they are still there' },
};
export const MODALITY_BALANCE: Record<string, string> = {
  cardinal: 'starting things and taking the lead',
  fixed: 'persistence and holding steady',
  mutable: 'adapting and changing course',
};
export const SIGN_MODALITY: Record<string, 'cardinal' | 'fixed' | 'mutable'> = {
  Aries: 'cardinal', Cancer: 'cardinal', Libra: 'cardinal', Capricorn: 'cardinal',
  Taurus: 'fixed', Leo: 'fixed', Scorpio: 'fixed', Aquarius: 'fixed',
  Gemini: 'mutable', Virgo: 'mutable', Sagittarius: 'mutable', Pisces: 'mutable',
};
