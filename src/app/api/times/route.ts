import { NextRequest, NextResponse } from 'next/server';
import { TimeRecordService } from '@/lib/services/time-record-service';
import { AuthService } from '@/lib/services/auth-service';
import { SwimmerService } from '@/lib/services/swimmer-service';

const timeRecordService = TimeRecordService.getInstance();
const swimmerService = SwimmerService.getInstance();

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getInstance().getUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Must be logged in.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const swimmerId = searchParams.get('swimmerId');
    const eventId = searchParams.get('eventId');
    const meetDate = searchParams.get('meetDate');

    // Family users may only see times for their own associated swimmers
    if (user.role === 'family') {
      const associated = await swimmerService.getAssociatedSwimmers(user.id, ['approved', 'pending']);
      const allowedIds = new Set(associated.map(s => s.id));

      // If a specific swimmer was requested, verify the family has access
      if (swimmerId && !allowedIds.has(swimmerId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Fetch for the requested swimmer, or fetch each associated swimmer's records
      if (swimmerId) {
        const records = await timeRecordService.getTimeRecords(swimmerId, eventId || undefined, meetDate || undefined);
        return NextResponse.json(records);
      }

      const allRecords = await Promise.all(
        Array.from(allowedIds).map(id => timeRecordService.getTimeRecords(id, eventId || undefined, meetDate || undefined))
      );
      return NextResponse.json(allRecords.flat());
    }

    const records = await timeRecordService.getTimeRecords(
      swimmerId || undefined,
      eventId || undefined,
      meetDate || undefined);
    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching time records:', error);
    return NextResponse.json({ error: 'Failed to fetch time records' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await AuthService.getInstance().getUser(request);
    if (!user || (user.role !== 'admin' && user.role !== 'leagueAdmin' && user.role !== 'coach')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const record = await timeRecordService.addTimeRecord(body);
    return NextResponse.json(record);
  } catch (error) {
    console.error('Error adding time record:', error);
    return NextResponse.json({ error: 'Failed to add time record' }, { status: 500 });
  }
}
