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
