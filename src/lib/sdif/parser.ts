/**
 * SDIF v3 file parser for importing meet results.
 * Spec reference: https://www.usms.org/admin/sdifv3f.txt
 *
 * Field positions in this file are 1-indexed (as per the SDIF spec).
 */

export interface SdifMeetInfo {
  meetName: string;
  startDate: string | null; // YYYY-MM-DD
  course: 'SCY' | 'SCM' | 'LCM' | null;
}

export interface SdifIndividualResult {
  lastName: string;
  firstName: string;
  ussNumber: string;       // 12-char from D0 pos 40-51
  ussNumberLong: string;   // 14-char from D3 pos 3-16 (if available)
  birthDate: string;       // YYYY-MM-DD
  gender: 'M' | 'F';
  eventDistance: number;
  strokeCode: string;
  strokeName: string;      // application stroke name
  course: 'SCY' | 'SCM' | 'LCM' | null;
  isRelay: boolean;
  dateOfSwim: string;      // YYYY-MM-DD
  bestTime: string | null; // best available time in app format "M:SS.ss"
  teamCode: string;        // 2-char team code from positions 4-5
}

export interface SdifParseResult {
  meet: SdifMeetInfo | null;
  results: SdifIndividualResult[];
  parseErrors: string[];
}

// --- Field extraction ---

/** Extract a field from an SDIF line. startPos is 1-indexed. */
function field(line: string, startPos: number, length: number): string {
  const start = startPos - 1;
  const raw = line.substring(start, start + length);
  return raw.padEnd(length, ' '); // pad to expected length if line is short
}

// --- Code mappings ---

const STROKE_NAMES: Record<string, string> = {
  '1': 'freestyle',
  '2': 'backstroke',
  '3': 'breaststroke',
  '4': 'butterfly',
  '5': 'medley',
  '6': 'freestyle',  // relay freestyle
  '7': 'medley',     // relay medley
};

const COURSE_CODES: Record<string, 'SCY' | 'SCM' | 'LCM'> = {
  'Y': 'SCY',
  'S': 'SCM',
  'L': 'LCM',
};

// Time codes that indicate no valid time was recorded
const INVALID_TIME_CODES = new Set(['NT', 'NTY', 'NS', 'NSS', 'DQ', 'DQS', 'SCR', 'DNF', '']);

// --- Conversion helpers ---

/**
 * Convert a raw 8-char SDIF time field to app format "M:SS.ss".
 * Returns null if the field contains a special code (DQ, NS, NT, etc.) or is blank.
 */
export function parseSdifTime(raw: string): string | null {
  const trimmed = raw.trim().replace(/[SYLM]$/i, '').trim(); // strip trailing course code if any

  if (!trimmed || INVALID_TIME_CODES.has(trimmed.toUpperCase())) {
    return null;
  }

  // Format with colon: "M:SS.ss" or "MM:SS.ss" — already close to app format
  if (trimmed.includes(':')) {
    const [minsStr, secsStr] = trimmed.split(':');
    const mins = parseInt(minsStr, 10) || 0;
    const [secWhole, secFrac = '00'] = secsStr.split('.');
    const secWholeFormatted = secWhole.padStart(2, '0');
    const secFracFormatted = secFrac.padEnd(2, '0').substring(0, 2);
    return `${mins}:${secWholeFormatted}.${secFracFormatted}`;
  }

  // Format without colon: "SS.ss" (sub-minute)
  if (trimmed.includes('.')) {
    const [secWhole, secFrac = '00'] = trimmed.split('.');
    const secs = parseInt(secWhole, 10) || 0;
    const secWholeFormatted = secs.toString().padStart(2, '0');
    const secFracFormatted = secFrac.padEnd(2, '0').substring(0, 2);
    return `0:${secWholeFormatted}.${secFracFormatted}`;
  }

  return null;
}

/**
 * Convert an SDIF date (MMDDYYYY) to ISO format (YYYY-MM-DD).
 * Returns null if the input is invalid.
 */
function parseSdifDate(raw: string): string | null {
  const s = raw.trim();
  if (s.length < 8 || !/^\d{8}$/.test(s)) return null;
  const mm = s.substring(0, 2);
  const dd = s.substring(2, 4);
  const yyyy = s.substring(4, 8);
  // Basic validity check
  const month = parseInt(mm, 10);
  const day = parseInt(dd, 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Parse the swimmer name from SDIF NAME format: "LastName, FirstName MI"
 */
function parseName(raw: string): { lastName: string; firstName: string } {
  const trimmed = raw.trim();
  const commaIdx = trimmed.indexOf(',');
  if (commaIdx === -1) {
    return { lastName: trimmed, firstName: '' };
  }
  const lastName = trimmed.substring(0, commaIdx).trim();
  const rest = trimmed.substring(commaIdx + 1).trim();
  // rest is "FirstName MI" — take just the first word as firstName
  const firstName = rest.split(/\s+/)[0] || '';
  return { lastName, firstName };
}

// --- Record parsers ---

/**
 * Parse a B1 (Meet) record.
 * Position layout (1-indexed):
 *   12-41  : Meet name (30 chars)
 *   86-105 : City (20 chars)
 *   106-107: State (2 chars)
 *   122-129: Meet start date (MMDDYYYY)
 *   150    : Course code (1 char)
 */
function parseB1Record(line: string): SdifMeetInfo {
  const meetName = field(line, 12, 30).trim();
  const startDateRaw = field(line, 122, 8);
  const courseCode = field(line, 150, 1).trim();

  return {
    meetName,
    startDate: parseSdifDate(startDateRaw),
    course: COURSE_CODES[courseCode] || null,
  };
}

/**
 * Parse a D0 (Individual Event) record.
 * Position layout (1-indexed):
 *   4-5    : Team code (2 chars, Hy-Tek extension in "future use" field)
 *   12-39  : Swimmer name (28 chars, "LastName, FirstName MI")
 *   40-51  : USS# (12 chars)
 *   56-63  : Birth date (MMDDYYYY)
 *   66     : Sex code (M/F)
 *   68-71  : Event distance (4 chars, right-justified integer)
 *   72     : Stroke code (1 char)
 *   81-88  : Date of swim (MMDDYYYY)
 *   89-96  : Seed time (8 chars)
 *   97     : Course code for seed time
 *   98-105 : Prelim time (8 chars)
 *   106    : Course code for prelim time
 *   116-123: Finals time (8 chars)
 *   124    : Course code for finals time
 */
function parseD0Record(line: string): SdifIndividualResult | null {
  const teamCode = field(line, 4, 2).trim();
  const nameRaw = field(line, 12, 28);
  const ussNumber = field(line, 40, 12).trim();
  const birthDateRaw = field(line, 56, 8);
  const sexCode = field(line, 66, 1).trim().toUpperCase();
  const distanceRaw = field(line, 68, 4);
  const strokeCode = field(line, 72, 1).trim();
  const dateOfSwimRaw = field(line, 81, 8);

  // Times and their course codes
  const seedTimeRaw = field(line, 89, 8);
  const seedCourse = field(line, 97, 1).trim();
  const prelimTimeRaw = field(line, 98, 8);
  const prelimCourse = field(line, 106, 1).trim();
  const finalsTimeRaw = field(line, 116, 8);
  const finalsCourse = field(line, 124, 1).trim();

  const { lastName, firstName } = parseName(nameRaw);
  const birthDate = parseSdifDate(birthDateRaw);
  const dateOfSwim = parseSdifDate(dateOfSwimRaw);
  const distance = parseInt(distanceRaw.trim(), 10);
  const gender = (sexCode === 'F' ? 'F' : 'M') as 'M' | 'F';

  if (!lastName || isNaN(distance) || !strokeCode) return null;

  const strokeName = STROKE_NAMES[strokeCode] || null;
  if (!strokeName) return null;

  const isRelay = strokeCode === '6' || strokeCode === '7';

  // Pick the best available time: prefer finals → prelim → seed
  let bestTime: string | null = null;
  let bestCourse: string | null = null;

  const finalsTime = parseSdifTime(finalsTimeRaw);
  if (finalsTime) {
    bestTime = finalsTime;
    bestCourse = finalsCourse;
  } else {
    const prelimTime = parseSdifTime(prelimTimeRaw);
    if (prelimTime) {
      bestTime = prelimTime;
      bestCourse = prelimCourse;
    } else {
      const seedTime = parseSdifTime(seedTimeRaw);
      if (seedTime) {
        bestTime = seedTime;
        bestCourse = seedCourse;
      }
    }
  }

  const course = bestCourse ? (COURSE_CODES[bestCourse] || null) : null;

  return {
    lastName,
    firstName,
    ussNumber,
    ussNumberLong: '', // filled in from subsequent D3 record
    birthDate: birthDate || '',
    gender,
    eventDistance: distance,
    strokeCode,
    strokeName,
    course,
    isRelay,
    dateOfSwim: dateOfSwim || '',
    bestTime,
    teamCode,
  };
}

/**
 * Parse a D3 (Individual Information) record.
 * Position layout (1-indexed):
 *   3-16   : New USS# / USSNUM (14 chars)
 *   17-31  : Preferred first name (15 chars)
 */
function parseD3UssNumber(line: string): string {
  return field(line, 3, 14).trim();
}

// --- Main parser ---

/**
 * Parse the full content of an SDIF file.
 * Returns meet info and all individual event results.
 */
export function parseSdifContent(content: string): SdifParseResult {
  // Normalize line endings (handle CRLF and CR)
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  let meet: SdifMeetInfo | null = null;
  const results: SdifIndividualResult[] = [];
  const parseErrors: string[] = [];
  let lastD0: SdifIndividualResult | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.length < 2) continue;

    const recordType = line.substring(0, 2);

    try {
      switch (recordType) {
        case 'B1': {
          meet = parseB1Record(line);
          break;
        }

        case 'D0': {
          lastD0 = parseD0Record(line);
          if (lastD0) {
            results.push(lastD0);
          }
          break;
        }

        case 'D3': {
          // D3 immediately follows the first D0 for a swimmer — enrich with USSNUM
          if (lastD0) {
            lastD0.ussNumberLong = parseD3UssNumber(line);
          }
          break;
        }

        // Ignore other record types (A0, C1, E0, F0, G0, Z0, etc.)
        default:
          break;
      }
    } catch (err) {
      parseErrors.push(`Line ${i + 1} (${recordType}): ${err instanceof Error ? err.message : 'parse error'}`);
    }
  }

  return { meet, results, parseErrors };
}
