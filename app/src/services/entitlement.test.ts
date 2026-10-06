import { safeReturnUrl, toEntitlement } from '../../../supabase/functions/_shared/entitlement';

const sub = (over: Record<string, unknown> = {}) => ({
  id: 'sub_1',
  customer: 'cus_1',
  status: 'active',
  cancel_at_period_end: false,
  metadata: { user_id: 'u1' },
  items: { data: [{ current_period_end: 1800000000, price: { id: 'price_month', recurring: { interval: 'month' } } }] },
  ...over,
});

describe('toEntitlement', () => {
  it('maps an active monthly subscription', () => {
    const r = toEntitlement(sub(), 'u1', 'price_year');
    expect(r).toMatchObject({ user_id: 'u1', status: 'active', plan: 'monthly', stripe_customer_id: 'cus_1', cancel_at_period_end: false });
    expect(r.current_period_end).toBe(new Date(1800000000 * 1000).toISOString());
  });
  it('recognizes the yearly plan by price ID or interval', () => {
    expect(toEntitlement(sub({ items: { data: [{ price: { id: 'price_year' } }] } }), 'u1', 'price_year').plan).toBe('yearly');
    expect(toEntitlement(sub({ items: { data: [{ price: { id: 'x', recurring: { interval: 'year' } } }] } }), 'u1').plan).toBe('yearly');
  });
  it('treats unpaid as past due and ended as canceled', () => {
    expect(toEntitlement(sub({ status: 'unpaid' }), 'u1').status).toBe('past_due');
    expect(toEntitlement(sub({ status: 'incomplete_expired' }), 'u1').status).toBe('canceled');
  });
  it('reads the period end from the subscription on older API versions', () => {
    const r = toEntitlement(sub({ current_period_end: 1700000000, items: { data: [{ price: { id: 'p' } }] } }), 'u1');
    expect(r.current_period_end).toBe(new Date(1700000000 * 1000).toISOString());
  });
});

describe('safeReturnUrl', () => {
  const allowed = ['https://praxis-mamato.github.io/within/', 'http://localhost:5173/'];
  it('allows our own pages and strips query strings', () => {
    expect(safeReturnUrl('https://praxis-mamato.github.io/within/?x=1', allowed)).toBe('https://praxis-mamato.github.io/within/');
    expect(safeReturnUrl('http://localhost:5173/', allowed)).toBe('http://localhost:5173/');
  });
  it('refuses other sites', () => {
    expect(safeReturnUrl('https://evil.example/within/', allowed)).toBe(allowed[0]);
    expect(safeReturnUrl('https://praxis-mamato.github.io/other/', allowed)).toBe(allowed[0]);
    expect(safeReturnUrl(42, allowed)).toBe(allowed[0]);
  });
});
