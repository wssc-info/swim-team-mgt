import { NextRequest, NextResponse } from 'next/server';
import { TimeRecordService } from '@/lib/services/time-record-service';

const timeRecordService = TimeRecordService.getInstance();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    await timeRecordService.updateTimeRecord(id, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating time record:', error);
    return NextResponse.json({ error: 'Failed to update time record' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await timeRecordService.deleteTimeRecord(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting time record:', error);
    return NextResponse.json({ error: 'Failed to delete time record' }, { status: 500 });
  }
}
