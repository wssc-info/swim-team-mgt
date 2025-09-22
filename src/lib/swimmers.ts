// Re-export services for backward compatibility
import { SwimmerService } from './services/swimmer-service';
import { MeetService } from './services/meet-service';
import { TimeRecordService } from './services/time-record-service';
import {AGE_11_12, AGE_13_14, AGE_15_18, AGE_9_10, AGE_UNDER_8} from "@/lib/constants";

// Export types
export * from './types';

// Service instances
const swimmerService = SwimmerService.getInstance();
const meetService = MeetService.getInstance();
const timeRecordService = TimeRecordService.getInstance();

// Utility function
export function calculateAgeGroup(dateOfBirth: string): string {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
    ? age - 1 
    : age;

  if (actualAge <= 8) return AGE_UNDER_8;
  if (actualAge <= 10) return AGE_9_10;
  if (actualAge <= 12) return AGE_11_12;
  if (actualAge <= 14) return AGE_13_14;
  return AGE_15_18;
}
