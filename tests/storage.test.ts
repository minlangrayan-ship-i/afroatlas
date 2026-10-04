import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadList, toggleId } from '../src/lib/storage';
afterEach(() => vi.unstubAllGlobals());
describe('local favorites and compare storage', () => {
  it('ignores malformed or untrusted saved lists', () => {
    vi.stubGlobal('localStorage', { getItem: () => '{broken' });
    expect(loadList('favorites')).toEqual([]);
    vi.stubGlobal('localStorage', { getItem: () => JSON.stringify({ arbitrary: 'object' }) });
    expect(loadList('favorites')).toEqual([]);
  });
  it('limits the comparator to three distinct fiches', () => {
    vi.stubGlobal('localStorage', { getItem: () => JSON.stringify(['a', 'b', 'c']) });
    const result = toggleId('compare', 'd', 3);
    expect(result.values).toEqual(['a', 'b', 'c']);
    expect(result.message).toContain('3');
  });
  it('reports a storage failure instead of claiming persistence', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {
        throw new Error('Quota exceeded');
      },
    });
    const result = toggleId('favorites', 'a');
    expect(result.message).toContain('non conservée');
  });
});
