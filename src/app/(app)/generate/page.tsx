import { getRequiredUser } from '@/lib/db/helpers';
import { getProspects } from '@/lib/db/queries';
import { GenerateClient } from './generate-client';

export default async function GeneratePage() {
  const user = await getRequiredUser();
  const prospects = await getProspects(user.id!);
  return <GenerateClient prospects={prospects} />;
}
