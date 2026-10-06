import { EVENTS, sanitizeError, sanitizeEvent, sanitizeRoute } from './telemetry';

describe('usage events', () => {
  it('drops unknown events', () => {
    expect(sanitizeEvent('journal_text', { body: 'hello' })).toBeNull();
  });

  it('keeps only allowlisted fields and values', () => {
    const r = sanitizeEvent('step_chosen', { pillar: 'other', choice: 'step', text: 'Ask Alex about Friday', nickname: 'Alex' });
    expect(r).toEqual({ event: 'step_chosen', props: { pillar: 'other', choice: 'step' } });
    expect(sanitizeEvent('step_chosen', { pillar: 'He checks my phone', choice: 'step' })?.props).toEqual({ choice: 'step' });
    expect(sanitizeEvent('onboarding_step', { step: '3' })?.props).toEqual({});
  });

  it('can carry no free text: every field is an enum, a number, or a boolean', () => {
    for (const spec of Object.values(EVENTS))
      for (const f of Object.values(spec as Record<string, unknown>)) expect(Array.isArray(f) || f === 'number' || f === 'boolean').toBe(true);
  });
});

describe('crash reports', () => {
  it('keep the error type and code locations, never the message', () => {
    const e = new TypeError('Cannot read birth 1994-05-09 for Alex');
    e.stack = `TypeError: Cannot read birth 1994-05-09 for Alex\n    at compose (https://x.io/within/assets/index-abc.js:12:345)\n    at https://x.io/within/assets/vendor.js:1:2`;
    const r = sanitizeError(e, 'error', '#/milestone/k3j2/edit');
    expect(r.name).toBe('TypeError');
    expect(r.frames).toEqual(['index-abc.js:12:345', 'vendor.js:1:2']);
    expect(r.route).toBe('/milestone/:id/edit');
    expect(JSON.stringify(r)).not.toMatch(/Alex|1994|birth/);
  });

  it('handles thrown non-errors', () => {
    expect(sanitizeError('Alex said no', 'unhandled_rejection').name).toBe('string');
    expect(JSON.stringify(sanitizeError('Alex said no', 'unhandled_rejection'))).not.toMatch(/Alex/);
  });

  it('reduces routes to patterns', () => {
    expect(sanitizeRoute('#/reflection/other')).toBe('/reflection/other');
    expect(sanitizeRoute('#/follow-up/abc123?x=1')).toBe('/follow-up/:id');
    expect(sanitizeRoute('')).toBe('/');
  });
});
