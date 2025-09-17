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
  
  // File Header (A0 record) - positions 1-80
  // A0 + Org + Version + File Description + Date + Spacer for future use
  const fileDesc = 'Swim Team Management'.padEnd(30, ' ');
  const spacerA0 = ''.padEnd(20, ' '); // Spacer for future use
  content += `A01V3${fileDesc}${dateStr}${spacerA0}\n`;
  
  // Meet Header (B1 record) - positions 1-80
  // B1 + Org + Meet Name + Start Date + End Date + Pool + Course + Spacer for future use
  const meetName = targetMeet.name.padEnd(30, ' ').substring(0, 30);
  const poolCode = '1'; // 1=25Y, 2=50M, 3=25M
  const courseCode = 'Y'; // Y=SCY, M=LCM, S=SCM
  const spacerB1 = ''.padEnd(14, ' '); // Spacer for future use
  content += `B1001${meetName}${meetDate}${meetDate}${poolCode}${courseCode}${spacerB1}\n`;
  
  // Team record (C1 record) - positions 1-80
  // C1 + Team Code + Team Name + Team Name Short + Team Abbrev + Spacer for future use
  let clubAbbrev = 'TEAM';
  let clubName = 'Team Name';
  
  try {
    const clubResponse = await fetch('/api/admin/clubs/active');
    if (clubResponse.ok) {
      const activeClub = await clubResponse.json();
      if (activeClub) {
        clubName = activeClub.name;
        clubAbbrev = activeClub.abbreviation;
      }
    }
  } catch (error) {
    console.error('Error fetching active club for export:', error);
    // Fall back to default if club fetch fails
  }
  
  const teamCode = clubAbbrev.padEnd(8, ' ').substring(0, 8);
  const teamNameLong = clubName.padEnd(30, ' ').substring(0, 30);
  const teamNameShort = clubName.padEnd(16, ' ').substring(0, 16);
  const teamAbbrev = clubAbbrev.padEnd(5, ' ').substring(0, 5);
  const spacerC1 = ''.padEnd(19, ' '); // Spacer for future use
  
  content += `C1${teamCode}${teamNameLong}${teamNameShort}${teamAbbrev}${spacerC1}\n`;
  
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
          const swimmerId = swimmer.id.substring(0, 12).padEnd(12, ' ');
          const ageGroup = swimmer.ageGroup.padEnd(2, ' ').substring(0, 2);
          
          // Get club abbreviation for swimmer records
          let swimmerClubAbbrev = 'TEAM';
          try {
            const clubResponse = await fetch('/api/admin/clubs/active');
            if (clubResponse.ok) {
              const activeClub = await clubResponse.json();
              if (activeClub) {
                swimmerClubAbbrev = activeClub.abbreviation;
              }
            }
          } catch (error) {
            console.error('Error fetching club for swimmer record:', error);
          }
          
          const swimmerTeamCode = swimmerClubAbbrev.padEnd(8, ' ').substring(0, 8);
          const entryStatus = 'L'; // L=Entered, S=Scratched
          const spacerD0 = ''.padEnd(9, ' '); // Spacer for future use
          
          // D0 record: positions 1-80
          // D0 + Gender + Swimmer ID + Last Name + First Name + Age + Birth Date + Team Code + Event + Seed Time + Entry Status + Spacer for future use
          content += `D0${swimmer.gender}${swimmerId}${lastName}${firstName}${ageGroup}${birthDate}${swimmerTeamCode}${eventCode}${seedTime}${entryStatus}${spacerD0}\n`;
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
        const relayName = team.name.padEnd(20, ' ').substring(0, 20);
        const relayId = team.id.substring(0, 12).padEnd(12, ' ');
        const relayAgeGroup = team.ageGroup.padEnd(2, ' ').substring(0, 2);

        // Get club abbreviation for relay records
        let relayClubAbbrev = 'TEAM';
        try {
          const clubResponse = await fetch('/api/admin/clubs/active');
          if (clubResponse.ok) {
            const activeClub = await clubResponse.json();
            if (activeClub) {
              relayClubAbbrev = activeClub.abbreviation;
            }
          }
        } catch (error) {
          console.error('Error fetching club for relay record:', error);
        }

        const relayTeamCode = relayClubAbbrev.padEnd(8, ' ').substring(0, 8);
        const relaySeedTime = '9999999'; // NT for relays
        const relayEntryStatus = 'L'; // L=Entered, S=Scratched
        const spacerF0_1 = ''.padEnd(20, ' '); // Spacer for future use after relay name
        const spacerF0_2 = ''.padEnd(8, ' '); // Spacer for future use after age group
        const spacerF0_3 = ''.padEnd(9, ' '); // Spacer for future use at end

        // F0 record: positions 1-80
        // F0 + Gender + Relay ID + Relay Name + Spacer + Age Group + Spacer + Team Code + Event + Seed Time + Entry Status + Spacer for future use
        content += `F0${team.gender}${relayId}${relayName}${spacerF0_1}${relayAgeGroup}${spacerF0_2}${relayTeamCode}${eventCode}${relaySeedTime}${relayEntryStatus}${spacerF0_3}\n`;

        // Relay swimmers (G0 records)
        for (const swimmerId of team.swimmers) {
          const index = team.swimmers.indexOf(swimmerId);
          const swimmer = swimmers.find(s => s.id === swimmerId);
          if (swimmer) {
            const lastName = swimmer.lastName.padEnd(20, ' ').substring(0, 20);
            const firstName = swimmer.firstName.padEnd(20, ' ').substring(0, 20);
            const birthDate = swimmer.dateOfBirth.replace(/-/g, '');
            const legOrder = (index + 1).toString();
            const swimmerIdForRelay = swimmer.id.substring(0, 12).padEnd(12, ' ');
            const swimmerAgeGroup = swimmer.ageGroup.padEnd(2, ' ').substring(0, 2);

            // Get club abbreviation for relay swimmer records
            let swimmerClubAbbrev = 'TEAM';
            try {
              const clubResponse = await fetch('/api/admin/clubs/active');
              if (clubResponse.ok) {
                const activeClub = await clubResponse.json();
                if (activeClub) {
                  swimmerClubAbbrev = activeClub.abbreviation;
                }
              }
            } catch (error) {
              console.error('Error fetching club for relay swimmer record:', error);
            }

            const swimmerTeamCodeForRelay = swimmerClubAbbrev.padEnd(8, ' ').substring(0, 8);
            const legSeedTime = '9999999'; // NT for relay legs
            const spacerG0 = ''.padEnd(4, ' '); // Spacer for future use

            // G0 record: positions 1-80
            // G0 + Gender + Swimmer ID + Last Name + First Name + Age + Birth Date + Team Code + Leg Order + Seed Time + Spacer for future use
            content += `G0${swimmer.gender}${swimmerIdForRelay}${lastName}${firstName}${swimmerAgeGroup}${birthDate}${swimmerTeamCodeForRelay}${legOrder}${legSeedTime}${spacerG0}\n`;
          }
        }
      }
    }
  }

  // File trailer (Z0 record) - positions 1-80
  const totalRecords = content.split('\n').length - 1; // Don't count the final record itself
  const recordCount = totalRecords.toString().padStart(6, '0');
  const spacerZ0 = ''.padEnd(72, ' '); // Spacer for future use
  content += `Z0${recordCount}${spacerZ0}\n`;
  
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
