import { intentOf, type Intent } from './oracleEngine';
import { limitOf } from './oracle';

/** Real-world phrasings, labelled by the part of the engine that should answer. */
const CASES: [string, Intent | 'limit'][] = [
  ['Should I take the job offer?', 'decision'], ['Should I text my ex?', 'decision'], ['Is it a good idea to move to Denver?', 'decision'], ['Should I quit my job this month?', 'decision'],
  ['Can I trust my new business partner?', 'decision'], ['Should I go on the trip?', 'decision'], ['Do I sign the lease?', 'decision'], ['Should I say yes to the second date?', 'decision'],
  ['Is it time to start my own business?', 'decision'], ['Should I reach out to my sister?', 'decision'], ['Should I go back to school this year?', 'decision'], ['Would it be wise to buy a car now?', 'decision'],
  ['When is a good time to launch my podcast?', 'when'], ['What day should I ask for a raise?', 'when'], ['When should I sign the contract?', 'when'], ['Best day this month for a first date?', 'when'],
  ['When is the best time to start a diet?', 'when'], ['Which week is good for travel?', 'when'], ['When will things get easier at work?', 'when'], ['Good time to have a hard conversation?', 'when'],
  ['What’s my rising sign?', 'chart'], ['What does my Moon in Aries mean?', 'chart'], ['What is my Venus sign?', 'chart'], ['Tell me about my Mars', 'chart'],
  ['What does my chart say about me?', 'chart'], ['What is my North Node?', 'chart'], ['What nakshatra is my Moon in?', 'chart'], ['What dasha am I in?', 'chart'],
  ['What’s my Saturn placement?', 'chart'], ['Explain my big three', 'chart'], ['What sign am I?', 'chart'], ['What does my Mercury mean for how I talk?', 'chart'],
  ['Is Mercury retrograde?', 'retro'], ['When does Mercury go retrograde?', 'retro'], ['Is Venus retrograde right now?', 'retro'], ['What planets are retrograde?', 'retro'],
  ['When is the next Full Moon?', 'lunation'], ['What does the New Moon mean for me?', 'lunation'], ['Is there an eclipse coming?', 'lunation'], ['When is the next new moon?', 'lunation'],
  ['When is my Saturn return?', 'return'], ['Am I in my Saturn return?', 'return'], ['When is my Jupiter return?', 'return'], ['What does my Saturn return mean?', 'return'],
  ['What am I going through this year?', 'cycle'], ['What chapter of life am I in?', 'cycle'], ['What cycle am I in?', 'cycle'], ['What’s happening in my life right now?', 'cycle'],
  ['What are my patterns?', 'patterns'], ['Why do I keep attracting the same people?', 'patterns'], ['What are my strengths?', 'patterns'], ['What is my personality like?', 'patterns'],
  ['Who am I?', 'patterns'], ['Why do I always end up overworking?', 'patterns'], ['What are my gifts?', 'patterns'], ['What is my biggest weakness?', 'patterns'],
  ['Why do I feel anxious?', 'feeling'], ['Why am I so tired lately?', 'feeling'], ['I feel stuck and low', 'feeling'], ['Why do I feel restless?', 'feeling'],
  ['I’m stressed about everything', 'feeling'], ['Why am I so irritable?', 'feeling'], ['I feel unsettled today', 'feeling'], ['Why am I feeling emotional?', 'feeling'],
  ['Are we compatible?', 'together'], ['How is our relationship looking?', 'together'], ['Do we match astrologically?', 'together'], ['What does our synastry say?', 'together'],
  ['What does my week look like?', 'week'], ['What’s ahead this month?', 'week'], ['How is next week for me?', 'week'], ['What’s coming up this weekend?', 'week'],
  ['Where is Mars right now?', 'planet'], ['What is Jupiter doing?', 'planet'], ['Where is Venus today?', 'planet'], ['What sign is the Moon in?', 'planet'],
  ['What’s the sky doing tonight?', 'sky'], ['What’s the energy today?', 'sky'], ['What are the stars saying right now?', 'sky'], ['How’s the cosmic weather?', 'sky'],
  ['Will I get pregnant this year?', 'limit'], ['Is he cheating on me?', 'limit'], ['Does she still love me?', 'limit'], ['Will I win my court case?', 'limit'],
  ['Should I buy bitcoin?', 'limit'], ['Is my test result going to be cancer?', 'limit'], ['Will he come back?', 'limit'], ['What lottery numbers should I play?', 'limit'],
  ['Is he thinking about me?', 'limit'], ['Will my divorce settlement go well?', 'limit'], ['When will I get pregnant?', 'limit'], ['Is my partner faithful?', 'limit'],
  ['Can you simplify my reading?', 'simplify'], ['Say it in plain English', 'simplify'], ['I don’t understand', 'simplify'], ['What does that mean?', 'simplify'], ['ELI5 my chart', 'simplify'], ['Explain that simply', 'simplify'],
  ['Tell me something I need to hear', 'open'], ['Give me a message', 'open'], ['What should I focus on?', 'open'], ['Hello Oracle', 'open'],
];

describe('the Oracle understands the question', () => {
  it('routes at least 90% of real-world phrasings to the right part of the engine', () => {
    const wrong = CASES.filter(([q, want]) => {
      const lim = limitOf(q);
      const got = lim && lim !== 'unclear' ? 'limit' : intentOf(q);
      return got !== want;
    });
    console.log(`routing: ${CASES.length - wrong.length}/${CASES.length}`, wrong.map(([q, w]) => `${q} (want ${w}, got ${limitOf(q) && limitOf(q) !== 'unclear' ? 'limit' : intentOf(q)})`));
    expect((CASES.length - wrong.length) / CASES.length).toBeGreaterThanOrEqual(0.9);
  });
});
