import { Swimmer } from '../types';

// G0 -- Relay Swimmer Record
export class G0Record {
  static generate(swimmer: Swimmer, legOrder: number, clubAbbrev: string): string {
    const lastName = swimmer.lastName.padEnd(20, ' ').substring(0, 20);
    const firstName = swimmer.firstName.padEnd(20, ' ').substring(0, 20);
    const birthDate = swimmer.dateOfBirth.replace(/-/g, '');
    const swimmerIdForRelay = swimmer.id.substring(0, 12).padEnd(12, ' ');
    const swimmerAgeGroup = swimmer.ageGroup.padEnd(2, ' ').substring(0, 2);

    const swimmerTeamCodeForRelay = clubAbbrev.padEnd(8, ' ').substring(0, 8);
    const legSeedTime = '9999999'; // NT for relay legs
    const spacerG0 = ''.padEnd(4, ' '); // Spacer for future use

    return `G0${swimmer.gender}${swimmerIdForRelay}${lastName}${firstName}${swimmerAgeGroup}${birthDate}${swimmerTeamCodeForRelay}${legOrder}${legSeedTime}${spacerG0}\n`;
  }
}
