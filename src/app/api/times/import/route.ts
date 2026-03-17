import { NextRequest, NextResponse } from 'next/server';
import AdmZip from 'adm-zip';
import { parseSdifContent, SdifIndividualResult } from '@/lib/sdif/parser';
import { SwimmerModel, SwimEventModel, initializeDatabase, TimeRecordModel } from '@/lib/models';
import { TimeRecordService } from '@/lib/services/time-record-service';
import { SwimmerService } from '@/lib/services/swimmer-service';
import { AuthService } from '@/lib/services/auth-service';

// SDIF file extensions we can parse
const SDIF_EXTENSIONS = ['.cl2', '.sd3', '.sdif', '.hy3'];

/** Minimal swimmer shape used for matching throughout the import loop. */
interface WorkingSwimmer {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
}

/** Find an SDIF file inside a ZIP buffer. Returns the text content or null. */
function extractSdifFromZip(buffer: Buffer): string | null {
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();

  const sdifEntry = entries.find(e => {
    const name = e.entryName.toLowerCase();
    return SDIF_EXTENSIONS.some(ext => name.endsWith(ext)) && !e.isDirectory;
  });

  if (!sdifEntry) return null;
  return sdifEntry.getData().toString('utf8');
}

/** Match a swimmer by name and birth date. */
function matchSwimmer(
  swimmers: WorkingSwimmer[],
  result: SdifIndividualResult
): WorkingSwimmer | null {
  const lastName = result.lastName.toLowerCase();
  const firstName = result.firstName.toLowerCase();
  const birthDate = result.birthDate;

  // 1. Exact: last + first + DOB
  const exact = swimmers.find(
    s =>
      s.lastName.toLowerCase() === lastName &&
      s.firstName.toLowerCase() === firstName &&
      s.dateOfBirth === birthDate
  );
  if (exact) return exact;

  // 2. Prefix on first name (SDIF may truncate) + DOB
  if (birthDate) {
    const prefixDob = swimmers.find(
      s =>
        s.lastName.toLowerCase() === lastName &&
        s.dateOfBirth === birthDate &&
        (s.firstName.toLowerCase().startsWith(firstName) ||
          firstName.startsWith(s.firstName.toLowerCase()))
    );
    if (prefixDob) return prefixDob;
  }

  // 3. Last + first only — only accept if exactly one candidate
  const byName = swimmers.filter(
    s =>
      s.lastName.toLowerCase() === lastName &&
      (s.firstName.toLowerCase() === firstName ||
        s.firstName.toLowerCase().startsWith(firstName.substring(0, 3)))
  );
  if (byName.length === 1) return byName[0];

  return null;
}

/** Match a swim event by distance, stroke, and course. */
function matchEvent(
  events: SwimEventModel[],
  result: SdifIndividualResult
): SwimEventModel | null {
  if (!result.course || !result.strokeName) return null;

  return (
    events.find(
      e =>
        e.distance === result.eventDistance &&
        e.stroke === result.strokeName &&
        e.course === result.course &&
        e.isRelay === result.isRelay
    ) || null
  );
}

/** Extract middle initial from a 14-char SDIF USSNUM (MMDDYY+first3+mid+last4). */
function middleInitialFromUssNum(ussNumLong: string): string {
  // Position 9 (0-indexed) is the middle initial; '*' means none
  if (ussNumLong.length >= 10) {
    const mi = ussNumLong.charAt(9);
    return mi === '*' ? '' : mi;
  }
  return '';
}

/** Check whether a time record already exists (prevents duplicates on re-import). */
async function isDuplicate(
  swimmerId: string,
  eventId: string,
  time: string,
  meetDate: string
): Promise<boolean> {
  const existing = await TimeRecordModel.findOne({
    where: { swimmerId, eventId, time, meetDate },
  });
  return existing !== null;
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();

    const user = await AuthService.getInstance().getUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = file.name.toLowerCase();

    // Extract SDIF content from ZIP or read directly
    let sdifContent: string | null = null;

    if (fileName.endsWith('.zip')) {
      sdifContent = extractSdifFromZip(buffer);
      if (!sdifContent) {
        return NextResponse.json(
          { error: 'No SDIF file (.cl2, .sd3, .sdif) found inside the ZIP' },
          { status: 400 }
        );
      }
    } else if (SDIF_EXTENSIONS.some(ext => fileName.endsWith(ext))) {
      sdifContent = buffer.toString('utf8');
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Upload a .zip, .cl2, .sd3, or .sdif file' },
        { status: 400 }
      );
    }

    // Parse the SDIF content
    const parseResult = parseSdifContent(sdifContent);

    // Load existing swimmers for this club into a lightweight working list
    const swimmerWhere: Record<string, unknown> = {};
    if (user.clubId) swimmerWhere.clubId = user.clubId;
    const swimmerModels = await SwimmerModel.findAll({ where: swimmerWhere });
    const knownSwimmers: WorkingSwimmer[] = swimmerModels.map(s => ({
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      dateOfBirth: s.dateOfBirth,
    }));

    // Load all active events
    const events = await SwimEventModel.findAll({ where: { isActive: true } });

    const meetName = parseResult.meet?.meetName || file.name.replace(/\.[^.]+$/, '');
    const timeRecordService = TimeRecordService.getInstance();
    const swimmerService = SwimmerService.getInstance();

    const summary = {
      imported: 0,
      created: 0,
      skipped: 0,
      duplicates: 0,
      errors: [] as string[],
    };

    for (const result of parseResult.results) {
      // Skip relay entries
      if (result.isRelay) {
        summary.skipped++;
        continue;
      }

      // Skip entries with no valid time
      if (!result.bestTime) {
        summary.skipped++;
        continue;
      }

      // Skip entries with no date of swim
      if (!result.dateOfSwim) {
        summary.skipped++;
        continue;
      }

      // Try to match an existing swimmer
      let swimmer = matchSwimmer(knownSwimmers, result);

      // If no match, create the swimmer (no club assignment)
      if (!swimmer) {
        try {
          const middleInitial = middleInitialFromUssNum(result.ussNumberLong);
          const externalId = result.ussNumberLong || result.ussNumber || undefined;

          const newSwimmer = await swimmerService.addSwimmer({
            firstName: result.firstName,
            middleInitial,
            lastName: result.lastName,
            dateOfBirth: result.birthDate,
            gender: result.gender,
            active: true,
            externalId,
            // clubId intentionally omitted — swimmer not assigned to any club
          });

          // Add to working list so subsequent results for this swimmer match
          const working: WorkingSwimmer = {
            id: newSwimmer.id,
            firstName: newSwimmer.firstName,
            lastName: newSwimmer.lastName,
            dateOfBirth: newSwimmer.dateOfBirth,
          };
          knownSwimmers.push(working);
          swimmer = working;
          summary.created++;
        } catch (err) {
          summary.errors.push(
            `Could not create swimmer ${result.firstName} ${result.lastName}: ` +
              (err instanceof Error ? err.message : 'unknown error')
          );
          continue;
        }
      }

      // Match event
      const event = matchEvent(events, result);
      if (!event) {
        summary.errors.push(
          `No event match: ${result.eventDistance}m ${result.strokeName} ${result.course ?? '?'} ` +
            `for ${result.firstName} ${result.lastName}`
        );
        continue;
      }

      // Duplicate check
      const duplicate = await isDuplicate(
        swimmer.id,
        event.id,
        result.bestTime,
        result.dateOfSwim
      );
      if (duplicate) {
        summary.duplicates++;
        continue;
      }

      // Create time record
      try {
        await timeRecordService.addTimeRecord({
          swimmerId: swimmer.id,
          eventId: event.id,
          time: result.bestTime,
          meetName,
          meetDate: result.dateOfSwim,
        });
        summary.imported++;
      } catch (err) {
        summary.errors.push(
          `Failed to save ${result.firstName} ${result.lastName} ${result.bestTime}: ` +
            (err instanceof Error ? err.message : 'unknown error')
        );
      }
    }

    return NextResponse.json({
      success: true,
      meetName,
      totalParsed: parseResult.results.length,
      imported: summary.imported,
      created: summary.created,
      skipped: summary.skipped,
      duplicates: summary.duplicates,
      errors: summary.errors,
      parseErrors: parseResult.parseErrors,
    });
  } catch (error) {
    console.error('SDIF import error:', error);
    return NextResponse.json({ error: 'Failed to process import file' }, { status: 500 });
  }
}
