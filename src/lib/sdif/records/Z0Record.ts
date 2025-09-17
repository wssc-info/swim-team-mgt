// Z0 -- File Trailer Record
export class Z0Record {
  static generate(totalRecords: number): string {
    const recordCount = totalRecords.toString().padStart(6, '0');
    const spacerZ0 = ''.padEnd(72, ' '); // Spacer for future use
    
    return `Z0${recordCount}${spacerZ0}\n`;
  }
}
