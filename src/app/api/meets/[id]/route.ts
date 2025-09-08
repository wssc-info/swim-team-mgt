import { NextRequest, NextResponse } from 'next/server';
import { MeetService } from '@/lib/services/meet-service';

const meetService = MeetService.getInstance();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    await meetService.updateMeet(id, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating meet:', error);
    return NextResponse.json({ error: 'Failed to update meet' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await meetService.deleteMeet(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting meet:', error);
    return NextResponse.json({ error: 'Failed to delete meet' }, { status: 500 });
  }
}
