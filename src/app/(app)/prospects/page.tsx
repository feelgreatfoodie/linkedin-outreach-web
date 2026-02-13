import { getRequiredUser } from '@/lib/db/helpers';
import { getProspects, getSequences } from '@/lib/db/queries';
import { ProspectsClient } from './prospects-client';

export default async function ProspectsPage() {
  const user = await getRequiredUser();
  const [prospects, sequences] = await Promise.all([
    getProspects(user.id!),
    getSequences(user.id!),
  ]);

  const sequenceProspectIds = new Set(sequences.map((s) => s.prospectId));

  return (
    <ProspectsClient
      prospects={prospects}
      sequenceProspectIds={Array.from(sequenceProspectIds)}
    />
  );
}
