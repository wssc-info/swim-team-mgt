import { SwimEvent } from './types';
import { fetchAllEvents } from './api';
import { SwimClubModel, SwimEventModel } from '@/lib/models';
import { Swimmer, RelayTeam, Meet, MeetManagerEntry, MeetManagerRelay } from './sdif/types';
import { getEventCode } from './sdif/utils';
import { A0Record } from './sdif/records/A0Record';
import { B1Record } from './sdif/records/B1Record';
import { C1Record } from './sdif/records/C1Record';
import { D0Record } from './sdif/records/D0Record';
import { F0Record } from './sdif/records/F0Record';
import { G0Record } from './sdif/records/G0Record';
import { Z0Record } from './sdif/records/Z0Record';

export async function generateMeetManagerFile(selectedMeet?: Meet, swimmers: Swimmer[] = [], relayTeams: RelayTeam[] = []): Promise<string> {
  // Get target meet
  const targetMeet = selectedMeet;
  if (!targetMeet) {
    throw new Error('No meet selected for export');
  }
  
  // Fetch all events from database
  const allEvents = await SwimEventModel.findAll({
    order: [['course', 'ASC'], ['stroke', 'ASC'], ['distance', 'ASC']]
  });
  
  let content = '';
  const meetDate = targetMeet.date.replace(/-/g, '');
  
  // Generate SDIF records using utility classes
  content += A0Record.generate();
  content += B1Record.generate(targetMeet);
  content += await C1Record.generate(targetMeet);
  
  // Get club abbreviation for use in other records
  let clubAbbrev = 'TEAM';
  const club = await SwimClubModel.findByPk(targetMeet.clubId);
  if (club) {
    clubAbbrev = club.abbreviation;
  }
  
  // Individual Entries (D0 records) - only for selected meet events
  for (const swimmer of swimmers) {
    for (const eventId of swimmer.selectedEvents) {
      // Only include events that are available in the target meet
      if (targetMeet.availableEvents.includes(eventId)) {
        const event = allEvents.find(e => e.id === eventId);
        if (event && !event.isRelay) {
          const seedTime = swimmer.seedTimes[eventId] || 'NT';
          content += D0Record.generate(swimmer, event, meetDate, seedTime);
        }
      }
    }
  }
  
  // Relay Entries (F0 records) - only for selected meet events
  for (const team of relayTeams) {
    // Only include relay teams for events available in the target meet
    if (targetMeet.availableEvents.includes(team.eventId)) {
      const event = allEvents.find(e => e.id === team.eventId);
      if (event) {
        // Generate F0 records for each swimmer in the relay team
        for (const swimmerId of team.swimmers) {
          const index = team.swimmers.indexOf(swimmerId);
          const swimmer = swimmers.find(s => s.id === swimmerId);
          if (swimmer) {
            const legOrder = index + 1;
            content += F0Record.generate(swimmer, team, clubAbbrev, legOrder);
          }
        }
      }
    }
  }

  // File trailer (Z0 record)
  const totalRecords = content.split('\n').length - 1; // Don't count the final record itself
  content += Z0Record.generate(totalRecords);
  
  // Return the content instead of downloading
  return content;
}

export async function getMeetEntries(swimmers: Swimmer[] = [], relayTeams: RelayTeam[] = []): Promise<{ individual: MeetManagerEntry[], relays: MeetManagerRelay[] }> {
  const individual: MeetManagerEntry[] = [];
  const relays: MeetManagerRelay[] = [];
  
  // Fetch all events from database
  const allEvents = await fetchAllEvents();
  
  // Individual entries
  swimmers.forEach(swimmer => {
    swimmer.selectedEvents.forEach(eventId => {
      const event = allEvents.find(e => e.id === eventId);
      if (event && !event.isRelay) {
        individual.push({
          swimmer,
          event,
          seedTime: swimmer.seedTimes[eventId]
        });
      }
    });
  });
  
  // Relay entries
  relayTeams.forEach(team => {
    const event = allEvents.find(e => e.id === team.eventId);
    if (event) {
      const teamSwimmers = team.swimmers
        .map(id => swimmers.find(s => s.id === id))
        .filter(Boolean) as Swimmer[];
      
      relays.push({
        team,
        event,
        swimmers: teamSwimmers
      });
    }
  });
  
  return { individual, relays };
}
