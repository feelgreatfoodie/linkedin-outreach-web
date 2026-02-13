import { getRequiredUser } from '@/lib/db/helpers';
import { getSequences } from '@/lib/db/queries';
import { SequencesClient } from './sequences-client';

export default async function SequencesPage() {
  const user = await getRequiredUser();
  const sequences = await getSequences(user.id!);
  return <SequencesClient sequences={sequences} />;
}
