import { SwimEvent } from './types';
import { fetchAllEvents } from './api';
import {SwimEventModel} from "@/lib/models";

interface Swimmer {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'M' | 'F';
  ageGroup: string;
  selectedEvents: string[];
  seedTimes: Record<string, string>;
}

interface RelayTeam {
  id: string;
  meetId: string;
  eventId: string;
  name: string;
  swimmers: string[];
  ageGroup: string;
  gender: 'M' | 'F' | 'Mixed';
}

interface Meet {
  id: string;
  name: string;
  date: string;
  location: string;
  availableEvents: string[];
  isActive: boolean;
  createdAt: string;
}

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

// Convert time string (MM:SS.ss) to centiseconds for SDIF format
function timeToSdifFormat(timeString: string): string {
  if (!timeString || timeString === 'NT') return '9999999';
  
  const parts = timeString.split(':');
  if (parts.length !== 2) return '9999999';
  
  const minutes = parseInt(parts[0]) || 0;
  const secondsParts = parts[1].split('.');
  const seconds = parseInt(secondsParts[0]) || 0;
  const centiseconds = parseInt((secondsParts[1] || '00').padEnd(2, '0').substring(0, 2)) || 0;
  
  const totalCentiseconds = (minutes * 60 * 100) + (seconds * 100) + centiseconds;
  return totalCentiseconds.toString().padStart(7, '0');
}

// Get SDIF event code for swimming events
function getEventCode(event: SwimEventModel): string {
  const strokeCodes: Record<string, string> = {
    'freestyle': '1',
    'backstroke': '2',
    'breaststroke': '3',
    'butterfly': '4',
    'individual-medley': '5'
  };
  
  const stroke = strokeCodes[event.stroke] || '1';
  const distance = event.distance.toString().padStart(4, '0');
  const course = event.course === 'SCY' ? '1' : event.course === 'LCM' ? '2' : '3';
  
  return `${stroke}${distance}${course}${event.isRelay ? '1' : '0'}`;
}

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
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const meetDate = targetMeet.date.replace(/-/g, '');
  
  // File Header (A0 record)
  content += 'A01V3                   Swim Team Management    ' + dateStr + '        \n';
  
  // Meet Header (B1 record) - use actual meet name and date
  const meetName = targetMeet.name.padEnd(20, ' ').substring(0, 20);
  content += `B1001${meetName}${meetDate}${meetDate}    1N              \n`;
  
  // Team record (C1 record) - get active club info
  let teamRecord = 'C1TEAM    Team Name                      Team Name                      TEAM    \n';
  
  try {
    const clubResponse = await fetch('/api/admin/clubs/active');
    if (clubResponse.ok) {
      const activeClub = await clubResponse.json();
      if (activeClub) {
        const clubName = activeClub.name.padEnd(30, ' ').substring(0, 30);
        const clubAbbrev = activeClub.abbreviation.padEnd(8, ' ').substring(0, 8);
        teamRecord = `C1${clubAbbrev}${clubName}${clubName}${clubAbbrev}\n`;
      }
    }
  } catch (error) {
    console.error('Error fetching active club for export:', error);
    // Fall back to default if club fetch fails
  }
  
  content += teamRecord;
  
  // Individual Entries (D0 records) - only for selected meet events
  for (const swimmer of swimmers) {
    for (const eventId of swimmer.selectedEvents) {
      // Only include events that are available in the target meet
      if (targetMeet.availableEvents.includes(eventId)) {
        const event = allEvents.find(e => e.id === eventId);
        if (event && !event.isRelay) {
          const seedTime = timeToSdifFormat(swimmer.seedTimes[eventId] || 'NT');
          const eventCode = getEventCode(event);
          const birthDate = swimmer.dateOfBirth.replace(/-/g, '');
          const lastName = swimmer.lastName.padEnd(20, ' ').substring(0, 20);
          const firstName = swimmer.firstName.padEnd(20, ' ').substring(0, 20);
          
          // Get club abbreviation for swimmer records
          let clubAbbrev = 'TEAM    ';
          try {
            const clubResponse = await fetch('/api/admin/clubs/active');
            if (clubResponse.ok) {
              const activeClub = await clubResponse.json();
              if (activeClub) {
                clubAbbrev = activeClub.abbreviation.padEnd(8, ' ').substring(0, 8);
              }
            }
          } catch (error) {
            console.error('Error fetching club for swimmer record:', error);
          }
          
          content += `D0${swimmer.gender}${swimmer.id.substring(0, 12).padEnd(12, ' ')}${lastName}${firstName}${swimmer.ageGroup.padEnd(2, ' ')}${birthDate}${clubAbbrev}${eventCode}${seedTime}    L         \n`;
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
        const eventCode = getEventCode(event);
        const teamName = team.name.padEnd(20, ' ').substring(0, 20);

        // Get club abbreviation for relay records
        let clubAbbrev = 'TEAM    ';
        try {
          const clubResponse = await fetch('/api/admin/clubs/active');
          if (clubResponse.ok) {
            const activeClub = await clubResponse.json();
            if (activeClub) {
              clubAbbrev = activeClub.abbreviation.padEnd(8, ' ').substring(0, 8);
            }
          }
        } catch (error) {
          console.error('Error fetching club for relay record:', error);
        }

        content += `F0${team.gender}${team.id.substring(0, 12).padEnd(12, ' ')}${teamName}                    ${team.ageGroup.padEnd(2, ' ')}        ${clubAbbrev}${eventCode}9999999    L         \n`;

        // Relay swimmers (G0 records)
        for (const swimmerId of team.swimmers) {
          const index = team.swimmers.indexOf(swimmerId);
          const swimmer = swimmers.find(s => s.id === swimmerId);
          if (swimmer) {
            const lastName = swimmer.lastName.padEnd(20, ' ').substring(0, 20);
            const firstName = swimmer.firstName.padEnd(20, ' ').substring(0, 20);
            const birthDate = swimmer.dateOfBirth.replace(/-/g, '');
            const legOrder = (index + 1).toString();

            // Get club abbreviation for relay swimmer records
            let clubAbbrev = 'TEAM    ';
            try {
              const clubResponse = await fetch('/api/admin/clubs/active');
              if (clubResponse.ok) {
                const activeClub = await clubResponse.json();
                if (activeClub) {
                  clubAbbrev = activeClub.abbreviation.padEnd(8, ' ').substring(0, 8);
                }
              }
            } catch (error) {
              console.error('Error fetching club for relay swimmer record:', error);
            }

            content += `G0${swimmer.gender}${swimmer.id.substring(0, 12).padEnd(12, ' ')}${lastName}${firstName}${swimmer.ageGroup.padEnd(2, ' ')}${birthDate}${clubAbbrev}${legOrder}9999999    \n`;
          }
        }
      }
    }
  }

  // File trailer (Z0 record)
  const totalRecords = content.split('\n').length - 1;
  content += `Z0${totalRecords.toString().padStart(6, '0')}                                                                  \n`;
  
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
