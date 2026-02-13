import { db } from '@/lib/db';
import { prospects, sequences, users } from './schema';
import { eq, and, inArray } from 'drizzle-orm';
import type { Prospect, Sequence } from '@/lib/types';

// ── Prospects ──

export async function getProspects(userId: string) {
  return db.select().from(prospects).where(eq(prospects.userId, userId));
}

export async function getProspectById(userId: string, id: string) {
  const rows = await db
    .select()
    .from(prospects)
    .where(and(eq(prospects.userId, userId), eq(prospects.id, id)));
  return rows[0] ?? null;
}

export async function createProspects(
  userId: string,
  data: Omit<Prospect, 'id'>[]
) {
  if (data.length === 0) return [];
  return db
    .insert(prospects)
    .values(
      data.map((p) => ({
        userId,
        firstName: p.firstName,
        lastName: p.lastName,
        title: p.title,
        company: p.company,
        companySize: p.companySize,
        industry: p.industry,
        location: p.location,
        linkedinUrl: p.linkedinUrl,
        connectedOn: p.connectedOn,
        notes: p.notes,
        status: p.status,
        importedAt: p.importedAt,
      }))
    )
    .returning();
}

export async function updateProspect(
  userId: string,
  id: string,
  data: Partial<Prospect>
) {
  const { id: _id, ...rest } = data;
  return db
    .update(prospects)
    .set(rest)
    .where(and(eq(prospects.userId, userId), eq(prospects.id, id)));
}

export async function updateProspectStatus(
  userId: string,
  ids: string[],
  status: Prospect['status']
) {
  if (ids.length === 0) return;
  return db
    .update(prospects)
    .set({ status })
    .where(and(eq(prospects.userId, userId), inArray(prospects.id, ids)));
}

export async function deleteProspects(userId: string, ids: string[]) {
  if (ids.length === 0) return;
  return db
    .delete(prospects)
    .where(and(eq(prospects.userId, userId), inArray(prospects.id, ids)));
}

// ── Sequences ──

export async function getSequences(userId: string) {
  return db.select().from(sequences).where(eq(sequences.userId, userId));
}

export async function getSequenceByProspectId(
  userId: string,
  prospectId: string
) {
  const rows = await db
    .select()
    .from(sequences)
    .where(
      and(eq(sequences.userId, userId), eq(sequences.prospectId, prospectId))
    );
  return rows[0] ?? null;
}

export async function createSequence(userId: string, data: Omit<Sequence, 'id'>) {
  // Upsert: replace existing sequence for same prospect
  await db
    .delete(sequences)
    .where(
      and(
        eq(sequences.userId, userId),
        eq(sequences.prospectId, data.prospectId)
      )
    );

  const rows = await db
    .insert(sequences)
    .values({
      userId,
      prospectId: data.prospectId,
      prospectName: data.prospectName,
      company: data.company,
      style: data.style,
      model: data.model,
      provider: data.provider,
      generatedAt: data.generatedAt,
      generationTime: data.generationTime,
      demo: data.demo ?? false,
      messages: data.messages,
    })
    .returning();

  return rows[0];
}

export async function createSequences(
  userId: string,
  data: Omit<Sequence, 'id'>[]
) {
  const results = [];
  for (const seq of data) {
    const row = await createSequence(userId, seq);
    results.push(row);
  }
  return results;
}

export async function deleteSequence(userId: string, id: string) {
  return db
    .delete(sequences)
    .where(and(eq(sequences.userId, userId), eq(sequences.id, id)));
}

// ── Users / API Keys ──

export async function getUserByApiKey(apiKey: string) {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.apiKey, apiKey));
  return rows[0] ?? null;
}

export async function regenerateApiKey(userId: string) {
  const { nanoid } = await import('nanoid');
  const newKey = `key_${nanoid(32)}`;
  await db.update(users).set({ apiKey: newKey }).where(eq(users.id, userId));
  return newKey;
}

export async function getApiKey(userId: string) {
  const rows = await db
    .select({ apiKey: users.apiKey })
    .from(users)
    .where(eq(users.id, userId));
  return rows[0]?.apiKey ?? null;
}
