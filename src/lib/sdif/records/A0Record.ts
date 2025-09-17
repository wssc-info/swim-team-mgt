// A0 -- File Header Record
export class A0Record {
  static generate(): string {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    // A0 + Org + Version + File Description + Date + Spacer for future use
    const fileDesc = 'Swim Team Management'.padEnd(30, ' ');
    const spacerA0 = ''.padEnd(20, ' '); // Spacer for future use
    
    return `A01V3${fileDesc}${dateStr}${spacerA0}\n`;
  }
}
