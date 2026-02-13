'use client';

import { useCallback } from 'react';
import { useLocalStorage } from './use-local-storage';
import type { Prospect, ProspectStatus } from '@/lib/types';

export function useProspects() {
  const [prospects, setProspects, hydrated] = useLocalStorage<Prospect[]>('outreach:prospects', []);

  const addProspects = useCallback(
    (newProspects: Prospect[]) => {
      setProspects((prev) => [...prev, ...newProspects]);
    },
    [setProspects]
  );

  const updateProspect = useCallback(
    (id: string, updates: Partial<Prospect>) => {
      setProspects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
      );
    },
    [setProspects]
  );

  const updateStatus = useCallback(
    (ids: string[], status: ProspectStatus) => {
      setProspects((prev) =>
        prev.map((p) => (ids.includes(p.id) ? { ...p, status } : p))
      );
    },
    [setProspects]
  );

  const removeProspects = useCallback(
    (ids: string[]) => {
      setProspects((prev) => prev.filter((p) => !ids.includes(p.id)));
    },
    [setProspects]
  );

  const clearAll = useCallback(() => {
    setProspects([]);
  }, [setProspects]);

  return {
    prospects,
    hydrated,
    addProspects,
    updateProspect,
    updateStatus,
    removeProspects,
    clearAll,
    setProspects,
  };
}
