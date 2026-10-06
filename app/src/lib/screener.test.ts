import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { screen } from './screener';

describe('screen', () => {
  it('passes ordinary relationship text', () => {
    const r = screen('I say yes to plans and then feel resentful later.');
    expect(r.flagged).toBe(false);
    expect(r.suppressContactActions).toBe(false);
  });

  it.each([
    ["I'm scared to go home tonight.", 'danger'],
    ["Honestly I don't see the point in being here anymore.", 'self_harm'],
    ['He checks my phone every night.', 'coercion'],
    ["I'm afraid to say no to her.", 'fear'],
  ])('flags %s as %s and suppresses contact actions', (text, category) => {
    const r = screen(text);
    expect(r.category).toBe(category);
    expect(r.suppressContactActions).toBe(true);
  });

  // The safety ops drill fixtures double as screener cases: every fixture the in-app
  // layer is expected to catch on free text must be flagged here.
  const dir = join(__dirname, '../../../ops/safety/fixtures');
  interface Fixture {
    flag_id: string;
    source: string;
    screener_category: string;
    text: string;
  }
  const fixtures: Fixture[] = readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')) as Fixture)
    .filter((f) => f.source === 'free_text' && f.screener_category !== 'none');

  it.each(fixtures)('flags drill fixture $flag_id', (f) => {
    expect(screen(f.text).flagged).toBe(true);
  });
});
