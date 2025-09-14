export interface Swimmer {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'M' | 'F';
  ageGroup: string;
  clubId?: string;
}

export interface SwimmerMeetEvent {
  id: string;
  swimmerId: string;
  meetId: string;
  eventId: string;
  seedTime?: string;
  createdAt: string;
}

export interface RelayTeam {
  id: string;
  meetId: string;
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
  clubId: string; // The club this meet is for (required)
  againstClubId?: string; // The club this meet is against (optional)
  createdAt: string;
}

export interface TimeRecord {
  id: string;
  swimmerId: string;
  eventId: string;
  time: string;
  meetName: string;
  meetDate: string;
  isPersonalBest: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  password: string;
  role: 'coach' | 'family' | 'admin';
  firstName: string;
  lastName: string;
  clubId?: string;
  createdAt: string;
}

export interface FamilySwimmerAssociation {
  id: string;
  userId: string;
  swimmerId: string;
  createdAt: string;
}

export interface SwimEvent {
  id: string;
  name: string;
  distance: number;
  stroke: 'freestyle' | 'backstroke' | 'breaststroke' | 'butterfly' | 'individual-medley';
  course: 'SCY' | 'LCM' | 'SCM';
  isRelay: boolean;
  ageGroups: string[];
  isActive: boolean;
}

export interface SwimClub {
  id: string;
  name: string;
  abbreviation: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  email?: string;
  website?: string;
  isActive: boolean;
}
