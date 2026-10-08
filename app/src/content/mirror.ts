/**
 * The mirror: what the person tells Within about themselves, and the text that reflects it back.
 * Answers stay on the device. Draft text for the approver; passes the content lint.
 */

export const AREAS = {
  love: 'Love and relationships',
  work: 'Work and ambition',
  family: 'Family and home',
  health: 'Body and energy',
  money: 'Money and security',
  creativity: 'Creativity and play',
  friends: 'Friends and community',
  purpose: 'Meaning and direction',
} as const;
export type Area = keyof typeof AREAS;

export const SEASONS: Record<string, string> = {
  'Starting out': 'beginnings, first tries, finding your footing',
  'Building': 'effort, momentum, putting structures in place',
  'Changing direction': 'questioning the old path and choosing a new one',
  'Settled': 'steadiness, and deciding what to deepen',
  'Rebuilding': 'recovering after something ended or broke',
  'Letting go': 'releasing what no longer fits',
};

export const RECHARGE = ['Alone, in quiet', 'With people I trust', 'Moving my body', 'Making something'] as const;

/** How each pattern tends to show up in particular parts of life. */
export const PATTERN_AREAS: Record<string, Partial<Record<Area, string>>> = {
  guarded_heart: {
    love: 'Partners may feel they have to wait for the real you. Letting them see a feeling before it is resolved builds more closeness than any grand gesture.',
    family: 'You may have learned early to be the steady one. Home can be where you most need to be looked after, and where it is hardest to ask.',
    work: 'You are the person others want in a crisis. Watch for colleagues mistaking your calm for having no needs.',
  },
  deep_waters: {
    love: 'You want the whole person, not the highlight reel. Intensity can feel like intimacy, so look for steadiness too.',
    family: 'Old family feelings can resurface with surprising force. They are information, not a verdict.',
    creativity: 'Art, music, and writing can hold feelings that conversation cannot. Making something is one of your best outlets.',
  },
  room_to_breathe: {
    love: 'You do best with partners who have full lives of their own. Plan freedom in, so you do not have to grab it.',
    friends: 'Friendship may matter as much as romance. A wide circle keeps you from leaning everything on one person.',
    work: 'Rigid roles wear on you. Variety, autonomy, or a side project can keep you engaged.',
  },
  idealist_in_love: {
    love: 'Let time, not hope, show you who someone is. Notice what they do as closely as what you imagine.',
    creativity: 'The longing you feel can be poured into music, writing, or art, where idealism is a gift rather than a risk.',
    money: 'Generosity toward the people you love can extend to money. A clear limit protects both of you.',
  },
  high_bar: {
    work: 'You may over-deliver and under-rest. Decide what “done” looks like before you begin, and stop there.',
    health: 'Stress often shows in the body first: shoulders, jaw, sleep. Rest is part of performance, not a reward for it.',
    love: 'You may judge yourself harder than any partner would. Let someone see you unfinished.',
  },
  caretaker: {
    family: 'You may be the one everyone calls. Notice who checks on you, and let that circle grow.',
    love: 'Care can turn into managing. Ask what your partner wants before you provide it.',
    health: 'Your own appointments, sleep, and meals slip first. Treat them like commitments to someone you love.',
  },
  restless_mind: {
    work: 'You thrive on variety and new problems. Short sprints with clear ends suit you better than open-ended projects.',
    health: 'A busy mind can steal sleep. Writing things down before bed gives your thoughts somewhere to wait.',
    creativity: 'Your ideas multiply; finishing one is the real creative act. Pick the one that keeps calling you back.',
  },
  go_getter: {
    work: 'You start things others only talk about. Partner with someone who loves the follow-through.',
    health: 'Movement is not optional for you; it is how you regulate. A hard workout can settle what conversation cannot.',
    love: 'Directness is honest, and it can land as pressure. Pause before the second push.',
  },
  quiet_anger: {
    work: 'You may accept more than you should and resent it later. Practice small, early disagreements.',
    love: 'Unspoken frustration can turn into distance. Saying “that bothered me” early keeps things clean.',
    health: 'Held-back anger often lives in the body. Physical outlets help more than you might expect.',
  },
  meaning_seeker: {
    work: 'A job without a bigger reason drains you fast. Look for the purpose inside the role, or build it on the side.',
    purpose: 'You may change direction when something stops feeling true. That is not flakiness; it is how you navigate.',
    love: 'You want a partner who is also growing. Shared adventures matter more to you than shared routines.',
  },
  to_be_seen: {
    work: 'You do best where your contribution is visible. Credit is not vanity for you; it is fuel.',
    creativity: 'Creating for its own sake, not only for the response, gives you a steadier sense of worth.',
    love: 'You love generously and need to feel chosen. Say what makes you feel appreciated.',
  },
  transformer: {
    love: 'Trust is earned slowly with you, then given completely. Watch for testing people instead of telling them.',
    work: 'You often thrive in crisis or turnaround work, where depth and nerve are needed.',
    purpose: 'Several reinventions may mark your life. Each one tends to bring you closer to what is real for you.',
  },
  security_first: {
    money: 'A cushion calms you more than a windfall excites you. Knowing your numbers is a form of self-care.',
    family: 'Home is your anchor. Rituals, good food, and familiar spaces restore you.',
    work: 'You build steadily and finish well. Change works best for you in tested steps.',
  },
  slow_trust_love: {
    love: 'You show love by showing up. Letting it be said in words, by you and to you, may feel risky and matter a lot.',
    family: 'You may have learned that care had to be earned. It does not, and noticing that can soften a great deal.',
    work: 'Responsibility suits you, and you may take on too much of it alone.',
  },
  mirror_of_others: {
    love: 'Partnership can be where you grow most and where you lose track of your own wants. Check in with yourself first.',
    friends: 'You read people well and keep the peace. Let a friend see you disagree.',
    work: 'You shine in collaboration. Practice making a small call on your own.',
  },
  own_person: {
    work: 'Rules without reasons wear on you. Autonomy, or work you design yourself, suits you.',
    friends: 'You may feel a little outside most groups. Your people share your values more than your habits.',
    love: 'You need a partner who is not threatened by your independence.',
  },
  sponge: {
    health: 'Crowds and conflict drain you physically. Build recovery time into busy days, not only after them.',
    love: 'You may absorb a partner’s moods. Ask, “Is this mine?” before you act on a feeling.',
    creativity: 'Your sensitivity is a creative instrument. Art, music, or nature give it somewhere good to go.',
  },
  creative_tension: {
    work: 'Pressure brings out your best work. Make sure it is pointed at a goal, not at yourself.',
    health: 'Your system may run hot. Downtime is how the engine keeps running.',
    purpose: 'Your hardest seasons are often your most formative. You tend to grow most through friction.',
  },
  natural_flow: {
    work: 'You may coast where you could excel. Pick one easy talent and take it seriously.',
    creativity: 'Ease can hide ambition. A real challenge may be exactly what your gifts need.',
    friends: 'People find you easy to be around. Let them see the parts that are not easy too.',
  },
  head_heart: {
    love: 'You may choose with your head and feel unsettled, or with your heart and second-guess. Both deserve a vote.',
    work: 'A role can fit your goals and not your needs. Notice which one is quietly unhappy.',
    purpose: 'You hold more than one truth at once. That range is a strength when you stop asking it to resolve.',
  },
  generous_spirit: {
    money: 'Generosity can outrun the budget. Give from a plan, not from the moment.',
    friends: 'You are the one who brings people together. Let them host you sometimes.',
    work: 'You may say yes to every good idea. Choose fewer, and give them your best.',
  },
  investigator: {
    work: 'Research, strategy, analysis, or any work that rewards digging may suit you well.',
    love: 'You notice what is left unsaid. Ask about it gently rather than investigating.',
    health: 'A mind that keeps digging can disturb sleep. Give it a set time to work, and a time to stop.',
  },
  calling: {
    work: 'Your sense of self rises and falls with your work. Define success in your own words, not your field’s.',
    purpose: 'You want your work to have meant something. Name what that is, so you can recognize it when it happens.',
    family: 'Ambition can crowd out home. Protect the time that is not about achievement.',
  },
  roots: {
    family: 'Family patterns may repeat until you name them. Keep what nourishes you; change what does not.',
    love: 'You may recreate the emotional climate you grew up in, for better and worse. Notice which.',
    money: 'Owning your space, literally or figuratively, may matter a lot to your sense of safety.',
  },
  inner_world: {
    health: 'Solitude is not withdrawal for you; it is maintenance. Protect it.',
    creativity: 'Dreams, images, and intuitions are raw material. Keep a notebook nearby.',
    love: 'Let one or two people into your private world. Being known there changes things.',
  },
  wise_steady: {
    purpose: 'You may be the person others come to for perspective. Make sure you have someone in that role for you.',
    family: 'You may hold the long view for your family. That is a gift and a weight.',
    work: 'Teaching, advising, or mentoring may come naturally.',
  },
  self_reliant: {
    love: 'Needing someone may feel risky. Small, low-stakes requests are how that starts to feel safe.',
    work: 'You can carry a lot alone. Delegating is a skill worth practicing, not a weakness.',
    friends: 'A few people who let you need things may matter more than a wide circle.',
  },
};

/** Which life areas a natal point in a cycle touches. */
export const TARGET_AREAS: Record<string, Area[]> = {
  Sun: ['purpose', 'health'],
  Moon: ['family', 'love'],
  Mercury: ['work', 'friends'],
  Venus: ['love', 'money', 'creativity'],
  Mars: ['work', 'health'],
  Jupiter: ['purpose', 'money'],
  Saturn: ['work', 'family'],
  Ascendant: ['health', 'love'],
  Midheaven: ['work', 'purpose'],
};

/** One specific line per slow planet and natal point, so no two cycles read alike. */
export const MOVER_TARGET: Record<string, Record<string, string>> = {
  Jupiter: {
    Sun: 'Confidence and visibility grow. A good time to say yes to the bigger version of yourself.',
    Moon: 'Emotional generosity widens: more warmth at home, more room to feel at ease.',
    Mercury: 'Ideas multiply and conversations open doors. Study, pitch, publish, or teach.',
    Venus: 'Affection, pleasure, and money may feel more abundant. Enjoy it and watch the spending.',
    Mars: 'Energy and courage rise. Effort goes further than usual, and so can overreach.',
    Jupiter: 'A new twelve-year cycle of growth begins. Choose what you want to grow next.',
    Saturn: 'Hope meets structure: a chance to expand something you have been building slowly.',
    Ascendant: 'You may come across as warmer and more open. New people and places arrive.',
    Midheaven: 'Career doors may open: recognition, a new role, or a wider public.',
  },
  Saturn: {
    Sun: 'Your sense of self is tested and strengthened. What you commit to now has staying power.',
    Moon: 'Feelings may run heavier and more private. Home and family ask for maturity and care.',
    Mercury: 'Thinking becomes more serious and exact. Good for contracts, study, and hard decisions.',
    Venus: 'Relationships and finances get a reality check. What is real deepens; what is not gets clearer.',
    Mars: 'Effort meets resistance. Slow, steady work outlasts force.',
    Jupiter: 'Big plans are asked to become practical plans.',
    Saturn: 'A structural checkpoint in your life: what you built is reviewed, kept, or rebuilt.',
    Ascendant: 'You may feel the weight of responsibility personally, even physically. Pace yourself.',
    Midheaven: 'Career and reputation are tested. Responsibility rises, and so can respect.',
  },
  Uranus: {
    Sun: 'A wish to be more fully yourself may arrive suddenly. Old roles can stop fitting overnight.',
    Moon: 'Home or emotional life may shift unexpectedly. You may need more freedom than before.',
    Mercury: 'Breakthrough ideas and sudden insights. Your mind wants new inputs.',
    Venus: 'Attraction to the new and unusual. Relationships may need more space or a new shape.',
    Mars: 'Restless energy and sudden starts. Channel it before it becomes impatience.',
    Jupiter: 'Unexpected openings, and a pull toward unconventional growth.',
    Saturn: 'Old structures are shaken. Keep what holds; release what only confines.',
    Ascendant: 'You may want to change how you look, live, or show up.',
    Midheaven: 'Career surprises or a strong pull toward a different path.',
  },
  Neptune: {
    Sun: 'Your sense of direction may soften or blur. Imagination and compassion rise; clarity takes patience.',
    Moon: 'Heightened sensitivity and intuition. Protect your rest and your boundaries.',
    Mercury: 'Thinking turns poetic and intuitive. Double-check details and agreements.',
    Venus: 'Romance and longing grow. Idealism is beautiful; keep one foot on the ground.',
    Mars: 'Energy may feel diffuse. Gentle, purposeful action beats force.',
    Jupiter: 'Faith and idealism expand. Check big hopes against facts.',
    Saturn: 'Old structures may dissolve slowly. Let go of what no longer has life in it.',
    Ascendant: 'You may feel more porous to people and places. Choose your environments with care.',
    Midheaven: 'Uncertainty about your path, or a pull toward more meaningful work.',
  },
  Pluto: {
    Sun: 'A deep reshaping of identity. Something old falls away so you can stand more fully in yourself.',
    Moon: 'Intense emotional change, often around home, family, or old attachments.',
    Mercury: 'Thinking deepens; you may uncover a truth that changes your view.',
    Venus: 'Relationships and values go through deep change. Honesty becomes non-negotiable.',
    Mars: 'Willpower intensifies. Use it for a change you choose rather than a fight.',
    Jupiter: 'Beliefs transform. What you trust may become more your own.',
    Saturn: 'Foundations are rebuilt from the ground up.',
    Ascendant: 'Personal transformation that others may see before you name it.',
    Midheaven: 'A powerful turning point in your career or public role.',
  },
};

/** When the person said an area is on their mind, the cycle speaks to it directly. */
export const MOVER_AREA: Record<string, Partial<Record<Area, string>>> = {
  Jupiter: {
    love: 'In love, this favors openness: say yes to invitations and be generous with affection.',
    work: 'At work, this is a time to ask for more scope, pitch the idea, or apply.',
    family: 'At home, more warmth and room may be possible. Host, gather, celebrate.',
    health: 'Energy may be good; so may appetite. Enjoy, with some proportion.',
    money: 'Money opportunities may appear. Weigh them; Jupiter also invites overspending.',
    creativity: 'Creative confidence grows. Share the work.',
    friends: 'Your circle may widen. New people can open new doors.',
    purpose: 'A good season to name what you want to grow into next.',
  },
  Saturn: {
    love: 'In love, this tests commitment: honest conversations and clear agreements help.',
    work: 'At work, expect more responsibility and slower results. Steady effort is what counts.',
    family: 'Family may ask for maturity, care, or boundaries.',
    health: 'Your body may ask for discipline and rest. Build routines that last.',
    money: 'Budgets and long-term plans matter now. Build the cushion.',
    creativity: 'Craft over inspiration: practice and finish.',
    friends: 'Fewer, truer friendships may matter more than many light ones.',
    purpose: 'You may decide what you are willing to commit to for the long run.',
  },
  Uranus: {
    love: 'In love, you may need more space or something new. Say it before you act on it.',
    work: 'At work, restlessness may point to a change worth planning, not just reacting to.',
    family: 'Home may change shape: a move, a new arrangement, or new freedom.',
    health: 'Try a new routine; your body may respond to novelty.',
    money: 'Income may fluctuate. Keep a buffer for surprises.',
    creativity: 'Experiment. Odd ideas may be the good ones.',
    friends: 'New communities and unusual people may arrive.',
    purpose: 'A change of direction may feel urgent. Test it in small steps.',
  },
  Neptune: {
    love: 'In love, romance runs high and clarity runs low. Go slowly with big decisions.',
    work: 'At work, double-check agreements and details. Meaningful work may call louder.',
    family: 'Family boundaries may blur. Compassion with limits is the goal.',
    health: 'Sleep, water, and rest matter more than usual. Notice what drains you.',
    money: 'Read the fine print. Avoid vague or too-good-to-be-true offers.',
    creativity: 'A wonderful time for music, art, and imagination.',
    friends: 'You may attract people who need you. Choose who gets your energy.',
    purpose: 'Spiritual or creative purpose may feel more important than achievement.',
  },
  Pluto: {
    love: 'In love, honesty and power come to the surface. Deep repair or deep change is possible.',
    work: 'At work, power dynamics may become visible. Choose your stance deliberately.',
    family: 'Old family patterns may come up to be resolved.',
    health: 'This can be a time to change a habit at the root.',
    money: 'Shared money, debt, or inheritance may need attention.',
    creativity: 'Work that goes deep, even dark, may be your best.',
    friends: 'Some friendships may end or transform; the ones that remain go deeper.',
    purpose: 'You may be letting go of an old ambition to make room for a truer one.',
  },
};

export interface Profile {
  season: string;
  onMind: Area[];
  recharge: string;
}
export interface PatternCheck {
  fit: 'yes' | 'partly' | 'no';
  noticed: string[];
}

const list = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** What Within says back once the person has checked a pattern against their life. */
export function mirrorFor(check: PatternCheck, notice: string[], helps: string): string {
  const seen = check.noticed.filter((n) => notice.includes(n)).map(lower);
  if (check.fit === 'no')
    return 'You don’t recognize this one, so it moves down your list. A chart shows possibilities; your experience is the better guide.';
  if (check.fit === 'partly')
    return seen.length
      ? `Part of this fits: you notice ${list(seen)}. That is the thread to follow. The rest may belong to another season of your life, or to someone close to you.`
      : 'Part of this fits. Notice over the next week which parts show up, and come back to mark them.';
  return seen.length
    ? `This one is you, especially ${list(seen)}. What tends to help: ${lower(helps)}`
    : `This one is you. What tends to help: ${lower(helps)}`;
}
