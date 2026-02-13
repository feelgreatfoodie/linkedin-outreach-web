import { getRequiredUser } from '@/lib/db/helpers';
import { getApiKey, getProspects } from '@/lib/db/queries';
import { SettingsClient } from './settings-client';

export default async function SettingsPage() {
  const user = await getRequiredUser();
  const [apiKey, prospects] = await Promise.all([
    getApiKey(user.id!),
    getProspects(user.id!),
  ]);

  return (
    <SettingsClient
      apiKey={apiKey}
      hasDbData={prospects.length > 0}
    />
  );
}
