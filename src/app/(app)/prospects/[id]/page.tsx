import { notFound } from 'next/navigation';
import { getRequiredUser } from '@/lib/db/helpers';
import { getProspectById, getSequenceByProspectId } from '@/lib/db/queries';
import { ProspectDetailClient } from './prospect-detail-client';

export default async function ProspectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getRequiredUser();

  const [prospect, sequence] = await Promise.all([
    getProspectById(user.id!, id),
    getSequenceByProspectId(user.id!, id),
  ]);

  if (!prospect) notFound();

  return <ProspectDetailClient prospect={prospect} sequence={sequence} />;
}
