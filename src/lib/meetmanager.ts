import {SwimClubModel, SwimEventModel} from '@/lib/models';
import {
  Meet,
  RelayTeam,
  Swimmer,
  SwimmerMeetEvent,
  SwimmerWithEvents
} from '@/lib/types';
import {A0Record} from './sdif/records/A0Record';
import {B1Record} from './sdif/records/B1Record';
import {C1Record} from './sdif/records/C1Record';
import {D0Record} from './sdif/records/D0Record';
import {E0Record} from './sdif/records/E0Record';
import {F0Record} from './sdif/records/F0Record';
import {Z0Record} from './sdif/records/Z0Record';
import {SwimmerMeetEventService} from "@/lib/services/swimmer-meet-event-service";
import {D3Record} from "@/lib/sdif/records/D3Record";

export async function generateMeetManagerFile(
  selectedMeet?: Meet,
  swimmers: SwimmerWithEvents[] = [],
  relayTeams: RelayTeam[] = [],
  exportingClubId?: string,
  contactName?: string,
  contactPhone?: string,
): Promise<string> {
  // Get target meet
  const targetMeet = selectedMeet;
  if (!targetMeet) {
    throw new Error('No meet selected for export');
  }

  // The club generating this export: explicit override, or the meet's home club.
  const clubId = exportingClubId || targetMeet.clubId;

  // Fetch all events from database
  const allEvents = await SwimEventModel.findAll({
    order: [['course', 'ASC'], ['stroke', 'ASC'], ['distance', 'ASC']]
  });

  let content = '';
  const meetDate = targetMeet.date.replace(/-/g, '');

  // Generate SDIF records using utility classes
  content += A0Record.generate("Meet Entries", contactName, contactPhone);
  content += B1Record.generate(targetMeet);
  content += await C1Record.generate(targetMeet, clubId);

  // Get club abbreviation for use in relay records
  let clubAbbrev = 'TEAM';
  const club = await SwimClubModel.findByPk(clubId);
  if (club) {
    clubAbbrev = club.abbreviation;
  }

  const swimmerToEventsMap = new Map<string, SwimmerMeetEvent[]>();

  const swimmerIdsWithD3 = new Set<string>();

  // Individual Entries (D0 records) - only for selected meet events
  const swimmerMeetEventService = SwimmerMeetEventService.getInstance();
  for (const swimmer of swimmers) {
    const swimmerEvents = swimmer.selectedEvents || [];
    swimmerToEventsMap.set(swimmer.id, swimmerEvents);
    for (const swimmerEvent of swimmerEvents) {
      // Only include events that are in the target meet's meetEvents and match swimmer's age group
      const event = allEvents.find(e => e.id === swimmerEvent.eventId);
      const meetEvent = targetMeet.meetEvents.find(me => 
        me.eventId === swimmerEvent.eventId && me.ageGroup === swimmer.ageGroup
      );
      
      if (event && !event.isRelay && meetEvent) {
        const seedTime = swimmerEvent.seedTime || 'NT';
        content += D0Record.generate(swimmer, event, meetEvent, meetDate, seedTime);
        if (!swimmerIdsWithD3.has(swimmer.id)) {
          content += D3Record.generate(swimmer);
          swimmerIdsWithD3.add(swimmer.id);
        }
      }
    }
  }
  
  // Relay Entries (E0 and F0 records) - only for selected meet events
  for (const team of relayTeams) {
    // Only include relay teams for events in the target meet's meetEvents that match the team's age group
    const meetEvent = targetMeet.meetEvents.find(me => 
      me.eventId === team.eventId && me.ageGroup === team.ageGroup
    );
    
    if (meetEvent) {
      const event = allEvents.find(e => e.id === team.eventId);
      if (event) {
        // Generate E0 record for the relay team
        const numF0Records = team.swimmers.length;
        content += E0Record.generate(team, event, clubAbbrev, meetDate, numF0Records);

        // Generate F0 records for each swimmer in the relay team
        for (const swimmerId of team.swimmers) {
          const index = team.swimmers.indexOf(swimmerId);
          const swimmer = swimmers.find(s => s.id === swimmerId);
          if (swimmer) {
            const legOrder = index + 1;
            content += F0Record.generate(swimmer, team, clubAbbrev, legOrder);
            if (!swimmerIdsWithD3.has(swimmer.id)) {
              content += D3Record.generate(swimmer);
              swimmerIdsWithD3.add(swimmer.id);
            }
          }
        }
      }
    }
  }

  // File trailer (Z0 record)
  const lines = content.split('\n').filter(line => line.trim() !== '');
  
  // Count different record types
  const bRecords = lines.filter(line => line.startsWith('B1')).length;
  const cRecords = lines.filter(line => line.startsWith('C1')).length;
  const dRecords = lines.filter(line => line.startsWith('D0')).length;
  const eRecords = lines.filter(line => line.startsWith('E0')).length;
  const fRecords = lines.filter(line => line.startsWith('F0')).length;
  const gRecords = lines.filter(line => line.startsWith('G0')).length;
  
  // Count unique entities
  const meets = 1; // We're exporting one meet
  const teams = 1; // We're exporting one team (the club)
  const uniqueSwimmers = new Set();
  
  // Count unique swimmers from D0 and F0 records
  for (const swimmer of swimmers) {
    const swimmerEvents = swimmerToEventsMap.get(swimmer.id) || [];
    for (const swimmerEvent of swimmerEvents) {
      const event = allEvents.find(e => e.id === swimmerEvent.eventId);
      const meetEvent = targetMeet.meetEvents.find(me => 
        me.eventId === swimmerEvent.eventId && me.ageGroup === swimmer.ageGroup
      );
      
      if (event && !event.isRelay && meetEvent) {
        uniqueSwimmers.add(swimmer.id);
      }
    }
  }
  
  // Add swimmers from relay teams
  for (const team of relayTeams) {
    const meetEvent = targetMeet.meetEvents.find(me => 
      me.eventId === team.eventId && me.ageGroup === team.ageGroup
    );
    
    if (meetEvent) {
      for (const swimmerId of team.swimmers) {
        uniqueSwimmers.add(swimmerId);
      }
    }
  }
  
  const recordCounts = {
    bRecords,
    meets,
    cRecords,
    teams,
    dRecords,
    swimmers: uniqueSwimmers.size,
    eRecords,
    fRecords,
    gRecords
  };
  
  content += Z0Record.generate(recordCounts);
  
  // Return the content instead of downloading
  return content;
}
