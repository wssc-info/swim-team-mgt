import { RelayTeam } from '../types';
import { getStrokeCode, getCourseCode } from '../utils';

// E0 -- Relay Event Record
export class E0Record {
  static generate(team: RelayTeam, event: any, clubAbbrev: string, meetDate: string, numF0Records: number): string {
    // E0 + Org + future use + relay team name + team code + num F0 records + event sex + distance + stroke + event number + event age + total age + date of swim + seed time + course + prelim time + course + swim-off time + course + finals time + course + prelim heat + prelim lane + finals heat + finals lane + prelim place + finals place + points + time class + future use
    
    const orgCode = '001'; // position 3
    const futureUse1 = ''.padEnd(8, ' '); // positions 4-11, future use
    const relayTeamName = team.name.substring(0, 1).padEnd(1, ' '); // position 12, one alpha char
    const teamCode = clubAbbrev.padEnd(6, ' ').substring(0, 6); // positions 13-18
    const numF0RecordsCount = numF0Records.toString().padStart(2, '0'); // positions 19-20
    const eventSexCode = team.gender === 'Mixed' ? 'X' : team.gender; // position 21
    const relayDistance = event.distance.toString().padStart(4, '0'); // positions 22-25
    const strokeCode = getStrokeCode(event.stroke); // position 26
    const eventNumber = ''.padEnd(4, ' '); // positions 27-30, event number
    const eventAgeCode = team.ageGroup.padEnd(4, ' ').substring(0, 4); // positions 31-34
    const totalAge = ''.padEnd(3, ' '); // positions 35-37, total age of all athletes
    const dateOfSwim = meetDate; // positions 38-45
    const seedTime = ''.padEnd(8, ' '); // positions 46-53, seed time
    const courseCode1 = ''.padEnd(1, ' '); // position 54
    const prelimTime = ''.padEnd(8, ' '); // positions 55-62
    const courseCode2 = ''.padEnd(1, ' '); // position 63
    const swimOffTime = ''.padEnd(8, ' '); // positions 64-71
    const courseCode3 = ''.padEnd(1, ' '); // position 72
    const finalsTime = ''.padEnd(8, ' '); // positions 73-80
    const courseCode4 = ''.padEnd(1, ' '); // position 81
    const prelimHeat = ''.padEnd(2, ' '); // positions 82-83
    const prelimLane = ''.padEnd(2, ' '); // positions 84-85
    const finalsHeat = ''.padEnd(2, ' '); // positions 86-87
    const finalsLane = ''.padEnd(2, ' '); // positions 88-89
    const prelimPlace = ''.padEnd(3, ' '); // positions 90-92
    const finalsPlace = ''.padEnd(3, ' '); // positions 93-95
    const pointsScored = ''.padEnd(4, ' '); // positions 96-99
    const eventTimeClass = ''.padEnd(2, ' '); // positions 100-101
    const futureUse2 = ''.padEnd(59, ' '); // positions 102-160, future use
    
    return `E0${orgCode}${futureUse1}${relayTeamName}${teamCode}${numF0RecordsCount}${eventSexCode}${relayDistance}${strokeCode}${eventNumber}${eventAgeCode}${totalAge}${dateOfSwim}${seedTime}${courseCode1}${prelimTime}${courseCode2}${swimOffTime}${courseCode3}${finalsTime}${courseCode4}${prelimHeat}${prelimLane}${finalsHeat}${finalsLane}${prelimPlace}${finalsPlace}${pointsScored}${eventTimeClass}${futureUse2}\n`;
  }
}
