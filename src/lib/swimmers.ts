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

// Swimmer functions
export const getSwimmers = () => swimmerService.getSwimmers();
export const addSwimmer = (swimmer: any) => swimmerService.addSwimmer(swimmer);
export const updateSwimmer = (id: string, updates: any) => swimmerService.updateSwimmer(id, updates);
export const deleteSwimmer = (id: string) => swimmerService.deleteSwimmer(id);

// Meet functions
export const getMeets = () => meetService.getMeets();
export const addMeet = (meet: any) => meetService.addMeet(meet);
export const updateMeet = (id: string, updates: any) => meetService.updateMeet(id, updates);
export const deleteMeet = (id: string) => meetService.deleteMeet(id);
export const getActiveMeet = () => meetService.getActiveMeet();
export const setActiveMeet = (id: string) => meetService.setActiveMeet(id);

// Time record functions
export const getTimeRecords = (swimmerId?: string) => timeRecordService.getTimeRecords(swimmerId);
export const addTimeRecord = (record: any) => timeRecordService.addTimeRecord(record);
export const updateTimeRecord = (id: string, updates: any) => timeRecordService.updateTimeRecord(id, updates);
export const deleteTimeRecord = (id: string) => timeRecordService.deleteTimeRecord(id);
export const getBestTimeForEvent = (swimmerId: string, eventId: string) => timeRecordService.getBestTimeForEvent(swimmerId, eventId);

// Relay team functions (placeholder - implement RelayTeamService similarly)
// export const getRelayTeams = async () => [];
// export const addRelayTeam = async (team: any) => team;
// export const updateRelayTeam = async (id: string, updates: any) => {};
// export const deleteRelayTeam = async (id: string) => {};

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
