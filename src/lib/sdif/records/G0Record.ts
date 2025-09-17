import { Swimmer } from '../types';

// G0 -- Splits Record
export class G0Record {
  static generate(
    swimmer: Swimmer, 
    sequenceNumber: number = 1, 
    totalSplits: number = 0, 
    splitDistance: number = 0, 
    splitTimes: string[] = []
  ): string {
    // G0 + Org + future use + swimmer name + USS# + sequence + total splits + split distance + split code + split times (10) + prelims/finals + future use
    
    const orgCode = '001'; // position 3
    const futureUse1 = ''.padEnd(12, ' '); // positions 4-15, future use
    const swimmerName = `${swimmer.lastName.padEnd(20, ' ').substring(0, 20)}${swimmer.firstName.padEnd(8, ' ').substring(0, 8)}`.padEnd(28, ' ').substring(0, 28); // positions 16-43
    const ussNumber = swimmer.id.substring(0, 12).padEnd(12, ' '); // positions 44-55
    const sequenceNum = sequenceNumber.toString().padStart(1, '0'); // position 56
    const totalSplitsNum = totalSplits.toString().padStart(2, '0'); // positions 57-58
    const splitDist = splitDistance.toString().padStart(4, '0'); // positions 59-62
    const splitCode = '1'; // position 63, 1=interval, 2=cumulative
    
    // Split times (positions 64-143, 10 fields of 8 characters each)
    const splitTimeFields: string[] = [];
    for (let i = 0; i < 10; i++) {
      if (i < splitTimes.length && splitTimes[i]) {
        splitTimeFields.push(splitTimes[i].padStart(8, ' ').substring(0, 8));
      } else {
        splitTimeFields.push(''.padEnd(8, ' '));
      }
    }
    
    const prelimsFinalsCode = ''.padEnd(1, ' '); // position 144
    const futureUse2 = ''.padEnd(16, ' '); // positions 145-160, future use
    
    return `G0${orgCode}${futureUse1}${swimmerName}${ussNumber}${sequenceNum}${totalSplitsNum}${splitDist}${splitCode}${splitTimeFields.join('')}${prelimsFinalsCode}${futureUse2}\n`;
  }
}
