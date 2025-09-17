// Convert time string (MM:SS.ss) to centiseconds for SDIF format
export function timeToSdifFormat(timeString: string): string {
  if (!timeString || timeString === 'NT') return '9999999';
  
  const parts = timeString.split(':');
  if (parts.length !== 2) return '9999999';
  
  const minutes = parseInt(parts[0]) || 0;
  const secondsParts = parts[1].split('.');
  const seconds = parseInt(secondsParts[0]) || 0;
  const centiseconds = parseInt((secondsParts[1] || '00').padEnd(2, '0').substring(0, 2)) || 0;
  
  const totalCentiseconds = (minutes * 60 * 100) + (seconds * 100) + centiseconds;
  return totalCentiseconds.toString().padStart(7, '0');
}

// Get SDIF stroke code
export function getStrokeCode(stroke: string, isRelay: boolean): string {
  const strokeCodes: Record<string, string> = {
    'freestyle': '1',
    'backstroke': '2',
    'breaststroke': '3',
    'butterfly': '4',
    'medley': '5'
  };
  const relayStrokeCodes: Record<string, string> = {
    'freestyle': '6',
    'medley': '7'
  };
  return (isRelay? relayStrokeCodes[stroke]: strokeCodes[stroke]) || '1';
}

// Get SDIF course code   COURSE Code 013   Course/Status code
export function getCourseCode(course: string): string {
  const courseCodes: Record<string, string> = {
    'SCY': 'Y', // Short Course Yards
    'LCM': 'L', // Long Course Meters
    'SCM': 'S'  // Short Course Meters
  };
  return courseCodes[course] || '1';
}

// Get SDIF age code
export function getAgeCode(age: string): string {
  const agesCodes: Record<string, string> = {
    '8&U': 'UN08',
    '9-10': '0910',
    '11-12': '1112',
    '13-14': '1314',
    '15-18': '1518',
  };
  return agesCodes[age] || '1';
}

// Get SDIF event code for swimming events
export function getEventCode(event: any): string {
  const stroke = getStrokeCode(event.stroke, event.isRelay);
  const distance = event.distance.toString().padStart(4, '0');
  const course = getCourseCode(event.course);
  
  return `${stroke}${distance}${course}${event.isRelay ? '1' : '0'}`;
}
