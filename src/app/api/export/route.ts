import { NextRequest, NextResponse } from 'next/server';
import { generateMeetManagerFile } from '@/lib/meetmanager';
import { SwimmerService } from '@/lib/services/swimmer-service';
import { SwimmerMeetEventService } from '@/lib/services/swimmer-meet-event-service';
import { RelayTeamService } from '@/lib/services/relay-team-service';
import { MeetService } from '@/lib/services/meet-service';
import {RelayTeam, SwimmerWithEvents} from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { meetId, clubId: requestClubId } = body;

    const meetService = MeetService.getInstance();
    const swimmerService = SwimmerService.getInstance();
    const swimmerMeetEventService = SwimmerMeetEventService.getInstance();
    const relayTeamService = RelayTeamService.getInstance();

    let selectedMeet = null;
    if (meetId) {
      selectedMeet = await meetService.getMeet(meetId);
    }
    if (!selectedMeet) {
      return NextResponse.json({ error: 'Meet not found' }, { status: 404 });
    }

    // Determine which club is generating this export.
    // Use the clubId passed by the client (from getClubId(user)) so that
    // against-club coaches export their own swimmers, not the host club's.
    // Fall back to selectedMeet.clubId if none supplied.
    const exportingClubId = requestClubId || selectedMeet.clubId;

    // Fetch swimmers and their event selections for this meet
    const swimmers = await swimmerService.getSwimmers(exportingClubId);
    const swimmersWithEvents: SwimmerWithEvents[] = [];

    const swimmerMeetEventsForMeet = await swimmerMeetEventService.getSwimmerMeetEvents(null, selectedMeet.id);
    for (const swimmer of swimmers) {
      try {
        // Fetch swimmer-meet-events for this specific meet
        const swimmerMeetEvents =
          swimmerMeetEventsForMeet.filter(sme => sme.swimmerId === swimmer.id);
          //await swimmerMeetEventService.getSwimmerMeetEvents(swimmer.id, selectedMeet.id);
        // const selectedEvents = swimmerMeetEvents.map(sme => sme.eventId);
        // const seedTimes = swimmerMeetEvents.reduce((acc: any, sme) => {
        //   if (sme.seedTime) {
        //     acc[sme.eventId] = sme.seedTime;
        //   }
        //   return acc;
        // }, {});
        // if(swimmerMeetEvents.length > 0) {
          swimmersWithEvents.push({
            ...swimmer,
            selectedEvents: swimmerMeetEvents,
          });
        // }
      } catch (error) {
        console.error(`Error fetching events for swimmer ${swimmer.id}:`, error);
        swimmersWithEvents.push({
          ...swimmer,
          selectedEvents: [],
        });
      }
    }
    
    // Fetch relay teams for this meet
    let relayTeams: RelayTeam[] = [];
    try {
      relayTeams = await relayTeamService.getRelayTeams(selectedMeet.id, exportingClubId);
    } catch (error) {
      console.error('Error fetching relay teams:', error);
    }
    const content = await generateMeetManagerFile(selectedMeet, swimmersWithEvents, relayTeams, exportingClubId);
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
