import { NextRequest, NextResponse } from 'next/server';
import { generateSequence } from '@/lib/ai-client';
import type { Prospect, OutreachStyle } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prospect, style = 'cold' } = body as {
      prospect: Prospect;
      style?: OutreachStyle;
    };

    if (!prospect || !prospect.id || !prospect.firstName) {
      return NextResponse.json(
        { error: 'Invalid prospect data' },
        { status: 400 }
      );
    }

    const sequence = await generateSequence(prospect, style);
    return NextResponse.json(sequence);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
