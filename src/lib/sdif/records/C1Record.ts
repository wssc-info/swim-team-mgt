import { SwimClubModel } from '@/lib/models';
import { Meet } from '../types';

// C1 -- Team Id Record
export class C1Record {
  static async generate(meet: Meet): Promise<string> {
    let clubAbbrev = 'TEAM';
    let clubName = 'Team Name';
    let clubAddress = '';
    let clubCity = '';
    let clubState = '';
    let clubZipCode = '';

    const club = await SwimClubModel.findByPk(meet.clubId);
    if (club) {
      clubName = club.name;
      clubAbbrev = club.abbreviation;
      clubAddress = club.address || '';
      clubCity = club.city || '';
      clubState = club.state || '';
      clubZipCode = club.zipCode || '';
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
    
    return `C1001${futureUseC1_1}${teamCode}${fullTeamName}${abbreviatedTeamName}${teamAddress1}${teamAddress2}${teamCity}${teamState}${postalCodeC1}${countryCodeC1}${regionCode}${futureUseC1_2}${fifthCharTeamCode}${futureUseC1_3}\n`;
  }
}
