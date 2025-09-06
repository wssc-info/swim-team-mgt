import { v4 as uuidv4 } from 'uuid';

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

// Local storage helpers
export function getSwimmers(): Swimmer[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('swimmers');
  return stored ? JSON.parse(stored) : [];
}

export function saveSwimmers(swimmers: Swimmer[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('swimmers', JSON.stringify(swimmers));
}

export function addSwimmer(swimmer: Omit<Swimmer, 'id' | 'ageGroup'>): Swimmer {
  const newSwimmer: Swimmer = {
    ...swimmer,
    id: uuidv4(),
    ageGroup: calculateAgeGroup(swimmer.dateOfBirth),
  };
  
  const swimmers = getSwimmers();
  swimmers.push(newSwimmer);
  saveSwimmers(swimmers);
  
  return newSwimmer;
}

export function updateSwimmer(id: string, updates: Partial<Swimmer>): void {
  const swimmers = getSwimmers();
  const index = swimmers.findIndex(s => s.id === id);
  if (index !== -1) {
    swimmers[index] = { ...swimmers[index], ...updates };
    if (updates.dateOfBirth) {
      swimmers[index].ageGroup = calculateAgeGroup(updates.dateOfBirth);
    }
    saveSwimmers(swimmers);
  }
}

export function deleteSwimmer(id: string): void {
  const swimmers = getSwimmers();
  const filtered = swimmers.filter(s => s.id !== id);
  saveSwimmers(filtered);
}

export function getRelayTeams(): RelayTeam[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('relayTeams');
  return stored ? JSON.parse(stored) : [];
}

export function saveRelayTeams(teams: RelayTeam[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('relayTeams', JSON.stringify(teams));
}

export function addRelayTeam(team: Omit<RelayTeam, 'id'>): RelayTeam {
  const newTeam: RelayTeam = {
    ...team,
    id: uuidv4(),
  };
  
  const teams = getRelayTeams();
  teams.push(newTeam);
  saveRelayTeams(teams);
  
  return newTeam;
}

export function updateRelayTeam(id: string, updates: Partial<RelayTeam>): void {
  const teams = getRelayTeams();
  const index = teams.findIndex(t => t.id === id);
  if (index !== -1) {
    teams[index] = { ...teams[index], ...updates };
    saveRelayTeams(teams);
  }
}

export function deleteRelayTeam(id: string): void {
  const teams = getRelayTeams();
  const filtered = teams.filter(t => t.id !== id);
  saveRelayTeams(filtered);
}

// Meet management functions
export function getMeets(): Meet[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('meets');
  return stored ? JSON.parse(stored) : [];
}

export function saveMeets(meets: Meet[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('meets', JSON.stringify(meets));
}

export function addMeet(meet: Omit<Meet, 'id' | 'createdAt'>): Meet {
  const newMeet: Meet = {
    ...meet,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  
  const meets = getMeets();
  
  // If this meet is being set as active, deactivate all others
  if (newMeet.isActive) {
    meets.forEach(m => m.isActive = false);
  }
  
  meets.push(newMeet);
  saveMeets(meets);
  
  return newMeet;
}

export function updateMeet(id: string, updates: Partial<Meet>): void {
  const meets = getMeets();
  const index = meets.findIndex(m => m.id === id);
  if (index !== -1) {
    // If setting this meet as active, deactivate all others
    if (updates.isActive) {
      meets.forEach(m => m.isActive = false);
    }
    
    meets[index] = { ...meets[index], ...updates };
    saveMeets(meets);
  }
}

export function deleteMeet(id: string): void {
  const meets = getMeets();
  const filtered = meets.filter(m => m.id !== id);
  saveMeets(filtered);
}

export function getActiveMeet(): Meet | null {
  const meets = getMeets();
  return meets.find(m => m.isActive) || null;
}

export function setActiveMeet(id: string): void {
  const meets = getMeets();
  meets.forEach(m => {
    m.isActive = m.id === id;
  });
  saveMeets(meets);
}
