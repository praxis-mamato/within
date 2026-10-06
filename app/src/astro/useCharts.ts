import { useMemo } from 'react';
import { useStore, type Birth } from '../state';
import { computeNatal, type NatalChart } from './natal';

function safeNatal(b: Birth | null | undefined): NatalChart | null {
  if (!b || !b.date) return null;
  try {
    return computeNatal(b);
  } catch {
    return null;
  }
}

/** The user's chart and, if added, the other person's. Recomputed only when birth details change. */
export function useCharts() {
  const { state } = useStore();
  const me = useMemo(() => safeNatal(state.birth), [state.birth]);
  const other = useMemo(() => safeNatal(state.person?.birth), [state.person?.birth]);
  return { me, other };
}
