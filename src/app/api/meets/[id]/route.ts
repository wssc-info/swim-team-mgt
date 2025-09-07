import { NextRequest, NextResponse } from 'next/server';
import { updateMeet, deleteMeet } from '@/lib/swimmers';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    await updateMeet(id, body);
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
    const { id } = await params;
    await deleteMeet(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting meet:', error);
    return NextResponse.json({ error: 'Failed to delete meet' }, { status: 500 });
  }
}
