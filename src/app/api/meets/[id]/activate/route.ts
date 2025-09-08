import { NextRequest, NextResponse } from 'next/server';
import { MeetService } from '@/lib/services/meet-service';

const meetService = MeetService.getInstance();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const {id} = await params;
    await meetService.setActiveMeet(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting active meet:', error);
    return NextResponse.json({ error: 'Failed to set active meet' }, { status: 500 });
  }
}
