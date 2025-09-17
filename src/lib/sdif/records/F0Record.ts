import { RelayTeam } from '../types';
import { getEventCode } from '../utils';

// F0 -- Relay Event Record
export class F0Record {
  static generate(team: RelayTeam, event: any, clubAbbrev: string): string {
    const relayName = team.name.padEnd(20, ' ').substring(0, 20);
    const relayId = team.id.substring(0, 12).padEnd(12, ' ');
    const relayAgeGroup = team.ageGroup.padEnd(2, ' ').substring(0, 2);

    const relayTeamCode = clubAbbrev.padEnd(8, ' ').substring(0, 8);
    const relaySeedTime = '9999999'; // NT for relays
    const relayEntryStatus = 'L'; // L=Entered, S=Scratched
    const spacerF0_1 = ''.padEnd(20, ' '); // Spacer for future use after relay name
    const spacerF0_2 = ''.padEnd(8, ' '); // Spacer for future use after age group
    const spacerF0_3 = ''.padEnd(9, ' '); // Spacer for future use at end
    const eventCode = getEventCode(event);

    return `F0${team.gender}${relayId}${relayName}${spacerF0_1}${relayAgeGroup}${spacerF0_2}${relayTeamCode}${eventCode}${relaySeedTime}${relayEntryStatus}${spacerF0_3}\n`;
  }
}
