import { activeIntention, initialState, reducer, SAMPLE_BIRTH, type State } from './state';

const onboard = (nickname: string | null = null): State =>
  reducer(initialState(), { type: 'onboarding/finish', birth: SAMPLE_BIRTH, nickname, intention: 'Clarity', behavior: 'Speak honestly' });

describe('reducer', () => {
  it('supports self-only use with no relationship', () => {
    const s = onboard();
    expect(s.onboarded).toBe(true);
    expect(s.person).toBeNull();
    expect(activeIntention(s)?.behavior).toBe('Speak honestly');
  });

  it('flags safety from free text and keeps the flag when later text is benign', () => {
    let s = onboard('Alex');
    s = reducer(s, { type: 'journal/add', body: 'He checks my phone every night.' });
    expect(s.safety.suppressContactActions).toBe(true);
    s = reducer(s, { type: 'journal/add', body: 'Had a nice walk today.' });
    expect(s.safety.category).toBe('coercion');
  });

  it('screens onboarding answers before anything else', () => {
    const s = reducer(initialState(), { type: 'onboarding/answers', focus: [], focusText: "I'm scared to go home", outcome: 'Clarity' });
    expect(s.safety.category).toBe('danger');
  });

  it('marks reflections stale when birth details change after onboarding', () => {
    let s = onboard();
    s = reducer(s, { type: 'birth/update', birth: { ...SAMPLE_BIRTH, timePrecision: 'exact', time: '08:30' } });
    expect(s.stale).toBe(true);
    expect(reducer(s, { type: 'stale/refresh' }).stale).toBe(false);
  });

  it('keeps purpose history instead of overwriting it', () => {
    let s = onboard();
    s = reducer(s, { type: 'intention/set', value: 'Acceptance', behavior: 'Let small things go' });
    expect(s.intentions).toHaveLength(2);
    expect(s.intentions[0].status).toBe('changed');
    expect(activeIntention(s)?.behavior).toBe('Let small things go');
  });

  it('archives without deleting milestones', () => {
    let s = onboard('Alex');
    s = reducer(s, { type: 'person/archive' });
    expect(s.person?.status).toBe('archived');
    expect(s.person?.milestones.length).toBeGreaterThan(0);
  });

  it('keeps milestones in date order and supports deletion', () => {
    let s = onboard('Alex');
    s = reducer(s, {
      type: 'milestone/save',
      milestone: { id: 'x', type: 'Custom', title: 'Early', meaning: '', date: { kind: 'exact', start: '2020-01-01' }, excluded: false },
    });
    expect(s.person?.milestones[0].id).toBe('x');
    s = reducer(s, { type: 'milestone/delete', id: 'x' });
    expect(s.person?.milestones.find((m) => m.id === 'x')).toBeUndefined();
  });

  it('records a follow-up outcome on the action', () => {
    let s = onboard();
    s = reducer(s, { type: 'action/choose', reflectionId: 'r', choice: 'pause', text: 'A deliberate pause', followUp: 'tomorrow' });
    const id = s.actions[0].id;
    s = reducer(s, { type: 'action/followUp', id, outcome: { attempt: 'paused', usefulness: 'helpful', notes: '', next: 'keep' } });
    expect(s.actions[0].outcome?.attempt).toBe('paused');
  });

  it('delete resets everything', () => {
    const s = reducer(onboard('Alex'), { type: 'reset' });
    expect(s.onboarded).toBe(false);
    expect(s.person).toBeNull();
  });
});
