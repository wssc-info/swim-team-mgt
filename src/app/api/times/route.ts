import { NextRequest, NextResponse } from 'next/server';
import { getTimeRecords, addTimeRecord } from '@/lib/swimmers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const swimmerId = searchParams.get('swimmerId');
    
    const records = await getTimeRecords(swimmerId || undefined);
    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching time records:', error);
    return NextResponse.json({ error: 'Failed to fetch time records' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const record = await addTimeRecord(body);
    return NextResponse.json(record);
  } catch (error) {
    console.error('Error adding time record:', error);
    return NextResponse.json({ error: 'Failed to add time record' }, { status: 500 });
  }
}
