import { memoryStore, Vault } from './vault';

describe('Vault', () => {
  it('round-trips data', async () => {
    const v = new Vault(memoryStore());
    await v.save('state', { birth: { date: '1985-11-23' }, journal: ['hello'] });
    expect(await v.load('state')).toEqual({ birth: { date: '1985-11-23' }, journal: ['hello'] });
  });
  it('stores nothing readable at rest', async () => {
    const v = new Vault(memoryStore());
    await v.save('state', { secret: 'my private journal entry' });
    const raw = await v.raw('state');
    expect(new TextDecoder().decode(new Uint8Array(raw!.data))).not.toContain('journal');
  });
  it('returns null after a wipe', async () => {
    const v = new Vault(memoryStore());
    await v.save('state', { a: 1 });
    await v.wipe();
    expect(await v.load('state')).toBeNull();
  });
  it('uses a fresh IV every save', async () => {
    const v = new Vault(memoryStore());
    await v.save('s', 1);
    const a = (await v.raw('s'))!.iv.join();
    await v.save('s', 1);
    expect((await v.raw('s'))!.iv.join()).not.toBe(a);
  });
});
