'use server';

import { revalidatePath } from 'next/cache';
import { getRequiredUser } from '@/lib/db/helpers';
import { regenerateApiKey, createProspects, createSequences } from '@/lib/db/queries';
import type { Prospect, Sequence } from '@/lib/types';

export async function regenerateApiKeyAction() {
  const user = await getRequiredUser();
  const newKey = await regenerateApiKey(user.id!);
  revalidatePath('/settings');
  return newKey;
}

export async function migrateLocalDataAction(
  prospects: Omit<Prospect, 'id'>[],
  sequences: Omit<Sequence, 'id'>[]
) {
  const user = await getRequiredUser();
  const created = await createProspects(user.id!, prospects);

  // Map old prospect IDs to new ones by matching firstName + lastName + company
  if (sequences.length > 0 && created.length > 0) {
    const prospectMap = new Map<string, string>();
    for (const p of created) {
      const key = `${p.firstName}|${p.lastName}|${p.company}`.toLowerCase();
      prospectMap.set(key, p.id);
    }

    const mappedSequences: Omit<Sequence, 'id'>[] = [];
    for (const seq of sequences) {
      // Try to find the new prospect ID
      const prospectName = seq.prospectName || '';
      const nameParts = prospectName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      const key = `${firstName}|${lastName}|${seq.company}`.toLowerCase();
      const newProspectId = prospectMap.get(key);
      if (newProspectId) {
        mappedSequences.push({ ...seq, prospectId: newProspectId });
      }
    }

    if (mappedSequences.length > 0) {
      await createSequences(user.id!, mappedSequences);
    }
  }

  revalidatePath('/');
  revalidatePath('/prospects');
  revalidatePath('/sequences');
  return { prospects: created.length, sequences: sequences.length };
}
