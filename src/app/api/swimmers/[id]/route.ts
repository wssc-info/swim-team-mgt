import { NextRequest, NextResponse } from 'next/server';
import { updateSwimmer, deleteSwimmer } from '@/lib/swimmers';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    await updateSwimmer(params.id, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating swimmer:', error);
    return NextResponse.json({ error: 'Failed to update swimmer' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteSwimmer(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting swimmer:', error);
    return NextResponse.json({ error: 'Failed to delete swimmer' }, { status: 500 });
  }
}
