import { v4 as uuidv4 } from 'uuid';
import { SwimmerModel, MeetModel, RelayTeamModel, initializeDatabase } from './database';

export interface Swimmer {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'M' | 'F';
  ageGroup: string;
  selectedEvents: string[]; // Event IDs
  seedTimes: Record<string, string>; // Event ID -> time string (MM:SS.ss)
}

export interface RelayTeam {
  id: string;
  eventId: string;
  name: string;
  swimmers: string[]; // Swimmer IDs in order
  ageGroup: string;
  gender: 'M' | 'F' | 'Mixed';
}

export interface Meet {
  id: string;
  name: string;
  date: string;
  location: string;
  availableEvents: string[]; // Event IDs that swimmers can participate in
  isActive: boolean; // Only one meet can be active at a time
  createdAt: string;
}

// Initialize database on module load
let dbInitialized = false;
async function ensureDbInitialized() {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
}

// Calculate age group based on birth date
export function calculateAgeGroup(dateOfBirth: string): string {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
    ? age - 1 
    : age;

  if (actualAge <= 8) return '8&U';
  if (actualAge <= 10) return '9-10';
  if (actualAge <= 12) return '11-12';
  if (actualAge <= 14) return '13-14';
  return '15-18';
}

// Database helpers for swimmers
export async function getSwimmers(): Promise<Swimmer[]> {
  await ensureDbInitialized();
  try {
    const swimmers = await SwimmerModel.findAll();
    return swimmers.map(swimmer => ({
      id: swimmer.id,
      firstName: swimmer.firstName,
      lastName: swimmer.lastName,
      dateOfBirth: swimmer.dateOfBirth,
      gender: swimmer.gender,
      ageGroup: swimmer.ageGroup,
      selectedEvents: JSON.parse(swimmer.selectedEvents || '[]'),
      seedTimes: JSON.parse(swimmer.seedTimes || '{}'),
    }));
  } catch (error) {
    console.error('Error fetching swimmers:', error);
    return [];
  }
}

export async function addSwimmer(swimmer: Omit<Swimmer, 'id' | 'ageGroup'>): Promise<Swimmer> {
  await ensureDbInitialized();
  const newSwimmer: Swimmer = {
    ...swimmer,
    id: uuidv4(),
    ageGroup: calculateAgeGroup(swimmer.dateOfBirth),
  };
  
  try {
    await SwimmerModel.create({
      id: newSwimmer.id,
      firstName: newSwimmer.firstName,
      lastName: newSwimmer.lastName,
      dateOfBirth: newSwimmer.dateOfBirth,
      gender: newSwimmer.gender,
      ageGroup: newSwimmer.ageGroup,
      selectedEvents: JSON.stringify(newSwimmer.selectedEvents),
      seedTimes: JSON.stringify(newSwimmer.seedTimes),
    });
    
    return newSwimmer;
  } catch (error) {
    console.error('Error adding swimmer:', error);
    throw error;
  }
}

export async function updateSwimmer(id: string, updates: Partial<Swimmer>): Promise<void> {
  await ensureDbInitialized();
  try {
    const updateData: any = { ...updates };
    
    if (updates.dateOfBirth) {
      updateData.ageGroup = calculateAgeGroup(updates.dateOfBirth);
    }
    
    if (updates.selectedEvents) {
      updateData.selectedEvents = JSON.stringify(updates.selectedEvents);
    }
    
    if (updates.seedTimes) {
      updateData.seedTimes = JSON.stringify(updates.seedTimes);
    }
    
    await SwimmerModel.update(updateData, { where: { id } });
  } catch (error) {
    console.error('Error updating swimmer:', error);
    throw error;
  }
}

export async function deleteSwimmer(id: string): Promise<void> {
  await ensureDbInitialized();
  try {
    await SwimmerModel.destroy({ where: { id } });
  } catch (error) {
    console.error('Error deleting swimmer:', error);
    throw error;
  }
}

// Database helpers for relay teams
export async function getRelayTeams(): Promise<RelayTeam[]> {
  await ensureDbInitialized();
  try {
    const teams = await RelayTeamModel.findAll();
    return teams.map(team => ({
      id: team.id,
      eventId: team.eventId,
      name: team.name,
      swimmers: JSON.parse(team.swimmers || '[]'),
      ageGroup: team.ageGroup,
      gender: team.gender,
    }));
  } catch (error) {
    console.error('Error fetching relay teams:', error);
    return [];
  }
}

export async function addRelayTeam(team: Omit<RelayTeam, 'id'>): Promise<RelayTeam> {
  await ensureDbInitialized();
  const newTeam: RelayTeam = {
    ...team,
    id: uuidv4(),
  };
  
  try {
    await RelayTeamModel.create({
      id: newTeam.id,
      eventId: newTeam.eventId,
      name: newTeam.name,
      swimmers: JSON.stringify(newTeam.swimmers),
      ageGroup: newTeam.ageGroup,
      gender: newTeam.gender,
    });
    
    return newTeam;
  } catch (error) {
    console.error('Error adding relay team:', error);
    throw error;
  }
}

export async function updateRelayTeam(id: string, updates: Partial<RelayTeam>): Promise<void> {
  await ensureDbInitialized();
  try {
    const updateData: any = { ...updates };
    
    if (updates.swimmers) {
      updateData.swimmers = JSON.stringify(updates.swimmers);
    }
    
    await RelayTeamModel.update(updateData, { where: { id } });
  } catch (error) {
    console.error('Error updating relay team:', error);
    throw error;
  }
}

export async function deleteRelayTeam(id: string): Promise<void> {
  await ensureDbInitialized();
  try {
    await RelayTeamModel.destroy({ where: { id } });
  } catch (error) {
    console.error('Error deleting relay team:', error);
    throw error;
  }
}

// Database helpers for meets
export async function getMeets(): Promise<Meet[]> {
  await ensureDbInitialized();
  try {
    const meets = await MeetModel.findAll();
    return meets.map(meet => ({
      id: meet.id,
      name: meet.name,
      date: meet.date,
      location: meet.location,
      availableEvents: JSON.parse(meet.availableEvents || '[]'),
      isActive: meet.isActive,
      createdAt: meet.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching meets:', error);
    return [];
  }
}

export async function addMeet(meet: Omit<Meet, 'id' | 'createdAt'>): Promise<Meet> {
  await ensureDbInitialized();
  const newMeet: Meet = {
    ...meet,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  
  try {
    // If this meet is being set as active, deactivate all others
    if (newMeet.isActive) {
      await MeetModel.update({ isActive: false }, { where: {} });
    }
    
    await MeetModel.create({
      id: newMeet.id,
      name: newMeet.name,
      date: newMeet.date,
      location: newMeet.location,
      availableEvents: JSON.stringify(newMeet.availableEvents),
      isActive: newMeet.isActive,
    });
    
    return newMeet;
  } catch (error) {
    console.error('Error adding meet:', error);
    throw error;
  }
}

export async function updateMeet(id: string, updates: Partial<Meet>): Promise<void> {
  await ensureDbInitialized();
  try {
    // If setting this meet as active, deactivate all others
    if (updates.isActive) {
      await MeetModel.update({ isActive: false }, { where: {} });
    }
    
    const updateData: any = { ...updates };
    
    if (updates.availableEvents) {
      updateData.availableEvents = JSON.stringify(updates.availableEvents);
    }
    
    await MeetModel.update(updateData, { where: { id } });
  } catch (error) {
    console.error('Error updating meet:', error);
    throw error;
  }
}

export async function deleteMeet(id: string): Promise<void> {
  await ensureDbInitialized();
  try {
    await MeetModel.destroy({ where: { id } });
  } catch (error) {
    console.error('Error deleting meet:', error);
    throw error;
  }
}

export async function getActiveMeet(): Promise<Meet | null> {
  await ensureDbInitialized();
  try {
    const meet = await MeetModel.findOne({ where: { isActive: true } });
    if (!meet) return null;
    
    return {
      id: meet.id,
      name: meet.name,
      date: meet.date,
      location: meet.location,
      availableEvents: JSON.parse(meet.availableEvents || '[]'),
      isActive: meet.isActive,
      createdAt: meet.createdAt.toISOString(),
    };
  } catch (error) {
    console.error('Error fetching active meet:', error);
    return null;
  }
}

export async function setActiveMeet(id: string): Promise<void> {
  await ensureDbInitialized();
  try {
    // Deactivate all meets first
    await MeetModel.update({ isActive: false }, { where: {} });
    // Then activate the specified meet
    await MeetModel.update({ isActive: true }, { where: { id } });
  } catch (error) {
    console.error('Error setting active meet:', error);
    throw error;
  }
}
