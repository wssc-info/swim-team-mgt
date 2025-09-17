import { Swimmer } from '../types';
import { timeToSdifFormat, getStrokeCode, getCourseCode } from '../utils';

// D0 -- Individual Event Record
export class D0Record {
  static generate(swimmer: Swimmer, event: any, meetDate: string, seedTime: string): string {
    const birthDate = swimmer.dateOfBirth.replace(/-/g, '');
    const lastName = swimmer.lastName.padEnd(20, ' ').substring(0, 20);
    const firstName = swimmer.firstName.padEnd(20, ' ').substring(0, 20);
    
    const futureUseD0_1 = ''.padEnd(8, ' '); // positions 4-11
    const swimmerName = `${lastName}${firstName}`.padEnd(28, ' ').substring(0, 28); // positions 12-39
    const ussNumber = swimmer.id.substring(0, 12).padEnd(12, ' '); // positions 40-51
    const attachCode = ''.padEnd(1, ' '); // position 52
    const citizenCode = ''.padEnd(3, ' '); // positions 53-55
    const swimmerBirthDate = birthDate; // positions 56-63
    const swimmerAgeClass = ''.padEnd(2, ' '); // positions 64-65
    const sexCode = swimmer.gender; // position 66
    const eventSexCode = swimmer.gender; // position 67
    const eventDistance = event.distance.toString().padStart(4, '0'); // positions 68-71
    const strokeCode = getStrokeCode(event.stroke); // position 72
    const futureUseD0_2 = ''.padEnd(4, ' '); // positions 73-76
    const eventAgeCode = swimmer.ageGroup.padEnd(4, ' ').substring(0, 4); // positions 77-80
    const dateOfSwim = meetDate; // positions 81-88
    const seedTimeD0 = timeToSdifFormat(seedTime || 'NT'); // positions 89-96
    const courseCodeD0_1 = getCourseCode(event.course); // position 97
    const prelimTime = ''.padEnd(8, ' '); // positions 98-105
    const courseCodeD0_2 = ''.padEnd(1, ' '); // position 106
    const swimOffTime = ''.padEnd(8, ' '); // positions 107-114
    const courseCodeD0_3 = ''.padEnd(1, ' '); // position 115
    const finalsTime = ''.padEnd(8, ' '); // positions 116-123
    const courseCodeD0_4 = ''.padEnd(1, ' '); // position 124
    const prelimHeat = ''.padEnd(2, ' '); // positions 125-126
    const prelimLane = ''.padEnd(2, ' '); // positions 127-128
    const finalsHeat = ''.padEnd(2, ' '); // positions 129-130
    const finalsLane = ''.padEnd(2, ' '); // positions 131-132
    const prelimPlace = ''.padEnd(3, ' '); // positions 133-135
    const finalsPlace = ''.padEnd(3, ' '); // positions 136-138
    const pointsScored = ''.padEnd(4, ' '); // positions 139-142
    const eventTimeClass = ''.padEnd(2, ' '); // positions 143-144
    const flightStatus = ''.padEnd(1, ' '); // position 145
    const futureUseD0_3 = ''.padEnd(15, ' '); // positions 146-160
    
    return `D0001${futureUseD0_1}${swimmerName}${ussNumber}${attachCode}${citizenCode}${swimmerBirthDate}${swimmerAgeClass}${sexCode}${eventSexCode}${eventDistance}${strokeCode}${futureUseD0_2}${eventAgeCode}${dateOfSwim}${seedTimeD0}${courseCodeD0_1}${prelimTime}${courseCodeD0_2}${swimOffTime}${courseCodeD0_3}${finalsTime}${courseCodeD0_4}${prelimHeat}${prelimLane}${finalsHeat}${finalsLane}${prelimPlace}${finalsPlace}${pointsScored}${eventTimeClass}${flightStatus}${futureUseD0_3}\n`;
  }
}
