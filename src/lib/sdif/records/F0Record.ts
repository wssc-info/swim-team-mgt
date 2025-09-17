import { RelayTeam, Swimmer } from '../types';

// F0 -- Relay Name Record
export class F0Record {
  static generate(swimmer: Swimmer, team: RelayTeam, clubAbbrev: string, legOrder: number): string {
    // F0 + Org + future use + team code + relay team name + swimmer name + USS# + citizen + birth date + age/class + sex + prelim order + swim-off order + finals order + leg time + course + take-off time + USS# (new) + preferred first name + future use
    
    const orgCode = '001'; // position 3
    const futureUse1 = ''.padEnd(12, ' '); // positions 4-15, future use
    const teamCode = clubAbbrev.padEnd(6, ' ').substring(0, 6); // positions 16-21
    const relayTeamName = team.name.substring(0, 1).padEnd(1, ' '); // position 22, one alpha char
    const swimmerName = `${swimmer.lastName.padEnd(20, ' ').substring(0, 20)}${swimmer.firstName.padEnd(8, ' ').substring(0, 8)}`.padEnd(28, ' ').substring(0, 28); // positions 23-50
    const ussNumber = swimmer.id.substring(0, 12).padEnd(12, ' '); // positions 51-62
    const citizenCode = ''.padEnd(3, ' '); // positions 63-65
    const birthDate = swimmer.dateOfBirth.replace(/-/g, ''); // positions 66-73
    const ageClass = ''.padEnd(2, ' '); // positions 74-75
    const sexCode = swimmer.gender; // position 76
    const prelimOrder = legOrder.toString(); // position 77
    const swimOffOrder = legOrder.toString(); // position 78
    const finalsOrder = legOrder.toString(); // position 79
    const legTime = ''.padEnd(8, ' '); // positions 80-87
    const courseCode = ''.padEnd(1, ' '); // position 88
    const takeOffTime = ''.padEnd(4, ' '); // positions 89-92
    const ussNumberNew = swimmer.id.substring(0, 14).padEnd(14, ' '); // positions 93-106
    const preferredFirstName = swimmer.firstName.padEnd(15, ' ').substring(0, 15); // positions 107-121
    const futureUse2 = ''.padEnd(39, ' '); // positions 122-160, future use
    
    return `F0${orgCode}${futureUse1}${teamCode}${relayTeamName}${swimmerName}${ussNumber}${citizenCode}${birthDate}${ageClass}${sexCode}${prelimOrder}${swimOffOrder}${finalsOrder}${legTime}${courseCode}${takeOffTime}${ussNumberNew}${preferredFirstName}${futureUse2}\n`;
  }
}
