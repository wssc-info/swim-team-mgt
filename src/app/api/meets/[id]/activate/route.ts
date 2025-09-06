import { NextRequest, NextResponse } from 'next/server';
import { setActiveMeet } from '@/lib/swimmers';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await setActiveMeet(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting active meet:', error);
    return NextResponse.json({ error: 'Failed to set active meet' }, { status: 500 });
  }
}
