'use server';

import { revalidatePath } from 'next/cache';
import { getRequiredUser } from '@/lib/db/helpers';
import { createSequences, updateProspectStatus } from '@/lib/db/queries';
import type { Sequence } from '@/lib/types';

export async function saveSequencesAction(
  sequences: Omit<Sequence, 'id'>[],
  prospectIds: string[]
) {
  const user = await getRequiredUser();
  await createSequences(user.id!, sequences);
  await updateProspectStatus(user.id!, prospectIds, 'sequenced');
  revalidatePath('/sequences');
  revalidatePath('/prospects');
  revalidatePath('/');
}
