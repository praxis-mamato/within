/**
 * Vedic (Jyotish) interpretation library. DRAFT pending approval (build spec §3.5).
 * Based on classical Parashari principles: graha significations (karakatva), dignities,
 * natural friendships, bhava meanings, nakshatra attributes, and common yogas.
 * Phrased as possibilities, never predictions.
 */

export const GRAHA: Record<string, { karaka: string; nature: string }> = {
  Sun: { karaka: 'the soul, confidence, father, and authority', nature: 'a royal, warming graha' },
  Moon: { karaka: 'the mind (manas), emotions, mother, and comfort', nature: 'a gentle, changeable graha' },
  Mars: { karaka: 'courage, energy, siblings, and property', nature: 'a fiery, decisive graha' },
  Mercury: { karaka: 'intellect, speech, learning, and trade', nature: 'a quick, adaptable graha' },
  Jupiter: { karaka: 'wisdom, teachers, children, and good fortune', nature: 'the great benefic, expansive and kind' },
  Venus: { karaka: 'love, marriage, beauty, art, and pleasure', nature: 'a benefic of refinement and attraction' },
  Saturn: { karaka: 'discipline, time, service, and endurance', nature: 'a slow, serious graha that rewards patience' },
  Rahu: { karaka: 'ambition, the unfamiliar, and worldly desire', nature: 'a shadow graha that magnifies and unsettles' },
  Ketu: { karaka: 'detachment, insight, and past patterns', nature: 'a shadow graha that releases and turns inward' },
};

export const RASHI_LORD: Record<string, string> = {
  Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon', Leo: 'Sun', Virgo: 'Mercury',
  Libra: 'Venus', Scorpio: 'Mars', Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter',
};

export const EXALTATION: Record<string, string> = { Sun: 'Aries', Moon: 'Taurus', Mars: 'Capricorn', Mercury: 'Virgo', Jupiter: 'Cancer', Venus: 'Pisces', Saturn: 'Libra' };
export const DEBILITATION: Record<string, string> = { Sun: 'Libra', Moon: 'Scorpio', Mars: 'Cancer', Mercury: 'Pisces', Jupiter: 'Capricorn', Venus: 'Virgo', Saturn: 'Aries' };
export const OWN: Record<string, string[]> = {
  Sun: ['Leo'], Moon: ['Cancer'], Mars: ['Aries', 'Scorpio'], Mercury: ['Gemini', 'Virgo'],
  Jupiter: ['Sagittarius', 'Pisces'], Venus: ['Taurus', 'Libra'], Saturn: ['Capricorn', 'Aquarius'],
};
/** Moolatrikona sign and degree range. */
export const MOOLATRIKONA: Record<string, [string, number, number]> = {
  Sun: ['Leo', 0, 20], Moon: ['Taurus', 4, 30], Mars: ['Aries', 0, 12], Mercury: ['Virgo', 16, 20],
  Jupiter: ['Sagittarius', 0, 10], Venus: ['Libra', 0, 15], Saturn: ['Aquarius', 0, 20],
};
/** Natural friendships (Brihat Parashara Hora Shastra). */
export const FRIENDS: Record<string, { friends: string[]; enemies: string[] }> = {
  Sun: { friends: ['Moon', 'Mars', 'Jupiter'], enemies: ['Venus', 'Saturn'] },
  Moon: { friends: ['Sun', 'Mercury'], enemies: [] },
  Mars: { friends: ['Sun', 'Moon', 'Jupiter'], enemies: ['Mercury'] },
  Mercury: { friends: ['Sun', 'Venus'], enemies: ['Moon'] },
  Jupiter: { friends: ['Sun', 'Moon', 'Mars'], enemies: ['Mercury', 'Venus'] },
  Venus: { friends: ['Mercury', 'Saturn'], enemies: ['Sun', 'Moon'] },
  Saturn: { friends: ['Mercury', 'Venus'], enemies: ['Sun', 'Moon', 'Mars'] },
};

export type Dignity = 'exalted' | 'moolatrikona' | 'own' | 'friend' | 'neutral' | 'enemy' | 'debilitated';
export const DIGNITY_TEXT: Record<Dignity, string> = {
  exalted: 'exalted, the strongest classical placement: its qualities may come through clearly and generously',
  moolatrikona: 'in moolatrikona, a placement of strong, natural expression',
  own: 'in its own sign, comfortable and self-directed',
  friend: 'in a friend’s sign, generally supported',
  neutral: 'in a neutral sign, neither helped nor hindered',
  enemy: 'in an enemy’s sign, where its qualities may take more effort to express',
  debilitated: 'debilitated, the classically weakest placement: its themes may need conscious attention, and tradition holds they can be strengthened through effort',
};

export const BHAVA: Record<number, { name: string; area: string }> = {
  1: { name: 'Tanu bhava (1st)', area: 'self, body, temperament, and how life begins to unfold' },
  2: { name: 'Dhana bhava (2nd)', area: 'wealth, family, speech, and food' },
  3: { name: 'Sahaja bhava (3rd)', area: 'courage, siblings, effort, and short journeys' },
  4: { name: 'Sukha bhava (4th)', area: 'home, mother, inner peace, and comforts' },
  5: { name: 'Putra bhava (5th)', area: 'children, creativity, intelligence, and romance' },
  6: { name: 'Ripu bhava (6th)', area: 'obstacles, health, service, and daily work' },
  7: { name: 'Kalatra bhava (7th)', area: 'marriage, partnership, and contracts' },
  8: { name: 'Ayur bhava (8th)', area: 'longevity, the hidden, sudden change, and research' },
  9: { name: 'Dharma bhava (9th)', area: 'dharma, teachers, father, faith, and fortune' },
  10: { name: 'Karma bhava (10th)', area: 'career, action, and standing in the world' },
  11: { name: 'Labha bhava (11th)', area: 'gains, friends, elder siblings, and fulfilled wishes' },
  12: { name: 'Vyaya bhava (12th)', area: 'loss, expenses, solitude, foreign lands, and liberation' },
};

/** Lagna (ascendant) by rashi. Keys are English sign names. */
export const LAGNA: Record<string, string> = {
  Aries: 'Mesha lagna, ruled by Mars: an active, pioneering temperament that may prefer to lead and move quickly.',
  Taurus: 'Vrishabha lagna, ruled by Venus: a steady, sensual temperament that values security and beauty.',
  Gemini: 'Mithuna lagna, ruled by Mercury: a curious, communicative temperament that thrives on variety.',
  Cancer: 'Karka lagna, ruled by the Moon: a sensitive, caring temperament rooted in home and feeling.',
  Leo: 'Simha lagna, ruled by the Sun: a dignified, generous temperament that wants to shine and lead.',
  Virgo: 'Kanya lagna, ruled by Mercury: a discerning, service-minded temperament attentive to detail.',
  Libra: 'Tula lagna, ruled by Venus: a balanced, relational temperament drawn to fairness and grace.',
  Scorpio: 'Vrishchika lagna, ruled by Mars: an intense, private temperament with great staying power.',
  Sagittarius: 'Dhanu lagna, ruled by Jupiter: an optimistic, principled temperament seeking wisdom.',
  Capricorn: 'Makara lagna, ruled by Saturn: a practical, patient temperament that builds over time.',
  Aquarius: 'Kumbha lagna, ruled by Saturn: an independent, humanitarian temperament with its own logic.',
  Pisces: 'Meena lagna, ruled by Jupiter: a compassionate, intuitive temperament with spiritual leanings.',
};

/** Lagna lord placed in each house: a classical key to where life’s focus may gather. */
export const LAGNA_LORD_IN: Record<number, string> = {
  1: 'Self-directed: your path may depend largely on your own effort and personality.',
  2: 'Focus may gather around family, resources, and the power of speech.',
  3: 'Focus may gather around courage, initiative, communication, and siblings.',
  4: 'Focus may gather around home, emotional security, and the mother.',
  5: 'Focus may gather around creativity, learning, romance, and children.',
  6: 'Focus may gather around work, service, health, and overcoming obstacles.',
  7: 'Focus may gather around partnership; relationships may shape your life strongly.',
  8: 'Focus may gather around research, transformation, and what is hidden.',
  9: 'Focus may gather around dharma, teachers, faith, and higher learning.',
  10: 'Focus may gather around career, action, and public life.',
  11: 'Focus may gather around friendships, networks, and goals.',
  12: 'Focus may gather around solitude, spirituality, foreign places, or quiet service.',
};

/** Nakshatra attributes: ruling graha follows the Vimshottari order; gana and yoni per classical tables. */
export const NAKSHATRA_DETAIL: Record<string, { gana: 'Deva' | 'Manushya' | 'Rakshasa'; yoni: string; quality: string }> = {
  Ashwini: { gana: 'Deva', yoni: 'horse', quality: 'swift, healing, eager to begin' },
  Bharani: { gana: 'Manushya', yoni: 'elephant', quality: 'bearing responsibility, intense, creative' },
  Krittika: { gana: 'Rakshasa', yoni: 'sheep', quality: 'sharp, purifying, protective' },
  Rohini: { gana: 'Manushya', yoni: 'serpent', quality: 'fertile, attractive, growth-oriented' },
  Mrigashira: { gana: 'Deva', yoni: 'serpent', quality: 'searching, gentle, curious' },
  Ardra: { gana: 'Manushya', yoni: 'dog', quality: 'stormy, transformative, honest about pain' },
  Punarvasu: { gana: 'Deva', yoni: 'cat', quality: 'renewing, generous, returning to the good' },
  Pushya: { gana: 'Deva', yoni: 'sheep', quality: 'nourishing, devoted, considered among the most auspicious' },
  Ashlesha: { gana: 'Rakshasa', yoni: 'cat', quality: 'perceptive, intense, holding on' },
  Magha: { gana: 'Rakshasa', yoni: 'rat', quality: 'regal, connected to ancestors and tradition' },
  'Purva Phalguni': { gana: 'Manushya', yoni: 'rat', quality: 'pleasure-loving, creative, affectionate' },
  'Uttara Phalguni': { gana: 'Manushya', yoni: 'cow', quality: 'loyal, contractual, supportive in partnership' },
  Hasta: { gana: 'Deva', yoni: 'buffalo', quality: 'skillful, clever, good with the hands' },
  Chitra: { gana: 'Rakshasa', yoni: 'tiger', quality: 'artistic, striking, a maker' },
  Swati: { gana: 'Deva', yoni: 'buffalo', quality: 'independent, flexible, business-minded' },
  Vishakha: { gana: 'Rakshasa', yoni: 'tiger', quality: 'goal-driven, determined, single-minded' },
  Anuradha: { gana: 'Deva', yoni: 'deer', quality: 'devoted, friendly, organized' },
  Jyeshtha: { gana: 'Rakshasa', yoni: 'deer', quality: 'protective, senior, responsible' },
  Mula: { gana: 'Rakshasa', yoni: 'dog', quality: 'investigative, uprooting, seeking origins' },
  'Purva Ashadha': { gana: 'Manushya', yoni: 'monkey', quality: 'invincible in spirit, persuasive' },
  'Uttara Ashadha': { gana: 'Manushya', yoni: 'mongoose', quality: 'principled, enduring, a final victory' },
  Shravana: { gana: 'Deva', yoni: 'monkey', quality: 'listening, learning, connecting' },
  Dhanishta: { gana: 'Rakshasa', yoni: 'lion', quality: 'rhythmic, generous, wealthy in spirit' },
  Shatabhisha: { gana: 'Rakshasa', yoni: 'horse', quality: 'healing, secretive, independent' },
  'Purva Bhadrapada': { gana: 'Manushya', yoni: 'lion', quality: 'intense, idealistic, transformative' },
  'Uttara Bhadrapada': { gana: 'Manushya', yoni: 'cow', quality: 'deep, patient, wise' },
  Revati: { gana: 'Deva', yoni: 'elephant', quality: 'nurturing, protective, guiding others safely' },
};
export const GANA_TEXT: Record<string, string> = {
  Deva: 'deva (gentle, idealistic) temperament',
  Manushya: 'manushya (human, practical, balanced) temperament',
  Rakshasa: 'rakshasa (intense, independent, self-protective) temperament',
};

export const YOGA_TEXT: Record<string, string> = {
  'Gaja Kesari': 'Jupiter in a kendra (1st, 4th, 7th, or 10th) from the Moon. Classically linked with wisdom, good counsel, and respect from others.',
  'Budha-Aditya': 'The Sun and Mercury in the same rashi. Classically linked with intelligence and articulate expression.',
  'Chandra-Mangala': 'The Moon and Mars in the same rashi. Classically linked with drive and resourcefulness; feelings may turn quickly into action.',
  Ruchaka: 'One of the five Pancha Mahapurusha yogas: Mars strong in a kendra from the lagna. Linked with courage and leadership.',
  Bhadra: 'Pancha Mahapurusha yoga of Mercury: strong in a kendra from the lagna. Linked with intellect and eloquence.',
  Hamsa: 'Pancha Mahapurusha yoga of Jupiter: strong in a kendra from the lagna. Linked with wisdom and goodness.',
  Malavya: 'Pancha Mahapurusha yoga of Venus: strong in a kendra from the lagna. Linked with grace, comfort, and artistic taste.',
  Sasa: 'Pancha Mahapurusha yoga of Saturn: strong in a kendra from the lagna. Linked with discipline and authority over time.',
  Sunapha: 'A graha (other than the Sun) in the 2nd from the Moon. Linked with self-earned resources and initiative.',
  Anapha: 'A graha (other than the Sun) in the 12th from the Moon. Linked with good conduct and inner contentment.',
  Durudhara: 'Grahas on both sides of the Moon (2nd and 12th). Linked with support from many directions.',
  Kemadruma: 'No graha in the 2nd or 12th from the Moon. Tradition reads this as the mind needing its own anchors; many texts say it is softened by other factors, so treat it as a reason for self-care, not a verdict.',
};

export const DASHA_DETAIL: Record<string, string> = {
  Sun: 'a period that may bring identity, recognition, authority, and questions of self-respect to the fore',
  Moon: 'a period that may emphasize emotions, home, mother, and public connection',
  Mars: 'a period that may bring energy, courage, competition, and decisive action',
  Rahu: 'a period that may bring ambition, unconventional paths, and restless desire for more',
  Jupiter: 'a period that may support growth, learning, guidance, and expanding horizons',
  Saturn: 'a period that may ask for discipline, patience, and responsibility, with rewards that come slowly',
  Mercury: 'a period that may emphasize learning, communication, trade, and adaptability',
  Ketu: 'a period that may bring detachment, introspection, and letting go of what no longer fits',
  Venus: 'a period that may emphasize relationships, comfort, beauty, and enjoyment',
};

export const TITHI_NAMES = ['Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi'];
export const VARA: { name: string; lord: string }[] = [
  { name: 'Ravivara (Sunday)', lord: 'Sun' },
  { name: 'Somavara (Monday)', lord: 'Moon' },
  { name: 'Mangalavara (Tuesday)', lord: 'Mars' },
  { name: 'Budhavara (Wednesday)', lord: 'Mercury' },
  { name: 'Guruvara (Thursday)', lord: 'Jupiter' },
  { name: 'Shukravara (Friday)', lord: 'Venus' },
  { name: 'Shanivara (Saturday)', lord: 'Saturn' },
];
