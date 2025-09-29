import { useAuth } from '@/lib/auth-context';

// Helper function to properly parse CSV lines with quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Handle escaped quotes ("")
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  // Add the last field
  result.push(current.trim());
  
  return result;
}

// Helper function to map Team Unify event names to database event IDs
function mapTeamUnifyEventToId(eventName: string, course: string, allEvents: any[]): string | null {
  // Parse event name: "25 Free" -> distance: 25, stroke: "Free"
  const match = eventName.match(/^(\d+)\s+(.+)$/);
  if (!match) return null;
  
  const [, distanceStr, strokeShort] = match;
  const distance = parseInt(distanceStr);
  
  // Map short stroke names to full names
  const strokeMap: Record<string, string> = {
    'Free': 'freestyle',
    'Back': 'backstroke',
    'Breast': 'breaststroke',
    'Fly': 'butterfly',
    'IM': 'medley'
  };
  
  const stroke = strokeMap[strokeShort];
  if (!stroke) return null;
  
  // Find matching event in database
  const matchingEvent = allEvents.find(event => 
    event.distance === distance && 
    event.stroke === stroke && 
    event.course === course &&
    !event.isRelay
  );
  
  return matchingEvent ? matchingEvent.id : null;
}

interface SwimmerInfo {
  firstName: string;
  middleInitial: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'M' | 'F';
  externalId: string;
}

// Parse swimmer info from Team Unify format
function parseSwimmerInfo(swimmerInfoStr: string): SwimmerInfo | null {
  // Parse swimmer info: "LastName, FirstName: MM/DD/YYYY (Gender Age) ExternalId"
  const match = swimmerInfoStr.match(/^(.+?),\s*(.+?):\s*(\d{2}\/\d{2}\/\d{4})\s*\((\w+)\s+\d+\)\s*(.+)$/);
  
  if (!match) {
    return null;
  }

  const [, lastName, firstName, dateStr, gender, externalId] = match;
  
  // Convert date from MM/DD/YYYY to YYYY-MM-DD
  const [month, day, year] = dateStr.split('/');
  const dateOfBirth = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  
  // Normalize gender
  const normalizedGender = gender.toLowerCase().startsWith('boy') || gender.toLowerCase() === 'm' ? 'M' : 'F';

  const middleInitial = (externalId || '').length > 9 ? externalId.charAt(9) : '';

  return {
    firstName: firstName.trim(),
    middleInitial,
    lastName: lastName.trim(),
    dateOfBirth,
    gender: normalizedGender,
    externalId: externalId.trim()
  };
}

// Create a new swimmer
async function createSwimmer(swimmerData: SwimmerInfo & { clubId?: string }, results: { success: number, errors: string[] }, rowIndex: number) {
  try {
    const response = await fetch('/api/swimmers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(swimmerData),
    });

    if (!response.ok) {
      const error = await response.text();
      results.errors.push(`Row ${rowIndex + 1}: Failed to create swimmer - ${error}`);
      return null;
    }

    const newSwimmer = await response.json();
    results.success++;
    return newSwimmer;
  } catch (error) {
    results.errors.push(`Row ${rowIndex + 1}: ${error instanceof Error ? error.message : 'Unknown error creating swimmer'}`);
    return null;
  }
}

// Check if a time record already exists
async function checkTimeRecordExists(swimmerId: string, eventId: string, meetDate: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/times?swimmerId=${swimmerId}&eventId=${eventId}&meetDate=${meetDate}`);
    if (!response.ok) {
      return false; // If we can't check, assume it doesn't exist and try to create
    }
    const timeRecords = await response.json();
    console.log(timeRecords);
    return timeRecords.length > 0;
  } catch (error) {
    return false; // If we can't check, assume it doesn't exist and try to create
  }
}

// Create a time record
async function createTimeRecord(timeRecordData: any,
                                results: { success: number,
                                   successTimeRecords: number,
                                  info: string[],
                                  errors: string[] }, rowIndex: number, eventName: string) {
  try {
    // Check if this time record already exists
    const exists = await checkTimeRecordExists(
      timeRecordData.swimmerId,
      timeRecordData.eventId,
      timeRecordData.meetDate
    );

    if (exists) {
      results.info.push(`Row ${rowIndex + 1}: Time record for ${eventName} already exists - skipped`);
      return;
    }

    const response = await fetch('/api/times', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(timeRecordData),
    });
    results.successTimeRecords++;
    if (!response.ok) {
      const error = await response.text();
      results.errors.push(`Row ${rowIndex + 1}: Failed to create time record for ${eventName} - ${error}`);
    }
  } catch (error) {
    results.errors.push(`Row ${rowIndex + 1}: Error processing time record - ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Process a time record row
async function processTimeRecord(
  values: string[], 
  currentSwimmerId: string | null, 
  allEvents: any[], 
  results: { success: number, successTimeRecords: number, info: string[], errors: string[] },
  rowIndex: number
) {
  if (!currentSwimmerId) {
    results.errors.push(`Row ${rowIndex + 1}: Skipped, no Swimmer context for time record`);
    return;
  }

  const [, eventName, bestTime, , dateStr, meetName] = values;

  if (!eventName || !bestTime || !dateStr || !meetName) {
    return; // Skip incomplete records
  }

  // Skip if time is not valid (contains 'S' suffix, etc.)
  const timeMatch = bestTime.match(/^(\d+:)?(\d+\.\d+)/);
  if (!timeMatch) {
    return;
  }

  // Convert date from MM/DD/YYYY to YYYY-MM-DD
  let meetDate = dateStr;
  if (dateStr.includes('/')) {
    const [month, day, year] = dateStr.split('/');
    meetDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Determine course type from time suffix
  let courseType = 'SCY'; // default
  if (bestTime.endsWith('L')) {
    courseType = 'LCM';
  } else if (bestTime.endsWith('S')) {
    courseType = 'SCM';
  }

  // Map event name to event ID
  const eventId = mapTeamUnifyEventToId(eventName.trim(), courseType, allEvents);
  
  if (!eventId) {
    results.errors.push(`Row ${rowIndex + 1}: Could not find matching event for "${eventName}" in ${courseType}`);
    return;
  }

  const timeRecordData = {
    swimmerId: currentSwimmerId,
    eventId: eventId,
    time: bestTime.replace(/[SLFY]$/, ''), // Remove suffix
    meetName: meetName.trim(),
    meetDate,
    isPersonalBest: true // Assuming Team Unify exports are best times
  };

  await createTimeRecord(timeRecordData, results, rowIndex, eventName);
}

// Main Team Unify import function with progress callback
export async function processTeamUnifyFile(
  file: File, 
  existingSwimmers: any[], 
  allEvents: any[],
  userClubId?: string,
  onProgress?: (progress: { currentRow: number, totalRows: number, currentAction: string, errors: string[] }) => void
): Promise<{ success: number, successTimeRecords: number, info: string[], errors: string[] }> {
  const text = await file.text();
  const lines = text.split('\n').filter(line => line.trim());

  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row');
  }

  const results = { success: 0, successTimeRecords: 0, errors: [] as string[], info: [] as string[] };
  let currentSwimmer: any = null;
  let currentSwimmerId: string | null = null;
  const totalRows = lines.length;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Update progress
    if (onProgress) {
      onProgress({
        currentRow: i + 1,
        totalRows,
        currentAction: `Processing row ${i + 1} of ${totalRows}`,
        errors: [...results.errors]
      });
    }

    // Parse CSV line properly handling quoted fields
    const values = parseCSVLine(line);
    
    if (values[0] === 'Rank') {
      // Skip header row
      if (onProgress) {
        onProgress({
          currentRow: i + 1,
          totalRows,
          currentAction: 'Skipping header row',
          errors: [...results.errors]
        });
      }
      continue;
    }
    if (values[0] === '' || !values[0]) {
      // Skip blank row
      if (onProgress) {
        onProgress({
          currentRow: i + 1,
          totalRows,
          currentAction: 'Skipping blank row',
          errors: [...results.errors]
        });
      }
      continue;
    }


    if (values[0] !== '1') {
      // This is swimmer data
      if (onProgress) {
        onProgress({
          currentRow: i + 1,
          totalRows,
          currentAction: 'Processing swimmer data...',
          errors: [...results.errors]
        });
      }

      const swimmerInfo = parseSwimmerInfo(values[0]);
      
      if (!swimmerInfo) {
        const error = `Row ${i + 1}: Could not parse swimmer info: ${values[0]}`;
        results.errors.push(error);
        if (onProgress) {
          onProgress({
            currentRow: i + 1,
            totalRows,
            currentAction: 'Error parsing swimmer data',
            errors: [...results.errors]
          });
        }
        continue;
      }

      // Check if swimmer already exists
      const existingSwimmer = existingSwimmers.find(s =>
        s.firstName.toLowerCase() === swimmerInfo.firstName.toLowerCase() &&
        s.lastName.toLowerCase() === swimmerInfo.lastName.toLowerCase() &&
        new Date(s.dateOfBirth).getTime() === new Date(swimmerInfo.dateOfBirth).getTime()
      );

      if (existingSwimmer) {
        currentSwimmer = existingSwimmer;
        currentSwimmerId = existingSwimmer.id;
        if (onProgress) {
          onProgress({
            currentRow: i + 1,
            totalRows,
            currentAction: `Found existing swimmer: ${swimmerInfo.firstName} ${swimmerInfo.lastName}`,
            errors: [...results.errors]
          });
        }
      } else {
        // Create new swimmer with clubId
        if (onProgress) {
          onProgress({
            currentRow: i + 1,
            totalRows,
            currentAction: `Creating new swimmer: ${swimmerInfo.firstName} ${swimmerInfo.lastName}`,
            errors: [...results.errors]
          });
        }

        const swimmerData = {
          ...swimmerInfo,
          ...(userClubId && { clubId: userClubId })
        };

        currentSwimmer = await createSwimmer(swimmerData, results, i);
        currentSwimmerId = currentSwimmer ? currentSwimmer.id : null;

        if (onProgress) {
          onProgress({
            currentRow: i + 1,
            totalRows,
            currentAction: currentSwimmer ? 
              `Successfully created swimmer: ${swimmerInfo.firstName} ${swimmerInfo.lastName}` :
              `Failed to create swimmer: ${swimmerInfo.firstName} ${swimmerInfo.lastName}`,
            errors: [...results.errors]
          });
        }
      }
    } else if (values[0] === '1') {
      // This is a time record for the current swimmer
      if (onProgress) {
        const eventName = values[1] || 'Unknown Event';
        onProgress({
          currentRow: i + 1,
          totalRows,
          currentAction: `Processing time record: ${eventName} for ${currentSwimmer ? `${currentSwimmer.firstName} ${currentSwimmer.lastName}` : 'Unknown Swimmer'}`,
          errors: [...results.errors]
        });
      }

      await processTimeRecord(values, currentSwimmerId, allEvents, results, i);

      if (onProgress) {
        onProgress({
          currentRow: i + 1,
          totalRows,
          currentAction: `Completed time record processing`,
          errors: [...results.errors]
        });
      }
    }

    // Small delay to allow UI updates
    if (i % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 1));
    }
  }

  // Final progress update
  if (onProgress) {
    onProgress({
      currentRow: totalRows,
      totalRows,
      currentAction: 'Import completed',
      errors: [...results.errors]
    });
  }

  // Add summary of time records created
  const timeRecordsCreated = results.success;

  return results;
}
