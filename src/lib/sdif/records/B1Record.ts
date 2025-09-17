import { Meet } from '../types';

// B1 -- Meet Record
export class B1Record {
  static generate(meet: Meet): string {
    const meetDate = meet.date.replace(/-/g, '');
    
    // B1 + Org + future use + meet name + address1 + address2 + city + state + postal + country + meet type + start date + end date + altitude + future use + course + future use
    const meetNameB1 = meet.name.padEnd(30, ' ').substring(0, 30);
    const futureUse1 = ''.padEnd(8, ' '); // positions 4-11
    const meetAddress1 = (meet.location || '').padEnd(22, ' ').substring(0, 22); // positions 42-63
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
    
    return `B1001${futureUse1}${meetNameB1}${meetAddress1}${meetAddress2}${meetCity}${meetState}${postalCode}${countryCode}${meetType}${startDate}${endDate}${altitude}${futureUse2}${courseCode}${futureUse3}\n`;
  }
}
