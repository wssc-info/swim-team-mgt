// A0 -- File Description Record
export class A0Record {
  static generate(): string {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    // A0 + Org + SDIF Version + File Code + future use + software name + software version + contact name + contact phone + file creation date + future use + LSC + future use
    const orgCode = '001'; // position 3, ORG Code 001
    const sdifVersion = 'V3      '; // positions 4-11, SDIF version number (8 chars)
    const fileCode = '01'; // positions 12-13, FILE Code 003 (01 = meet results)
    const futureUse1 = ''.padEnd(30, ' '); // positions 14-43, future use
    const softwareName = 'Swim Team Management'.padEnd(20, ' ').substring(0, 20); // positions 44-63
    const softwareVersion = '1.0'.padEnd(10, ' ').substring(0, 10); // positions 64-73
    const contactName = 'Team Manager'.padEnd(20, ' ').substring(0, 20); // positions 74-93
    const contactPhone = '000-000-0000'.padEnd(12, ' ').substring(0, 12); // positions 94-105
    const fileCreationDate = dateStr; // positions 106-113
    const futureUse2 = ''.padEnd(42, ' '); // positions 114-155, future use
    const lscCode = ''.padEnd(2, ' '); // positions 156-157, submitted by LSC
    const futureUse3 = ''.padEnd(3, ' '); // positions 158-160, future use
    
    return `A0${orgCode}${sdifVersion}${fileCode}${futureUse1}${softwareName}${softwareVersion}${contactName}${contactPhone}${fileCreationDate}${futureUse2}${lscCode}${futureUse3}\n`;
  }
}
