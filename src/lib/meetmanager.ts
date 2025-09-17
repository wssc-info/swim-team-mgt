import { SwimEvent } from './types';
import {authenticatedFetch, fetchAllEvents} from './api';
import {SwimClubModel, SwimEventModel} from "@/lib/models";

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
  clubId?: string;
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

// Get SDIF stroke code
function getStrokeCode(stroke: string): string {
  const strokeCodes: Record<string, string> = {
    'freestyle': '1',
    'backstroke': '2',
    'breaststroke': '3',
    'butterfly': '4',
    'individual-medley': '5'
  };
  return strokeCodes[stroke] || '1';
}

// Get SDIF course code
function getCourseCode(course: string): string {
  const courseCodes: Record<string, string> = {
    'SCY': '1', // Short Course Yards
    'LCM': '2', // Long Course Meters
    'SCM': '3'  // Short Course Meters
  };
  return courseCodes[course] || '1';
}

// Get SDIF event code for swimming events
function getEventCode(event: SwimEventModel): string {
  const stroke = getStrokeCode(event.stroke);
  const distance = event.distance.toString().padStart(4, '0');
  const course = getCourseCode(event.course);
  
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
  
  // Meet Header (B1 record) - positions 1-161 (extended record)
  // B1 + Org + future use + meet name + address1 + address2 + city + state + postal + country + meet type + start date + end date + altitude + future use + course + future use
  const meetNameB1 = targetMeet.name.padEnd(30, ' ').substring(0, 30);
  const futureUse1 = ''.padEnd(8, ' '); // positions 4-11
  const meetAddress1 = (targetMeet.location || '').padEnd(22, ' ').substring(0, 22); // positions 42-63
  const meetAddress2 = ''.padEnd(22, ' '); // positions 64-85
  const meetCity = ''.padEnd(20, ' '); // positions 86-105, could extract from location
  const meetState = ''.padEnd(2, ' '); // positions 106-107
  const postalCode = ''.padEnd(10, ' '); // positions 108-117
  const countryCode = ''.padEnd(3, ' '); // positions 118-120
  const meetType = '1'; // position 121, 1=Invitational, 2=Regional, 3=LSC, 4=Zone, 5=National, 6=Olympic Trials, 7=Dual, 8=Time Trial
  const startDate = meetDate; // positions 122-129
  const endDate = meetDate; // positions 130-137
  const altitude = ''.padEnd(4, ' '); // positions 138-141
  const futureUse2 = ''.padEnd(8, ' '); // positions 142-149
  const courseCode = 'Y'; // position 150, Y=SCY, L=LCM, S=SCM
  const futureUse3 = ''.padEnd(10, ' '); // positions 151-160
  
  content += `B1001${futureUse1}${meetNameB1}${meetAddress1}${meetAddress2}${meetCity}${meetState}${postalCode}${countryCode}${meetType}${startDate}${endDate}${altitude}${futureUse2}${courseCode}${futureUse3}\n`;
  
  // Team record (C1 record) - positions 1-161 (extended record)
  // C1 + Org + future use + team code + full team name + abbreviated team name + address1 + address2 + city + state + postal + country + region + future use + 5th char + future use
  let clubAbbrev = 'TEAM';
  let clubName = 'Team Name';
  let clubAddress = '';
  let clubCity = '';
  let clubState = '';
  let clubZipCode = '';
  let clubPhone = '';
  let clubEmail = '';

  const club = await SwimClubModel.findByPk(targetMeet.clubId);
  if (club) {
    clubName = club.name;
    clubAbbrev = club.abbreviation;
    clubAddress = club.address || '';
    clubCity = club.city || '';
    clubState = club.state || '';
    clubZipCode = club.zipCode || '';
    clubPhone = club.phone || '';
    clubEmail = club.email || '';
  }

  const futureUseC1_1 = ''.padEnd(8, ' '); // positions 4-11
  const teamCode = clubAbbrev.padEnd(6, ' ').substring(0, 6); // positions 12-17
  const fullTeamName = clubName.padEnd(30, ' ').substring(0, 30); // positions 18-47
  const abbreviatedTeamName = clubName.padEnd(16, ' ').substring(0, 16); // positions 48-63
  const teamAddress1 = clubAddress.padEnd(22, ' ').substring(0, 22); // positions 64-85
  const teamAddress2 = ''.padEnd(22, ' '); // positions 86-107
  const teamCity = clubCity.padEnd(20, ' ').substring(0, 20); // positions 108-127
  const teamState = clubState.padEnd(2, ' ').substring(0, 2); // positions 128-129
  const postalCodeC1 = clubZipCode.padEnd(10, ' ').substring(0, 10); // positions 130-139
  const countryCodeC1 = ''.padEnd(3, ' '); // positions 140-142, default to blank
  const regionCode = ''.padEnd(1, ' '); // position 143, USS region code
  const futureUseC1_2 = ''.padEnd(6, ' '); // positions 144-149
  const fifthCharTeamCode = ''.padEnd(1, ' '); // position 150, optional 5th char of team code
  const futureUseC1_3 = ''.padEnd(10, ' '); // positions 151-160
  
  content += `C1001${futureUseC1_1}${teamCode}${fullTeamName}${abbreviatedTeamName}${teamAddress1}${teamAddress2}${teamCity}${teamState}${postalCodeC1}${countryCodeC1}${regionCode}${futureUseC1_2}${fifthCharTeamCode}${futureUseC1_3}\n`;
  
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
