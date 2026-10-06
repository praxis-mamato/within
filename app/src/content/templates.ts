/**
 * Interpretation template library. DRAFT: every entry needs the approver's sign-off (build spec §3.5).
 *
 * Rules every entry follows (enforced by templates.test.ts):
 * - possibility language ("may", "might", "one reading"), never certainty or destiny;
 * - nothing about what another person thinks, feels, or intends;
 * - no diagnoses, scores, or stay/leave advice.
 *
 * Each fragment has a stable ID so a rendered reading can name exactly which text it used.
 */
export const LIBRARY_VERSION = 'draft-1';

export type Element = 'fire' | 'earth' | 'air' | 'water';
export const SIGN_ELEMENT: Record<string, Element> = {
  Aries: 'fire', Leo: 'fire', Sagittarius: 'fire',
  Taurus: 'earth', Virgo: 'earth', Capricorn: 'earth',
  Gemini: 'air', Libra: 'air', Aquarius: 'air',
  Cancer: 'water', Scorpio: 'water', Pisces: 'water',
};

export const ELEMENT_THEME: Record<Element, string> = {
  fire: 'acting on what you feel and saying it out loud',
  earth: 'steadiness, practical care, and things you can count on',
  air: 'talking things through and keeping perspective',
  water: 'feeling things deeply and wanting closeness',
};

/** Western (tropical) sign phrases, by planet role. */
export const WESTERN_SIGN: Record<string, { need: string; connect: string; assert: string; speak: string; core: string; short: string }> = {
  Aries: { short: 'directness', need: 'room to act on feelings quickly, and to be met with honesty', connect: 'directly, with energy and candor', assert: 'quickly and head-on', speak: 'plainly and fast', core: 'initiative' },
  Taurus: { short: 'steadiness', need: 'steadiness, comfort, and time to settle', connect: 'slowly, through loyalty and shared comforts', assert: 'with patience first, then firmness', speak: 'deliberately, once you are sure', core: 'steadiness' },
  Gemini: { short: 'curiosity', need: 'conversation, variety, and room to think out loud', connect: 'through talk, humor, and curiosity', assert: 'with words and questions', speak: 'quickly, from several angles', core: 'curiosity' },
  Cancer: { short: 'care', need: 'emotional safety and a sense of home', connect: 'by caring for people and protecting what you share', assert: 'indirectly, often to protect someone', speak: 'with the feeling first and the point second', core: 'care' },
  Leo: { short: 'warmth', need: 'warmth, and to be seen and appreciated', connect: 'generously and openly', assert: 'visibly, with pride', speak: 'expressively, from the heart', core: 'self-expression' },
  Virgo: { short: 'usefulness', need: 'order, and to feel useful', connect: 'through practical help and attention to detail', assert: 'by improving and fixing things', speak: 'precisely, with care for getting it right', core: 'craft' },
  Libra: { short: 'harmony', need: 'harmony and a sense of fairness', connect: 'through partnership, balance, and good company', assert: 'diplomatically, sometimes so carefully that your view gets lost', speak: 'considerately, weighing both sides', core: 'balance' },
  Scorpio: { short: 'depth', need: 'depth, privacy, and trust that holds', connect: 'intensely, with people you have chosen to trust', assert: 'with focus and resolve, often quietly', speak: 'carefully, with more beneath the surface', core: 'depth' },
  Sagittarius: { short: 'freedom', need: 'freedom, meaning, and room to explore', connect: 'through shared adventures and frank talk', assert: 'candidly, sometimes bluntly', speak: 'frankly, with the big picture first', core: 'exploration' },
  Capricorn: { short: 'reliability', need: 'structure, respect, and a plan', connect: 'through commitment and showing up', assert: 'with discipline and patience', speak: 'carefully and to the point', core: 'responsibility' },
  Aquarius: { short: 'independence', need: 'independence and room to be different', connect: 'through friendship and shared ideas', assert: 'on principle', speak: 'objectively, sometimes at a distance from the feeling', core: 'independence' },
  Pisces: { short: 'empathy', need: 'gentleness, imagination, and quiet time', connect: 'through empathy and devotion', assert: 'indirectly, often by going along', speak: 'intuitively, sometimes leaving things unsaid', core: 'compassion' },
};

/** Vedic (sidereal) rashi phrases. Keys are the English sign names of the rashi. */
export const VEDIC_RASHI: Record<string, { mind: string; love: string; approach: string }> = {
  Aries: { mind: 'a mind (manas) that responds quickly and wants to act', love: 'affection shown through energy and action', approach: 'meeting life head-on' },
  Taurus: { mind: 'a mind that settles through steadiness and the senses', love: 'affection shown through loyalty, comfort, and beauty', approach: 'building slowly and keeping what works' },
  Gemini: { mind: 'a mind that is restless, curious, and verbal', love: 'affection shown through conversation and play', approach: 'learning by trying many things' },
  Cancer: { mind: 'a mind tuned to feeling, family, and belonging', love: 'affection shown through nurture and protection', approach: 'leading with care' },
  Leo: { mind: 'a mind that wants dignity and to be recognized', love: 'affection shown through generosity and loyalty', approach: 'taking the lead and standing by it' },
  Virgo: { mind: 'a mind that analyzes, sorts, and wants to help', love: 'affection shown through service and careful attention', approach: 'improving things one detail at a time' },
  Libra: { mind: 'a mind that weighs, balances, and seeks agreement', love: 'affection shown through fairness and companionship', approach: 'finding the middle ground' },
  Scorpio: { mind: 'a mind with deep, private feelings that are slow to let go', love: 'affection that is intense and protective', approach: 'going beneath the surface' },
  Sagittarius: { mind: 'a mind that looks for meaning and principles', love: 'affection shown through honesty and shared growth', approach: 'following what you believe' },
  Capricorn: { mind: 'a mind that is practical, patient, and responsible', love: 'affection shown through duty and staying power', approach: 'working steadily toward long goals' },
  Aquarius: { mind: 'a mind that is independent and thinks in systems', love: 'affection shown through friendship and shared causes', approach: 'doing things your own way' },
  Pisces: { mind: 'a mind that is sensitive, imaginative, and absorbs moods', love: 'affection shown through devotion and kindness', approach: 'trusting intuition' },
};

/** Classical dignities, used as a small, factual note. */
export const DIGNITY: Record<string, Record<string, string>> = {
  Moon: { Taurus: 'In Vedic astrology the Moon is considered exalted (strong) here.', Cancer: 'The Moon rules this rashi, so it is considered at home here.', Scorpio: 'The Moon is considered debilitated here, which this tradition reads as feelings that may need more care, not as a flaw.' },
  Venus: { Pisces: 'Venus is considered exalted here.', Taurus: 'Venus rules this rashi.', Libra: 'Venus rules this rashi.', Virgo: 'Venus is considered debilitated here, which this tradition reads as love expressed through effort and detail.' },
};

/** The 27 nakshatras: symbol, presiding deity, and a theme. */
export const NAKSHATRA: Record<string, { symbol: string; deity: string; theme: string }> = {
  Ashwini: { symbol: 'a horse’s head', deity: 'the Ashvins, the healer twins', theme: 'quick starts and wanting to help' },
  Bharani: { symbol: 'the yoni', deity: 'Yama', theme: 'carrying responsibility and learning restraint' },
  Krittika: { symbol: 'a flame or razor', deity: 'Agni', theme: 'cutting through to what is honest' },
  Rohini: { symbol: 'an ox cart', deity: 'Prajapati', theme: 'growth, beauty, and steadiness' },
  Mrigashira: { symbol: 'a deer’s head', deity: 'Soma', theme: 'searching and curiosity' },
  Ardra: { symbol: 'a teardrop', deity: 'Rudra', theme: 'storms that clear the air' },
  Punarvasu: { symbol: 'a quiver of arrows', deity: 'Aditi', theme: 'returning, renewal, and home' },
  Pushya: { symbol: 'a cow’s udder', deity: 'Brihaspati', theme: 'nourishing others' },
  Ashlesha: { symbol: 'a coiled serpent', deity: 'the Nagas', theme: 'sharp perception and holding on' },
  Magha: { symbol: 'a throne', deity: 'the Pitris, the ancestors', theme: 'dignity and where you come from' },
  'Purva Phalguni': { symbol: 'the front legs of a bed', deity: 'Bhaga', theme: 'rest, pleasure, and affection' },
  'Uttara Phalguni': { symbol: 'the back legs of a bed', deity: 'Aryaman', theme: 'agreements and keeping your word' },
  Hasta: { symbol: 'a hand', deity: 'Savitar', theme: 'skill and doing things by hand' },
  Chitra: { symbol: 'a bright jewel', deity: 'Tvashtar, the craftsman', theme: 'making and designing' },
  Swati: { symbol: 'a young shoot in the wind', deity: 'Vayu', theme: 'independence and bending without breaking' },
  Vishakha: { symbol: 'a triumphal arch', deity: 'Indra and Agni', theme: 'purpose and reaching goals' },
  Anuradha: { symbol: 'a lotus', deity: 'Mitra', theme: 'friendship and devotion' },
  Jyeshtha: { symbol: 'an earring', deity: 'Indra', theme: 'protecting others and taking charge' },
  Mula: { symbol: 'a bundle of roots', deity: 'Nirriti', theme: 'getting to the root of things' },
  'Purva Ashadha': { symbol: 'a winnowing fan', deity: 'Apas, the waters', theme: 'conviction and renewal' },
  'Uttara Ashadha': { symbol: 'an elephant’s tusk', deity: 'the Vishvadevas', theme: 'lasting commitments' },
  Shravana: { symbol: 'an ear', deity: 'Vishnu', theme: 'listening and learning' },
  Dhanishta: { symbol: 'a drum', deity: 'the Vasus', theme: 'rhythm and generosity' },
  Shatabhisha: { symbol: 'an empty circle', deity: 'Varuna', theme: 'healing and time alone' },
  'Purva Bhadrapada': { symbol: 'the front of a funeral cot', deity: 'Aja Ekapada', theme: 'intensity and transformation' },
  'Uttara Bhadrapada': { symbol: 'the back of a funeral cot', deity: 'Ahir Budhnya', theme: 'depth and patience' },
  Revati: { symbol: 'a fish', deity: 'Pushan, guardian of travelers', theme: 'guidance and safe passage' },
};

/** Vimshottari dasha lords: what a period of each is traditionally said to emphasize. */
export const DASHA_THEME: Record<string, string> = {
  Sun: 'identity, visibility, and standing on your own',
  Moon: 'feelings, home, and caring for others',
  Mars: 'energy, courage, and handling conflict',
  Rahu: 'ambition, the unfamiliar, and restlessness',
  Jupiter: 'growth, learning, and guidance',
  Saturn: 'responsibility, patience, and structure',
  Mercury: 'communication, learning, and exchange',
  Ketu: 'letting go and turning inward',
  Venus: 'relationships, pleasure, and what you value',
};

export const TRANSIT_PLANET: Record<string, string> = {
  Jupiter: 'expansion and opportunity',
  Saturn: 'testing commitments and setting limits',
  Uranus: 'change and a wish for freedom',
  Neptune: 'ideals, sensitivity, and some blurring of lines',
  Pluto: 'deep change around power and control',
};
export const TRANSIT_ASPECT: Record<string, string> = {
  conjunct: 'puts a direct spotlight on',
  square: 'may bring friction that asks you to adjust',
  trine: 'may make it easier to grow',
  opposite: 'may show up through other people, asking for balance in',
};
export const TARGET: Record<string, string> = {
  Sun: 'your sense of who you are',
  Moon: 'your feelings and needs',
  Venus: 'how you love and what you value',
};

export const ASPECT_QUALITY: Record<string, string> = {
  conjunction: 'these may blend, for better or worse',
  sextile: 'these may cooperate easily if you both choose to',
  square: 'these may rub, and the friction can show you what matters',
  trine: 'these may flow with little effort',
  opposition: 'these may pull in opposite directions, asking for balance',
};
export const PLANET_ROLE: Record<string, string> = {
  Sun: 'sense of self',
  Moon: 'emotional needs',
  Mercury: 'way of talking',
  Venus: 'way of showing affection',
  Mars: 'way of asserting',
};

/** Steps and questions vary by the element of the planet that matters for the pillar. */
export const STEPS: Record<'self' | 'purpose' | 'relationship', Record<Element, string>> = {
  self: {
    fire: 'Say your preference in one sentence before agreeing to a plan.',
    earth: 'Before agreeing to a plan, note one thing you would change, then say it.',
    air: 'Before agreeing, ask one question about the plan, then share what you prefer.',
    water: 'Before agreeing, notice how you feel about it, then share one preference.',
  },
  purpose: {
    fire: 'Practise one short, direct “I’d like…” sentence where little is at stake.',
    earth: 'Write down one need, then say it once this week in a low-stakes moment.',
    air: 'Name one need in a conversation this week, as plainly as you can.',
    water: 'Tell someone you trust one feeling and the need under it.',
  },
  relationship: {
    fire: 'Plan one thing you want to do on your own this week, and say so.',
    earth: 'Agree on one small routine that gives you both time together and time apart.',
    air: 'Have one conversation about what “enough time together” means to each of you.',
    water: 'Name one thing that helps you feel close, and one thing you need for yourself.',
  },
};
export const QUESTIONS: Record<'self' | 'purpose' | 'relationship', Record<Element, string>> = {
  self: {
    fire: 'What did you want to say before you agreed?',
    earth: 'What would have felt solid and right to you, before you agreed?',
    air: 'What were you thinking, but not saying, before you agreed?',
    water: 'What were you feeling just before you agreed?',
  },
  purpose: {
    fire: 'Where could you practise saying it straight, with little at stake?',
    earth: 'What is one need you could put into words this week?',
    air: 'Who would be easy to practise this with?',
    water: 'What feeling usually tells you a need is going unspoken?',
  },
  relationship: {
    fire: 'What would make this chapter feel alive for you?',
    earth: 'What do you want to keep steady right now?',
    air: 'What has been hard to talk about lately?',
    water: 'Where do you feel closest, and where do you need more room?',
  },
};

/** Other-pillar steps by the closest aspect between your chart and theirs. All involve the other person. */
export const OTHER_STEPS: Record<string, string> = {
  conjunction: 'Ask {name} where the two of you seem most alike, and where you differ.',
  sextile: 'Suggest one small thing to do together that you would both enjoy.',
  square: 'Ask how {name} sees a recent disagreement, before explaining yours.',
  trine: 'Tell {name} one thing that feels easy between you.',
  opposition: 'Ask {name} what would help them meet you halfway on one thing.',
  none: 'Ask one open question about how {name} likes to spend time together.',
};
