import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateSequence } from '@/lib/ai-client';
import type { Prospect, OutreachStyle, Sequence } from '@/lib/types';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { prospects, style = 'cold' } = body as {
      prospects: Prospect[];
      style?: OutreachStyle;
    };

    if (!prospects || !Array.isArray(prospects) || prospects.length === 0) {
      return NextResponse.json(
        { error: 'Must provide at least one prospect' },
        { status: 400 }
      );
    }

    const results: Sequence[] = [];
    const errors: { prospectId: string; prospectName: string; error: string }[] = [];

    for (let i = 0; i < prospects.length; i++) {
      const prospect = prospects[i];
      try {
        const sequence = await generateSequence(prospect, style);
        results.push(sequence);
      } catch (error) {
        errors.push({
          prospectId: prospect.id,
          prospectName: `${prospect.firstName} ${prospect.lastName}`,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      // Rate limit: 1s delay between calls (except last)
      if (i < prospects.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return NextResponse.json({ results, errors });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Batch generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const maxDuration = 300; // 5 minutes for batch
