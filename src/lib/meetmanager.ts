import { saveAs } from 'file-saver';
import { Swimmer, RelayTeam, getSwimmers, getRelayTeams } from './swimmers';
import { USA_SWIMMING_EVENTS, SwimEvent } from './events';

export interface MeetManagerEntry {
  swimmer: Swimmer;
  event: SwimEvent;
  seedTime?: string;
}

export interface MeetManagerRelay {
  team: RelayTeam;
  event: SwimEvent;
  swimmers: Swimmer[];
}

export function generateMeetManagerFile(): void {
  const swimmers = getSwimmers();
  const relayTeams = getRelayTeams();
  
  let content = '';
  
  // Header
  content += '#Meet Manager Export\n';
  content += '#Generated on ' + new Date().toISOString() + '\n\n';
  
  // Individual Entries
  content += '#Individual Entries\n';
  swimmers.forEach(swimmer => {
    swimmer.selectedEvents.forEach(eventId => {
      const event = USA_SWIMMING_EVENTS.find(e => e.id === eventId);
      if (event && !event.isRelay) {
        const seedTime = swimmer.seedTimes[eventId] || 'NT';
        content += `${swimmer.lastName}, ${swimmer.firstName}\t${swimmer.gender}\t${swimmer.ageGroup}\t${event.name}\t${seedTime}\n`;
      }
    });
  });
  
  content += '\n#Relay Entries\n';
  relayTeams.forEach(team => {
    const event = USA_SWIMMING_EVENTS.find(e => e.id === team.eventId);
    if (event) {
      content += `${team.name}\t${team.gender}\t${team.ageGroup}\t${event.name}\n`;
      team.swimmers.forEach((swimmerId, index) => {
        const swimmer = swimmers.find(s => s.id === swimmerId);
        if (swimmer) {
          content += `  ${index + 1}. ${swimmer.lastName}, ${swimmer.firstName}\n`;
        }
      });
      content += '\n';
    }
  });
  
  // Create and download file
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, `swim-meet-entries-${new Date().toISOString().split('T')[0]}.txt`);
}

export function getMeetEntries(): { individual: MeetManagerEntry[], relays: MeetManagerRelay[] } {
  const swimmers = getSwimmers();
  const relayTeams = getRelayTeams();
  
  const individual: MeetManagerEntry[] = [];
  const relays: MeetManagerRelay[] = [];
  
  // Individual entries
  swimmers.forEach(swimmer => {
    swimmer.selectedEvents.forEach(eventId => {
      const event = USA_SWIMMING_EVENTS.find(e => e.id === eventId);
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
    const event = USA_SWIMMING_EVENTS.find(e => e.id === team.eventId);
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
