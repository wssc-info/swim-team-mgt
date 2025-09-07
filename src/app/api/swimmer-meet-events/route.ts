import { NextRequest, NextResponse } from 'next/server';
import { SwimmerMeetEventService } from '@/lib/services/swimmer-meet-event-service';

const swimmerMeetEventService = SwimmerMeetEventService.getInstance();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const swimmerId = searchParams.get('swimmerId');
    const meetId = searchParams.get('meetId');
    
    if (!swimmerId || !meetId) {
      return NextResponse.json({ error: 'swimmerId and meetId are required' }, { status: 400 });
    }

    const events = await swimmerMeetEventService.getSwimmerMeetEvents(swimmerId, meetId);
    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching swimmer meet events:', error);
    return NextResponse.json({ error: 'Failed to fetch swimmer meet events' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { swimmerId, meetId, eventSelections } = body;
    
    if (!swimmerId || !meetId || !Array.isArray(eventSelections)) {
      return NextResponse.json({ error: 'swimmerId, meetId, and eventSelections are required' }, { status: 400 });
    }

    await swimmerMeetEventService.replaceSwimmerMeetEvents(swimmerId, meetId, eventSelections);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating swimmer meet events:', error);
    return NextResponse.json({ error: 'Failed to update swimmer meet events' }, { status: 500 });
  }
}
