import { NextRequest, NextResponse } from 'next/server';
import { updateMeet, deleteMeet } from '@/lib/swimmers';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    await updateMeet(params.id, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating meet:', error);
    return NextResponse.json({ error: 'Failed to update meet' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteMeet(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting meet:', error);
    return NextResponse.json({ error: 'Failed to delete meet' }, { status: 500 });
  }
}
