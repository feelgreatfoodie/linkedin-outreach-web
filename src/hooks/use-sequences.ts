'use client';

import { useCallback } from 'react';
import { useLocalStorage } from './use-local-storage';
import type { Sequence } from '@/lib/types';

export function useSequences() {
  const [sequences, setSequences, hydrated] = useLocalStorage<Sequence[]>('outreach:sequences', []);

  const addSequence = useCallback(
    (sequence: Sequence) => {
      setSequences((prev) => {
        // Replace if same prospect already has a sequence
        const filtered = prev.filter((s) => s.prospectId !== sequence.prospectId);
        return [...filtered, sequence];
      });
    },
    [setSequences]
  );

  const addSequences = useCallback(
    (newSequences: Sequence[]) => {
      setSequences((prev) => {
        const prospectIds = new Set(newSequences.map((s) => s.prospectId));
        const filtered = prev.filter((s) => !prospectIds.has(s.prospectId));
        return [...filtered, ...newSequences];
      });
    },
    [setSequences]
  );

  const removeSequence = useCallback(
    (id: string) => {
      setSequences((prev) => prev.filter((s) => s.id !== id));
    },
    [setSequences]
  );

  const getSequenceForProspect = useCallback(
    (prospectId: string) => sequences.find((s) => s.prospectId === prospectId),
    [sequences]
  );

  const clearAll = useCallback(() => {
    setSequences([]);
  }, [setSequences]);

  return {
    sequences,
    hydrated,
    addSequence,
    addSequences,
    removeSequence,
    getSequenceForProspect,
    clearAll,
    setSequences,
  };
}
