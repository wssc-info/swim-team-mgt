// Z0 -- File Terminator Record
export class Z0Record {
  static generate(recordCounts: {
    bRecords: number;
    meets: number;
    cRecords: number;
    teams: number;
    dRecords: number;
    swimmers: number;
    eRecords: number;
    fRecords: number;
    gRecords: number;
  }): string {
    // Z0 + Org + future use + file code + notes + B records + meets + C records + teams + D records + swimmers + E records + F records + G records + batch + new members + renew members + member changes + member deletes + future use
    
    const orgCode = '001'; // position 3
    const futureUse1 = ''.padEnd(8, ' '); // positions 4-11, future use
    const fileCode = '01'; // positions 12-13, FILE Code 003 (01 = meet results)
    const notes = ''.padEnd(30, ' '); // positions 14-43, notes
    const bRecordsCount = recordCounts.bRecords.toString().padStart(3, '0'); // positions 44-46
    const meetsCount = recordCounts.meets.toString().padStart(3, '0'); // positions 47-49
    const cRecordsCount = recordCounts.cRecords.toString().padStart(4, '0'); // positions 50-53
    const teamsCount = recordCounts.teams.toString().padStart(4, '0'); // positions 54-57
    const dRecordsCount = recordCounts.dRecords.toString().padStart(6, '0'); // positions 58-63
    const swimmersCount = recordCounts.swimmers.toString().padStart(6, '0'); // positions 64-69
    const eRecordsCount = recordCounts.eRecords.toString().padStart(5, '0'); // positions 70-74
    const fRecordsCount = recordCounts.fRecords.toString().padStart(6, '0'); // positions 75-80
    const gRecordsCount = recordCounts.gRecords.toString().padStart(6, '0'); // positions 81-86
    const batchNumber = ''.padEnd(5, ' '); // positions 87-91, batch number
    const newMembers = ''.padEnd(3, ' '); // positions 92-94, number of new members
    const renewMembers = ''.padEnd(3, ' '); // positions 95-97, number of renew members
    const memberChanges = ''.padEnd(3, ' '); // positions 98-100, number of member changes
    const memberDeletes = ''.padEnd(3, ' '); // positions 101-103, number of member deletes
    const futureUse2 = ''.padEnd(57, ' '); // positions 104-160, future use
    
    return `Z0${orgCode}${futureUse1}${fileCode}${notes}${bRecordsCount}${meetsCount}${cRecordsCount}${teamsCount}${dRecordsCount}${swimmersCount}${eRecordsCount}${fRecordsCount}${gRecordsCount}${batchNumber}${newMembers}${renewMembers}${memberChanges}${memberDeletes}${futureUse2}\n`;
  }
}
