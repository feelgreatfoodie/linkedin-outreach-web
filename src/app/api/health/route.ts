import { NextResponse } from 'next/server';
import { getHealthInfo } from '@/lib/ai-client';

export async function GET() {
  const health = getHealthInfo();
  return NextResponse.json(health);
}
