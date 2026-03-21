import { NextRequest, NextResponse } from 'next/server';
import { generateMeetManagerFile } from '@/lib/meetmanager';
import { SwimmerService } from '@/lib/services/swimmer-service';
import { SwimmerMeetEventService } from '@/lib/services/swimmer-meet-event-service';
import { RelayTeamService } from '@/lib/services/relay-team-service';
import { MeetService } from '@/lib/services/meet-service';
import { AuthService } from '@/lib/services/auth-service';
import { SwimClubModel } from '@/lib/models';
import {RelayTeam, SwimmerWithEvents} from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { meetId, clubId: requestClubId } = body;

    const meetService = MeetService.getInstance();
    const swimmerService = SwimmerService.getInstance();
    const swimmerMeetEventService = SwimmerMeetEventService.getInstance();
    const relayTeamService = RelayTeamService.getInstance();

    // Get the authenticated user so we can use their name as contact and their
    // club (JWT-verified for coaches; admin supplies it via requestClubId).
    const authUser = await AuthService.getInstance().getUser(request);

    let selectedMeet = null;
    if (meetId) {
      selectedMeet = await meetService.getMeet(meetId);
    }
    if (!selectedMeet) {
      return NextResponse.json({ error: 'Meet not found' }, { status: 404 });
    }

    // Determine which club is generating this export.
    // For coaches/family the JWT clubId is authoritative (tamper-proof).
    // For admins (no clubId in JWT) fall back to the clubId from the request body.
    // Final fallback: the meet's home club.
    const exportingClubId = authUser?.clubId || requestClubId || selectedMeet.clubId;

    // Build contact info from the authenticated user and their club.
    const contactName = authUser
      ? `${authUser.firstName} ${authUser.lastName}`.trim()
      : undefined;
    const exportingClub = exportingClubId
      ? await SwimClubModel.findByPk(exportingClubId)
      : null;
    const contactPhone = authUser?.phoneNumber || (exportingClub?.phone ?? undefined);

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
    const content = await generateMeetManagerFile(selectedMeet, swimmersWithEvents, relayTeams, exportingClubId, contactName, contactPhone);
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
