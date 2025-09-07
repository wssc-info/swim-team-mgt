import { NextRequest, NextResponse } from 'next/server';
import { SwimmerService } from '@/lib/services/swimmer-service';

const swimmerService = SwimmerService.getInstance();

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const {id} = await params;
  try {
    const body = await request.json();
    await swimmerService.updateSwimmer(id, body);
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
    const { id } = await params;
    await swimmerService.deleteSwimmer(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting swimmer:', error);
    return NextResponse.json({ error: 'Failed to delete swimmer' }, { status: 500 });
  }
}
