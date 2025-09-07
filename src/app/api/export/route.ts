import { NextRequest, NextResponse } from 'next/server';
import { generateMeetManagerFile } from '@/lib/meetmanager';
import { SwimmerService } from '@/lib/services/swimmer-service';
import { SwimmerMeetEventService } from '@/lib/services/swimmer-meet-event-service';
import { RelayTeamService } from '@/lib/services/relay-team-service';
import { MeetService } from '@/lib/services/meet-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { meetId } = body;
    
    const meetService = MeetService.getInstance();
    const swimmerService = SwimmerService.getInstance();
    const swimmerMeetEventService = SwimmerMeetEventService.getInstance();
    const relayTeamService = RelayTeamService.getInstance();
    
    let selectedMeet = null;
    if (meetId) {
      const meets = await meetService.getMeets();
      selectedMeet = meets.find(m => m.id === meetId);
      if (!selectedMeet) {
        return NextResponse.json({ error: 'Meet not found' }, { status: 404 });
      }
    }
    
    // Fetch swimmers and their event selections for this meet
    const swimmers = await swimmerService.getSwimmers();
    const swimmersWithEvents = [];
    
    if (selectedMeet) {
      for (const swimmer of swimmers) {
        try {
          // Fetch swimmer-meet-events for this specific meet
          const swimmerMeetEvents = await swimmerMeetEventService.getSwimmerMeetEvents(swimmer.id, selectedMeet.id);
          const selectedEvents = swimmerMeetEvents.map(sme => sme.eventId);
          const seedTimes = swimmerMeetEvents.reduce((acc: any, sme) => {
            if (sme.seedTime) {
              acc[sme.eventId] = sme.seedTime;
            }
            return acc;
          }, {});
          
          swimmersWithEvents.push({
            ...swimmer,
            selectedEvents,
            seedTimes
          });
        } catch (error) {
          console.error(`Error fetching events for swimmer ${swimmer.id}:`, error);
          swimmersWithEvents.push({
            ...swimmer,
            selectedEvents: [],
            seedTimes: {}
          });
        }
      }
    } else {
      // No specific meet, add all swimmers with empty selections
      swimmersWithEvents.push(...swimmers.map(swimmer => ({
        ...swimmer,
        selectedEvents: [],
        seedTimes: {}
      })));
    }
    
    // Fetch relay teams for this meet
    let relayTeams = [];
    if (selectedMeet) {
      try {
        relayTeams = await relayTeamService.getRelayTeams(selectedMeet.id);
      } catch (error) {
        console.error('Error fetching relay teams:', error);
      }
    }
    
    const content = await generateMeetManagerFile(selectedMeet || undefined, swimmersWithEvents, relayTeams);
    const fileName = selectedMeet 
      ? `${selectedMeet.name.replace(/[^a-zA-Z0-9]/g, '_')}_${selectedMeet.date.replace(/-/g, '')}.sd3`
      : `swim-meet-entries-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.sd3`;
    
    return NextResponse.json({ 
      success: true, 
      content,
      fileName 
    });
  } catch (error) {
    console.error('Error generating export:', error);
    return NextResponse.json({ error: 'Failed to generate export' }, { status: 500 });
  }
}
